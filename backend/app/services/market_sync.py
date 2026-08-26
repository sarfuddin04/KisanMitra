"""
Market Price Synchronization Service
=====================================
Fetches official mandi price data from data.gov.in (AGMARKNET dataset).

API Docs: https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi

The official dataset provides daily APMC mandi prices for commodities
across Indian states. The resource ID can be configured via .env.

Flow:
  data.gov.in API  →  Validate/Normalize  →  PostgreSQL
  
If MARKET_DATA_API_KEY is not set, sync will be skipped and the status
will clearly indicate "no_api_key" — no fake prices will be generated.
"""
import datetime
import logging
import requests
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.market import (
    MarketPrice, MarketPriceHistory, PriceSyncLog,
    State, District, Mandi
)
from app.models.agronomy import Crop

logger = logging.getLogger(__name__)


# ── Constants ──────────────────────────────────────────────────────────────────

DATA_GOV_IN_BASE = "https://api.data.gov.in/resource"

# Field name mappings from data.gov.in AGMARKNET dataset
FIELD_MAP = {
    "state_name": ["state_name", "state", "State", "State Name"],
    "district_name": ["district_name", "district", "District", "District Name"],
    "market_name": ["market_name", "market", "Market", "Mandi", "mandi_name"],
    "commodity": ["commodity", "Commodity", "commodity_name", "crop", "Crop"],
    "variety": ["variety", "Variety", "grade", "Grade"],
    "min_price": ["min_price", "Min Price", "minimum_price", "min", "MinPrice"],
    "max_price": ["max_price", "Max Price", "maximum_price", "max", "MaxPrice"],
    "modal_price": ["modal_price", "Modal Price", "modal", "ModalPrice"],
    "price_date": ["arrival_date", "date", "price_date", "Date", "Arrival Date"],
}


def _get_field(record: dict, field_key: str, default=None):
    """Try multiple possible field names for a record."""
    for key in FIELD_MAP.get(field_key, []):
        val = record.get(key)
        if val is not None and str(val).strip() not in ("", "nan", "None", "null"):
            return str(val).strip()
    return default


def _parse_price(val) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(str(val).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def _parse_date(val) -> Optional[datetime.date]:
    if not val:
        return None
    val = str(val).strip()
    # Try multiple date formats from data.gov.in
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d-%b-%Y", "%Y/%m/%d"):
        try:
            return datetime.datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    return datetime.date.today()


def _get_or_create_location(db: Session, state_name: str, district_name: str, market_name: str):
    """Find or create State → District → Mandi chain."""
    if not state_name:
        return None

    state = db.query(State).filter(
        State.name.ilike(state_name.strip())
    ).first()
    if not state:
        state = State(name=state_name.strip(), is_active=True)
        db.add(state)
        db.flush()

    district = None
    if district_name:
        district = db.query(District).filter(
            District.state_id == state.id,
            District.name.ilike(district_name.strip())
        ).first()
        if not district:
            district = District(name=district_name.strip(), state_id=state.id, is_active=True)
            db.add(district)
            db.flush()

    mandi = None
    if market_name and district:
        mandi = db.query(Mandi).filter(
            Mandi.district_id == district.id,
            Mandi.name.ilike(market_name.strip())
        ).first()
        if not mandi:
            mandi = Mandi(name=market_name.strip(), district_id=district.id, is_active=True)
            db.add(mandi)
            db.flush()

    return mandi


def sync_market_prices(
    db: Session,
    sync_type: str = "scheduled",
    state_filter: Optional[str] = None,
    limit: int = 1000,
) -> PriceSyncLog:
    """
    Fetch official mandi prices from data.gov.in and store in DB.
    
    Returns a PriceSyncLog record with the result.
    Never fabricates prices — if API is unavailable, records the failure.
    """
    log = PriceSyncLog(
        sync_type=sync_type,
        data_source=settings.MARKET_DATA_SOURCE,
        started_at=datetime.datetime.utcnow(),
        status="running",
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    api_key = settings.MARKET_DATA_API_KEY.strip()
    if not api_key:
        log.status = "no_api_key"
        log.finished_at = datetime.datetime.utcnow()
        log.error_message = (
            "MARKET_DATA_API_KEY is not configured. "
            "Register at https://data.gov.in/ to get a free API key "
            "and add it to your .env file."
        )
        db.commit()
        logger.warning("Market sync skipped: no API key configured.")
        return log

    # Build request
    params = {
        "api-key": api_key,
        "format": "json",
        "limit": limit,
        "offset": 0,
    }
    if state_filter:
        params["filters[state_name]"] = state_filter

    url = f"{DATA_GOV_IN_BASE}/{settings.AGMARKNET_RESOURCE_ID}"

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.Timeout:
        log.status = "failed"
        log.finished_at = datetime.datetime.utcnow()
        log.error_message = "Request to data.gov.in timed out after 30 seconds."
        db.commit()
        return log
    except requests.exceptions.RequestException as exc:
        log.status = "failed"
        log.finished_at = datetime.datetime.utcnow()
        log.error_message = f"HTTP error: {exc}"
        db.commit()
        return log
    except Exception as exc:
        log.status = "failed"
        log.finished_at = datetime.datetime.utcnow()
        log.error_message = f"Unexpected error: {exc}"
        db.commit()
        return log

    records = data.get("records") or data.get("data") or []
    log.records_fetched = len(records)
    added = 0
    updated = 0

    for rec in records:
        try:
            state_name = _get_field(rec, "state_name", "")
            district_name = _get_field(rec, "district_name", "")
            market_name = _get_field(rec, "market_name", "")
            commodity = _get_field(rec, "commodity", "")
            variety = _get_field(rec, "variety", "Standard") or "Standard"
            min_p = _parse_price(_get_field(rec, "min_price"))
            max_p = _parse_price(_get_field(rec, "max_price"))
            modal_p = _parse_price(_get_field(rec, "modal_price"))
            price_date = _parse_date(_get_field(rec, "price_date"))

            # Skip invalid records
            if not commodity or modal_p is None:
                continue
            if min_p is None:
                min_p = modal_p
            if max_p is None:
                max_p = modal_p
            if price_date is None:
                price_date = datetime.date.today()

            # Find/create location hierarchy
            mandi = _get_or_create_location(db, state_name, district_name, market_name)
            mandi_id = mandi.id if mandi else None

            # Try to resolve crop from our crops table
            crop = None
            if commodity:
                crop = db.query(Crop).filter(
                    Crop.name.ilike(commodity.strip())
                ).first()

            source_record_id = f"{state_name}|{district_name}|{market_name}|{commodity}|{variety}|{price_date}"

            # ── Upsert into market_prices (current) ───────────────────────────
            existing = db.query(MarketPrice).filter(
                MarketPrice.mandi_id == mandi_id,
                MarketPrice.crop_name == commodity,
                MarketPrice.variety == variety,
                MarketPrice.price_date == price_date,
                MarketPrice.data_source == "data.gov.in",
            ).first()

            if existing:
                existing.min_price = min_p
                existing.max_price = max_p
                existing.modal_price = modal_p
                existing.fetched_at = datetime.datetime.utcnow()
                existing.updated_at = datetime.datetime.utcnow()
                updated += 1
            else:
                new_price = MarketPrice(
                    mandi_id=mandi_id,
                    crop_id=crop.id if crop else None,
                    crop_name=commodity,
                    variety=variety,
                    market_name=market_name,
                    state=state_name,
                    district=district_name,
                    min_price=min_p,
                    max_price=max_p,
                    modal_price=modal_p,
                    unit="Quintal",
                    price_date=price_date,
                    fetched_at=datetime.datetime.utcnow(),
                    data_source="data.gov.in",
                    source_record_id=source_record_id,
                    is_active=True,
                )
                db.add(new_price)
                added += 1

            # ── Append to history (never overwrite) ───────────────────────────
            history_exists = db.query(MarketPriceHistory).filter(
                MarketPriceHistory.mandi_id == mandi_id,
                MarketPriceHistory.crop_name == commodity,
                MarketPriceHistory.variety == variety,
                MarketPriceHistory.price_date == price_date,
                MarketPriceHistory.data_source == "data.gov.in",
            ).first()
            if not history_exists:
                hist = MarketPriceHistory(
                    mandi_id=mandi_id,
                    crop_id=crop.id if crop else None,
                    crop_name=commodity,
                    variety=variety,
                    mandi_name=market_name,
                    state=state_name,
                    district=district_name,
                    min_price=min_p,
                    max_price=max_p,
                    modal_price=modal_p,
                    unit="Quintal",
                    price_date=price_date,
                    data_source="data.gov.in",
                    fetched_at=datetime.datetime.utcnow(),
                )
                db.add(hist)

        except Exception as row_err:
            logger.warning(f"Skipping record due to error: {row_err}")
            continue

    db.commit()

    log.records_added = added
    log.records_updated = updated
    log.status = "success"
    log.finished_at = datetime.datetime.utcnow()
    db.commit()

    logger.info(
        f"Market sync complete: fetched={log.records_fetched}, "
        f"added={added}, updated={updated}"
    )
    return log


def get_last_sync_status(db: Session) -> dict:
    """Return status of the most recent sync."""
    last = (
        db.query(PriceSyncLog)
        .order_by(PriceSyncLog.started_at.desc())
        .first()
    )
    if not last:
        return {
            "has_synced": False,
            "status": "never_synced",
            "message": "No synchronization has been performed yet.",
            "last_sync": None,
        }

    status_messages = {
        "success": "Synchronization completed successfully.",
        "failed": f"Last sync failed: {last.error_message or 'Unknown error'}",
        "no_api_key": "API key not configured. Add MARKET_DATA_API_KEY to your .env file.",
        "running": "Synchronization is currently in progress.",
        "never_synced": "No synchronization has been performed yet.",
    }

    return {
        "has_synced": True,
        "status": last.status,
        "message": status_messages.get(last.status, last.status),
        "last_sync": last.finished_at or last.started_at,
        "records_fetched": last.records_fetched,
        "records_added": last.records_added,
        "records_updated": last.records_updated,
        "data_source": last.data_source,
        "sync_type": last.sync_type,
        "error": last.error_message,
    }

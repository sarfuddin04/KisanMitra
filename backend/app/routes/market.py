"""
Market Price Routes
===================
Public endpoints for mandi market prices and price history.
No authentication required for read operations.
"""
import datetime
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional

from app.core.database import get_db
from app.models.market import (
    Market, MarketPrice, MarketPriceHistory,
    Mandi, District, State, PriceSyncLog
)
from app.models.agronomy import Crop
from app.schemas.market import MarketPriceOut, MarketOut

router = APIRouter(prefix="/market-prices", tags=["Market Prices"])


# ── Helpers ─────────────────────────────────────────────────────────────────

def _price_to_out(p: MarketPrice) -> dict:
    mandi_name = p.market_name
    district_name = p.district
    state_name = p.state
    crop_display_name = p.crop_name
    mandi_image = None

    if p.mandi:
        mandi_name = p.mandi.name
        mandi_image = p.mandi.image_url
        if p.mandi.district:
            district_name = p.mandi.district.name
            if p.mandi.district.state:
                state_name = p.mandi.district.state.name

    if p.crop:
        crop_display_name = p.crop.name

    # Determine data freshness label
    data_status = _get_data_status(p)

    return {
        "id": p.id,
        "mandi_id": p.mandi_id,
        "crop_id": p.crop_id,
        "market_id": p.market_id,
        "crop_name": p.crop_name or crop_display_name,
        "crop_display_name": crop_display_name,
        "variety": p.variety,
        "market_name": mandi_name,
        "mandi_name": mandi_name,
        "mandi_image": mandi_image,
        "state": p.state or state_name,
        "state_name": state_name,
        "district": p.district or district_name,
        "district_name": district_name,
        "min_price": p.min_price,
        "max_price": p.max_price,
        "modal_price": p.modal_price,
        "unit": p.unit,
        "price_date": p.price_date,
        "fetched_at": p.fetched_at,
        "data_source": p.data_source,
        "data_status": data_status,
        "trend": p.trend,
        "change_percent": p.change_percent,
        "is_active": p.is_active,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


def _get_data_status(p: MarketPrice) -> str:
    """
    Return a truthful label:
      UPDATED_TODAY | UPDATED_RECENTLY | LATEST_AVAILABLE | DATA_UNAVAILABLE
    Never returns "LIVE" — the official AGMARKNET data is daily, not real-time.
    """
    if p.data_source == "admin_entry":
        return "ADMIN_ENTRY"

    ref = p.fetched_at or p.updated_at
    if not ref:
        return "DATA_UNAVAILABLE"

    now = datetime.datetime.utcnow()
    delta = now - ref
    if delta.days == 0:
        return "UPDATED_TODAY"
    elif delta.days <= 2:
        return "UPDATED_RECENTLY"
    elif delta.days <= 30:
        return "LATEST_AVAILABLE"
    else:
        return "DATA_UNAVAILABLE"


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[dict])
def get_market_prices(
    state_id: Optional[int] = Query(None),
    district_id: Optional[int] = Query(None),
    mandi_id: Optional[int] = Query(None),
    crop_id: Optional[int] = Query(None),
    state: Optional[str] = Query(None),
    crop_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(MarketPrice).options(
        joinedload(MarketPrice.mandi).joinedload(Mandi.district).joinedload(District.state),
        joinedload(MarketPrice.crop)
    ).filter(MarketPrice.is_active == True)

    if mandi_id:
        query = query.filter(MarketPrice.mandi_id == mandi_id)
    elif district_id:
        query = query.join(Mandi, MarketPrice.mandi_id == Mandi.id, isouter=True).filter(
            Mandi.district_id == district_id
        )
    elif state_id:
        query = (
            query
            .join(Mandi, MarketPrice.mandi_id == Mandi.id, isouter=True)
            .join(District, Mandi.district_id == District.id, isouter=True)
            .filter(District.state_id == state_id)
        )

    if crop_id:
        query = query.filter(MarketPrice.crop_id == crop_id)
    if state and state not in ("All", ""):
        query = query.filter(MarketPrice.state.ilike(f"%{state}%"))
    if crop_name and crop_name not in ("All", ""):
        query = query.filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))
    if search:
        query = query.filter(
            MarketPrice.crop_name.ilike(f"%{search}%") |
            MarketPrice.market_name.ilike(f"%{search}%") |
            MarketPrice.state.ilike(f"%{search}%") |
            MarketPrice.district.ilike(f"%{search}%")
        )

    prices = query.order_by(desc(MarketPrice.price_date), desc(MarketPrice.updated_at)).limit(limit).all()
    return [_price_to_out(p) for p in prices]


@router.get("/history")
def get_price_history(
    mandi_id: Optional[int] = Query(None),
    crop_name: Optional[str] = Query(None),
    crop_id: Optional[int] = Query(None),
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
):
    """
    Return historical prices for charting.
    Never invents missing data — only returns what exists in the DB.
    """
    since = datetime.date.today() - datetime.timedelta(days=days)

    query = db.query(MarketPriceHistory).filter(
        MarketPriceHistory.price_date >= since
    )
    if mandi_id:
        query = query.filter(MarketPriceHistory.mandi_id == mandi_id)
    if crop_name:
        query = query.filter(MarketPriceHistory.crop_name.ilike(f"%{crop_name}%"))
    if crop_id:
        query = query.filter(MarketPriceHistory.crop_id == crop_id)

    rows = query.order_by(MarketPriceHistory.price_date.asc()).all()
    return [
        {
            "date": str(r.price_date),
            "min_price": r.min_price,
            "max_price": r.max_price,
            "modal_price": r.modal_price,
            "unit": r.unit,
            "mandi_name": r.mandi_name,
            "crop_name": r.crop_name,
            "data_source": r.data_source,
        }
        for r in rows
    ]


@router.get("/sync-status")
def get_sync_status(db: Session = Depends(get_db)):
    """Return last market-price sync status for display in admin and farmer UI."""
    from app.services.market_sync import get_last_sync_status
    return get_last_sync_status(db)


@router.get("/mandis/{mandi_id}/prices")
def get_prices_for_mandi(mandi_id: int, db: Session = Depends(get_db)):
    prices = db.query(MarketPrice).options(
        joinedload(MarketPrice.mandi).joinedload(Mandi.district).joinedload(District.state),
        joinedload(MarketPrice.crop)
    ).filter(MarketPrice.mandi_id == mandi_id, MarketPrice.is_active == True)\
     .order_by(desc(MarketPrice.price_date)).all()
    return [_price_to_out(p) for p in prices]


@router.get("/markets")
def get_all_markets(db: Session = Depends(get_db)):
    return db.query(Market).filter(Market.is_active == True).all()

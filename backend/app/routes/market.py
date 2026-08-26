from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.database import get_db
from app.models.market import Market, MarketPrice, Mandi, District, State
from app.models.agronomy import Crop
from app.schemas.market import MarketPriceOut, MarketOut

router = APIRouter(prefix="/market-prices", tags=["Market Prices"])


def _price_to_out(p: MarketPrice) -> MarketPriceOut:
    """Convert a MarketPrice ORM row to MarketPriceOut with denormalized names."""
    mandi_name = None
    district_name = None
    state_name = None
    crop_display_name = None

    if p.mandi:
        mandi_name = p.mandi.name
        if p.mandi.district:
            district_name = p.mandi.district.name
            if p.mandi.district.state:
                state_name = p.mandi.district.state.name

    if p.crop:
        crop_display_name = p.crop.name

    return MarketPriceOut(
        id=p.id,
        mandi_id=p.mandi_id,
        crop_id=p.crop_id,
        market_id=p.market_id,
        crop_name=p.crop_name or crop_display_name,
        variety=p.variety,
        market_name=p.market_name or mandi_name,
        state=p.state or state_name,
        district=p.district or district_name,
        min_price=p.min_price,
        max_price=p.max_price,
        modal_price=p.modal_price,
        unit=p.unit,
        trend=p.trend,
        change_percent=p.change_percent,
        is_active=p.is_active if p.is_active is not None else True,
        mandi_name=mandi_name,
        district_name=district_name,
        state_name=state_name,
        crop_display_name=crop_display_name,
        price_date=p.price_date,
        created_at=p.created_at,
        updated_at=p.updated_at
    )


@router.get("", response_model=List[MarketPriceOut])
def get_market_prices(
    state_id: Optional[int] = Query(None),
    district_id: Optional[int] = Query(None),
    mandi_id: Optional[int] = Query(None),
    crop_id: Optional[int] = Query(None),
    state: Optional[str] = Query(None),
    crop_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Fetch market prices with full hierarchical filtering.
    Supports both new FK-based filters (state_id, district_id, mandi_id, crop_id)
    and legacy string filters (state, crop_name, search).
    """
    query = db.query(MarketPrice).options(
        joinedload(MarketPrice.mandi).joinedload(Mandi.district).joinedload(District.state),
        joinedload(MarketPrice.crop)
    )

    # New hierarchy filters
    if mandi_id:
        query = query.filter(MarketPrice.mandi_id == mandi_id)
    elif district_id:
        query = query.join(Mandi, MarketPrice.mandi_id == Mandi.id, isouter=True).filter(
            Mandi.district_id == district_id
        )
    elif state_id:
        query = query.join(Mandi, MarketPrice.mandi_id == Mandi.id, isouter=True)\
                     .join(District, Mandi.district_id == District.id, isouter=True)\
                     .filter(District.state_id == state_id)

    if crop_id:
        query = query.filter(MarketPrice.crop_id == crop_id)

    # Legacy string filters
    if state and state != "All":
        query = query.filter(MarketPrice.state.ilike(f"%{state}%"))
    if crop_name and crop_name != "All":
        query = query.filter(
            (MarketPrice.crop_name.ilike(f"%{crop_name}%"))
        )
    if search:
        query = query.filter(
            (MarketPrice.crop_name.ilike(f"%{search}%")) |
            (MarketPrice.market_name.ilike(f"%{search}%")) |
            (MarketPrice.state.ilike(f"%{search}%"))
        )

    prices = query.order_by(MarketPrice.updated_at.desc()).limit(limit).all()
    return [_price_to_out(p) for p in prices]


@router.get("/mandis/{mandi_id}/prices", response_model=List[MarketPriceOut])
def get_prices_for_mandi(mandi_id: int, db: Session = Depends(get_db)):
    """Get all market prices for a specific mandi."""
    prices = db.query(MarketPrice).options(
        joinedload(MarketPrice.mandi).joinedload(Mandi.district).joinedload(District.state),
        joinedload(MarketPrice.crop)
    ).filter(MarketPrice.mandi_id == mandi_id).order_by(MarketPrice.price_date.desc()).all()
    return [_price_to_out(p) for p in prices]


@router.get("/markets", response_model=List[MarketOut])
def get_all_markets(db: Session = Depends(get_db)):
    """Legacy endpoint: list all active markets."""
    return db.query(Market).filter(Market.is_active == True).all()

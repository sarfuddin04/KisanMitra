from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.market import Market, MarketPrice
from app.schemas.market import MarketPriceOut, MarketOut

router = APIRouter(prefix="/market-prices", tags=["Market Prices"])

@router.get("", response_model=List[MarketPriceOut])
def get_market_prices(
    state: Optional[str] = Query(None),
    crop_name: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MarketPrice)
    if state and state != "All":
        query = query.filter(MarketPrice.state.ilike(f"%{state}%"))
    if crop_name and crop_name != "All":
        query = query.filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))
    if search:
        query = query.filter(
            (MarketPrice.crop_name.ilike(f"%{search}%")) |
            (MarketPrice.market_name.ilike(f"%{search}%")) |
            (MarketPrice.state.ilike(f"%{search}%"))
        )
    return query.order_by(MarketPrice.updated_at.desc()).limit(100).all()

@router.get("/markets", response_model=List[MarketOut])
def get_all_markets(db: Session = Depends(get_db)):
    return db.query(Market).filter(Market.is_active == True).all()

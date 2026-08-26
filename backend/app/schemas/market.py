from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# ==================== LEGACY MARKET ====================

class MarketBase(BaseModel):
    name: str
    state: str
    district: str
    market_type: Optional[str] = "APMC Mandi"
    address: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = True


class MarketCreate(MarketBase):
    pass


class MarketUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    market_type: Optional[str] = None
    address: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None


class MarketOut(MarketBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== MARKET PRICE ====================

class MarketPriceBase(BaseModel):
    # New structured FK references
    mandi_id: Optional[int] = None
    crop_id: Optional[int] = None
    # Legacy flat fields
    market_id: Optional[int] = None
    crop_name: Optional[str] = None
    variety: Optional[str] = "Standard"
    market_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    # Price fields
    min_price: float
    max_price: float
    modal_price: float
    unit: Optional[str] = "₹ / Quintal"
    trend: Optional[str] = "STABLE"
    change_percent: Optional[float] = 0.0
    is_active: Optional[bool] = True


class MarketPriceCreate(MarketPriceBase):
    pass


class MarketPriceUpdate(BaseModel):
    mandi_id: Optional[int] = None
    crop_id: Optional[int] = None
    market_id: Optional[int] = None
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    market_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    modal_price: Optional[float] = None
    unit: Optional[str] = None
    trend: Optional[str] = None
    change_percent: Optional[float] = None
    is_active: Optional[bool] = None


class MarketPriceOut(MarketPriceBase):
    id: int
    # Denormalized display fields
    mandi_name: Optional[str] = None
    district_name: Optional[str] = None
    state_name: Optional[str] = None
    crop_display_name: Optional[str] = None
    price_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== WEATHER ====================

class WeatherOut(BaseModel):
    location: str
    state: Optional[str] = "India"
    temperature: float
    feels_like: Optional[float] = None
    humidity: float
    condition: str
    rainfall: float
    wind_speed: float
    uv_index: Optional[float] = 5.0
    air_quality: Optional[str] = "Good (AQI 45)"
    forecast_daily: List[Dict[str, Any]] = []
    advisory: Optional[str] = None

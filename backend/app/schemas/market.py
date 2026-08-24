from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

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

class MarketPriceBase(BaseModel):
    market_id: Optional[int] = None
    crop_name: str
    variety: Optional[str] = "Standard"
    market_name: str
    state: str
    min_price: float
    max_price: float
    modal_price: float
    unit: Optional[str] = "₹ / Quintal"
    trend: Optional[str] = "UP"
    change_percent: Optional[float] = 0.0

class MarketPriceCreate(MarketPriceBase):
    pass

class MarketPriceUpdate(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    market_name: Optional[str] = None
    state: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    modal_price: Optional[float] = None
    unit: Optional[str] = None
    trend: Optional[str] = None
    change_percent: Optional[float] = None

class MarketPriceOut(MarketPriceBase):
    id: int
    price_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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

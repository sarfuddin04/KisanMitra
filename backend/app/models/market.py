import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    state = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=False)
    market_type = Column(String(50), default="APMC Mandi")  # APMC Mandi, Rural Haat, Wholesale, Terminal
    address = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    prices = relationship("MarketPrice", back_populates="market", cascade="all, delete-orphan")

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=True)
    crop_name = Column(String(100), index=True, nullable=False)
    variety = Column(String(100), default="Standard")
    market_name = Column(String(150), nullable=False)
    state = Column(String(100), nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    unit = Column(String(50), default="₹ / Quintal")
    price_date = Column(DateTime, default=datetime.datetime.utcnow)
    trend = Column(String(20), default="UP")  # UP, DOWN, STABLE
    change_percent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    market = relationship("Market", back_populates="prices")

class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String(150), index=True, nullable=False)
    state = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    rainfall_mm = Column(Float, default=0.0)
    wind_speed_kmh = Column(Float, default=0.0)
    condition = Column(String(100), default="Clear")
    forecast_data = Column(Text, nullable=True)  # JSON string of 7-day forecast
    advisory = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

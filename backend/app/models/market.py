import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base


# ==================== NEW LOCATION HIERARCHY ====================

class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    districts = relationship("District", back_populates="state", cascade="all, delete-orphan")


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey("states.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    state = relationship("State", back_populates="districts")
    mandis = relationship("Mandi", back_populates="district", cascade="all, delete-orphan")


class Mandi(Base):
    __tablename__ = "mandis"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    address = Column(String(255), nullable=True)
    pincode = Column(String(10), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact_number = Column(String(20), nullable=True)
    opening_time = Column(String(20), nullable=True)   # e.g. "06:00"
    closing_time = Column(String(20), nullable=True)   # e.g. "20:00"
    mandi_type = Column(String(50), default="APMC Mandi")  # APMC Mandi, Rural Haat, Wholesale, Terminal
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    district = relationship("District", back_populates="mandis")
    prices = relationship("MarketPrice", back_populates="mandi", foreign_keys="MarketPrice.mandi_id")


# ==================== LEGACY MARKET (kept for backward compatibility) ====================

class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    state = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=False)
    market_type = Column(String(50), default="APMC Mandi")
    address = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    legacy_prices = relationship("MarketPrice", back_populates="market", foreign_keys="MarketPrice.market_id")


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    # New FK references to structured hierarchy
    mandi_id = Column(Integer, ForeignKey("mandis.id", ondelete="SET NULL"), nullable=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="SET NULL"), nullable=True, index=True)
    # Legacy flat fields (kept for backward compat)
    market_id = Column(Integer, ForeignKey("markets.id", ondelete="SET NULL"), nullable=True)
    crop_name = Column(String(100), index=True, nullable=True)
    variety = Column(String(100), default="Standard")
    market_name = Column(String(150), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    # Price fields
    min_price = Column(Float, nullable=False, default=0.0)
    max_price = Column(Float, nullable=False, default=0.0)
    modal_price = Column(Float, nullable=False, default=0.0)
    unit = Column(String(50), default="₹ / Quintal")
    price_date = Column(DateTime, default=datetime.datetime.utcnow)
    trend = Column(String(20), default="STABLE")  # UP, DOWN, STABLE
    change_percent = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    mandi = relationship("Mandi", back_populates="prices", foreign_keys=[mandi_id])
    market = relationship("Market", back_populates="legacy_prices", foreign_keys=[market_id])
    crop = relationship("Crop", foreign_keys=[crop_id])


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

import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Date, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


# ==================== LOCATION HIERARCHY ====================

class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(10), nullable=True)          # e.g. "UP", "MH"
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    districts = relationship("District", back_populates="state", cascade="all, delete-orphan")


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey("states.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    image_url = Column(String(255), nullable=True)
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
    opening_time = Column(String(20), nullable=True)    # e.g. "06:00"
    closing_time = Column(String(20), nullable=True)    # e.g. "20:00"
    mandi_type = Column(String(50), default="APMC Mandi")
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    district = relationship("District", back_populates="mandis")
    prices = relationship("MarketPrice", back_populates="mandi", foreign_keys="MarketPrice.mandi_id")


# ==================== LEGACY MARKET (backward compat) ====================

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


# ==================== MARKET PRICE (Current) ====================

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)

    # Hierarchy FKs
    mandi_id = Column(Integer, ForeignKey("mandis.id", ondelete="SET NULL"), nullable=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="SET NULL"), nullable=True, index=True)
    market_id = Column(Integer, ForeignKey("markets.id", ondelete="SET NULL"), nullable=True)   # legacy

    # Denormalized text fields (for quick display & legacy compat)
    crop_name = Column(String(100), index=True, nullable=True)
    variety = Column(String(100), default="Standard")
    market_name = Column(String(150), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)

    # Pricing
    min_price = Column(Float, nullable=False, default=0.0)
    max_price = Column(Float, nullable=False, default=0.0)
    modal_price = Column(Float, nullable=False, default=0.0)
    unit = Column(String(50), default="Quintal")

    # Date / source tracking
    price_date = Column(Date, nullable=True)                    # The date price is for
    fetched_at = Column(DateTime, nullable=True)                # When we pulled it from API
    data_source = Column(String(100), default="admin_entry")    # "data.gov.in", "agmarknet", "admin_entry"
    source_record_id = Column(String(100), nullable=True)       # External record ID for dedup

    # Status
    trend = Column(String(20), default="STABLE")   # UP, DOWN, STABLE
    change_percent = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    mandi = relationship("Mandi", back_populates="prices", foreign_keys=[mandi_id])
    market = relationship("Market", back_populates="legacy_prices", foreign_keys=[market_id])
    crop = relationship("Crop", foreign_keys=[crop_id])

    __table_args__ = (
        UniqueConstraint("mandi_id", "crop_name", "variety", "price_date", "data_source",
                         name="uq_price_mandi_crop_date_source"),
    )


# ==================== MARKET PRICE HISTORY ====================

class MarketPriceHistory(Base):
    """Append-only historical price records — never overwrite."""
    __tablename__ = "market_price_history"

    id = Column(Integer, primary_key=True, index=True)
    mandi_id = Column(Integer, ForeignKey("mandis.id", ondelete="SET NULL"), nullable=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="SET NULL"), nullable=True, index=True)
    crop_name = Column(String(100), index=True, nullable=False)
    variety = Column(String(100), default="Standard")
    mandi_name = Column(String(150), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    unit = Column(String(50), default="Quintal")
    price_date = Column(Date, nullable=False, index=True)
    data_source = Column(String(100), default="admin_entry")
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("mandi_id", "crop_name", "variety", "price_date", "data_source",
                         name="uq_history_mandi_crop_date_source"),
    )


# ==================== PRICE SYNC LOG ====================

class PriceSyncLog(Base):
    """Audit log for every market-price synchronization attempt."""
    __tablename__ = "price_sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    sync_type = Column(String(50), default="scheduled")   # "scheduled", "manual"
    data_source = Column(String(100), default="data.gov.in")
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="running")         # running / success / failed / no_api_key
    records_fetched = Column(Integer, default=0)
    records_added = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)


# ==================== WEATHER ====================

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
    forecast_data = Column(Text, nullable=True)  # JSON
    advisory = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

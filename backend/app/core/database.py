import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("kisanmitra.database")

Base = declarative_base()

# Absolute path for SQLite fallback
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLITE_DB_PATH = os.path.join(BACKEND_DIR, "kisanmitra.db")

ACTIVE_DB_TYPE = "UNKNOWN"
ACTIVE_DB_TARGET = ""

def get_engine():
    global ACTIVE_DB_TYPE, ACTIVE_DB_TARGET
    db_url = settings.DATABASE_URL
    try:
        if db_url.startswith("postgresql"):
            test_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 3}
            )
            # Test connection
            with test_engine.connect() as conn:
                db_name = db_url.split("/")[-1].split("?")[0]
                print(f"\n[OK] [DATABASE CONNECTED] PostgreSQL Active -> Database: '{db_name}'\n")
                logger.info(f"Successfully connected to PostgreSQL database: {db_name}")
                ACTIVE_DB_TYPE = "PostgreSQL"
                ACTIVE_DB_TARGET = db_name
                return test_engine
        else:
            print(f"\n[OK] [DATABASE CONNECTED] Custom Engine -> {db_url}\n")
            ACTIVE_DB_TYPE = "Custom"
            ACTIVE_DB_TARGET = db_url
            return create_engine(db_url, connect_args={"check_same_thread": False})
    except Exception as e:
        sqlite_url = f"sqlite:///{SQLITE_DB_PATH}"
        print(f"\n[WARN] [DATABASE NOTICE] PostgreSQL connection failed ({e}).")
        print(f"[WARN] [DATABASE ACTIVE] Fallback to Local SQLite DB -> {SQLITE_DB_PATH}\n")
        logger.warning(
            f"PostgreSQL connection failed ({e}). Falling back to SQLite local database at {SQLITE_DB_PATH}"
        )
        ACTIVE_DB_TYPE = "SQLite"
        ACTIVE_DB_TARGET = SQLITE_DB_PATH
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

from sqlalchemy import text

def sync_schema(eng):
    """Add any new columns to existing tables that may not exist yet (safe ALTER TABLE)."""
    try:
        with eng.begin() as conn:
            dialect_name = eng.dialect.name
            if dialect_name == "postgresql":
                # ---------- Users ----------
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);"))
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);"))
                # ---------- Crops ----------
                conn.execute(text("ALTER TABLE crops ADD COLUMN IF NOT EXISTS suitable_soil VARCHAR(200);"))
                conn.execute(text("ALTER TABLE crops ADD COLUMN IF NOT EXISTS ph_range VARCHAR(50);"))
                # ---------- Fertilizers ----------
                conn.execute(text("ALTER TABLE fertilizers ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);"))
                conn.execute(text("ALTER TABLE fertilizers ADD COLUMN IF NOT EXISTS brand VARCHAR(100);"))
                conn.execute(text("ALTER TABLE fertilizers ADD COLUMN IF NOT EXISTS soil_condition_suitability VARCHAR(255);"))
                conn.execute(text("ALTER TABLE fertilizers ADD COLUMN IF NOT EXISTS current_price FLOAT;"))
                conn.execute(text("ALTER TABLE fertilizers ADD COLUMN IF NOT EXISTS price_unit VARCHAR(50) DEFAULT '50kg bag';"))
                conn.execute(text("ALTER TABLE fertilizers ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMP;"))
                conn.execute(text("ALTER TABLE fertilizers ADD COLUMN IF NOT EXISTS price_source VARCHAR(100) DEFAULT 'admin_entry';"))
                # ---------- Products ----------
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS state_id INTEGER;"))
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS district_id INTEGER;"))
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS mandi_id INTEGER;"))
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS state_name VARCHAR(100);"))
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS district_name VARCHAR(100);"))
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS mandi_name VARCHAR(150);"))
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;"))
                conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 4.8;"))
                # ---------- Product Categories ----------
                conn.execute(text("ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS icon_name VARCHAR(50) DEFAULT 'Sprout';"))
                # ---------- Market Prices ----------
                conn.execute(text("ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS mandi_id INTEGER;"))
                conn.execute(text("ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS crop_id INTEGER;"))
                conn.execute(text("ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS district VARCHAR(100);"))
                conn.execute(text("ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
            elif dialect_name == "sqlite":
                def _add_col_if_missing(table, col, col_def):
                    res = conn.execute(text(f"PRAGMA table_info({table});")).fetchall()
                    cols = [r[1] for r in res]
                    if col not in cols:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def};"))
                _add_col_if_missing("users", "gender", "VARCHAR(20)")
                _add_col_if_missing("user_profiles", "gender", "VARCHAR(20)")
                _add_col_if_missing("crops", "suitable_soil", "VARCHAR(200)")
                _add_col_if_missing("crops", "ph_range", "VARCHAR(50)")
                _add_col_if_missing("fertilizers", "image_url", "VARCHAR(255)")
                _add_col_if_missing("fertilizers", "brand", "VARCHAR(100)")
                _add_col_if_missing("fertilizers", "soil_condition_suitability", "VARCHAR(255)")
                _add_col_if_missing("fertilizers", "current_price", "FLOAT")
                _add_col_if_missing("fertilizers", "price_unit", "VARCHAR(50) DEFAULT '50kg bag'")
                _add_col_if_missing("fertilizers", "price_updated_at", "TIMESTAMP")
                _add_col_if_missing("fertilizers", "price_source", "VARCHAR(100) DEFAULT 'admin_entry'")
                _add_col_if_missing("products", "state_id", "INTEGER")
                _add_col_if_missing("products", "district_id", "INTEGER")
                _add_col_if_missing("products", "mandi_id", "INTEGER")
                _add_col_if_missing("products", "state_name", "VARCHAR(100)")
                _add_col_if_missing("products", "district_name", "VARCHAR(100)")
                _add_col_if_missing("products", "mandi_name", "VARCHAR(150)")
                _add_col_if_missing("products", "is_available", "BOOLEAN DEFAULT 1")
                _add_col_if_missing("products", "rating", "FLOAT DEFAULT 4.8")
                _add_col_if_missing("product_categories", "icon_name", "VARCHAR(50) DEFAULT 'Sprout'")
                _add_col_if_missing("market_prices", "mandi_id", "INTEGER")
                _add_col_if_missing("market_prices", "crop_id", "INTEGER")
                _add_col_if_missing("market_prices", "district", "VARCHAR(100)")
                _add_col_if_missing("market_prices", "is_active", "BOOLEAN DEFAULT 1")
    except Exception as e:
        logger.warning(f"Schema sync notice: {e}")

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_status():
    return {
        "db_type": ACTIVE_DB_TYPE,
        "target": ACTIVE_DB_TARGET,
        "is_connected": True
    }


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


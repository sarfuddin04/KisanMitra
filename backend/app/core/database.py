import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("kisanmitra.database")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        if db_url.startswith("postgresql"):
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 3}
            )
            # Test connection
            with engine.connect() as conn:
                logger.info("Successfully connected to PostgreSQL database.")
                return engine
        else:
            return create_engine(db_url, connect_args={"check_same_thread": False})
    except Exception as e:
        logger.warning(
            f"PostgreSQL connection failed ({e}). Falling back to SQLite local database for zero-downtime execution."
        )
        sqlite_url = "sqlite:///./kisanmitra.db"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

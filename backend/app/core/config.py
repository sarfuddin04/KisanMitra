import os
import sys
from pydantic_settings import BaseSettings
from typing import List

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

class Settings(BaseSettings):
    PROJECT_NAME: str = "KisanMitra AI"
    TAGLINE: str = "Your Intelligent Farming Companion"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "kisanmitra-ai-super-secure-secret-key-2026-btech-cse")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://kisanmitra_user:KisanMitra2026@localhost:5432/kisanmitra"
    )
    
    # External APIs
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Official Market Data API (data.gov.in / AGMARKNET)
    MARKET_DATA_API_KEY: str = os.getenv("MARKET_DATA_API_KEY", "")
    MARKET_DATA_SOURCE: str = os.getenv("MARKET_DATA_SOURCE", "data.gov.in")
    AGMARKNET_RESOURCE_ID: str = os.getenv(
        "AGMARKNET_RESOURCE_ID", 
        "9ef84268-d588-465a-a308-a864a43d0070"
    )
    MARKET_DATA_BASE_URL: str = "https://api.data.gov.in/resource"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # File Storage
    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "storage"
    )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "leaf_images"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "products"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "reports"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "crops"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "fertilizers"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "mandis"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "states"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "districts"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "profiles"), exist_ok=True)

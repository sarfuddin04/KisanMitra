import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal, sync_schema
from app.utils.seeder import seed_database
from app.routes import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB tables exist, columns are synced, and are seeded
    sync_schema(engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="KisanMitra AI - Your Intelligent Farming Companion (FastAPI + PostgreSQL + AI/ML)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files for Uploads and Assets
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/api/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

from app.routes.auth import router as auth_router
from app.routes.crops import router as crops_router
from app.routes.recommendations import router as rec_router
from app.routes.disease import router as disease_router
from app.routes.fertilizer import router as fertilizer_router
from app.routes.weather import router as weather_router
from app.routes.market import router as market_router
from app.routes.tips import router as tips_router
from app.routes.ai_chat import router as ai_chat_router
from app.routes.marketplace import router as marketplace_router
from app.routes.cart import router as cart_router
from app.routes.orders import router as orders_router
from app.routes.notifications import router as notif_router
from app.routes.public import router as public_router
from app.routes.admin import router as admin_router

# Mount all API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(crops_router, prefix=settings.API_V1_STR)
app.include_router(rec_router, prefix=settings.API_V1_STR)

app.include_router(disease_router, prefix=settings.API_V1_STR)
app.include_router(fertilizer_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(market_router, prefix=settings.API_V1_STR)
app.include_router(tips_router, prefix=settings.API_V1_STR)
app.include_router(ai_chat_router, prefix=settings.API_V1_STR)
app.include_router(marketplace_router, prefix=settings.API_V1_STR)
app.include_router(cart_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(notif_router, prefix=settings.API_V1_STR)
app.include_router(public_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

from app.core.database import get_db_status

@app.get("/")
def root_endpoint():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "status": "Operational",
        "database": get_db_status(),
        "docs_url": "/docs",
        "api_v1": "/api"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "KisanMitra AI Backend",
        "database": get_db_status()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

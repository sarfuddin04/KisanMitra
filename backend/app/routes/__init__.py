from fastapi import APIRouter

from app.routes.auth import router as auth_router
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
from app.routes.crops import router as crops_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(crops_router)
api_router.include_router(rec_router)
api_router.include_router(disease_router)
api_router.include_router(fertilizer_router)
api_router.include_router(weather_router)
api_router.include_router(market_router)
api_router.include_router(tips_router)
api_router.include_router(ai_chat_router)
api_router.include_router(marketplace_router)
api_router.include_router(cart_router)
api_router.include_router(orders_router)
api_router.include_router(notif_router)
api_router.include_router(public_router)
api_router.include_router(admin_router)


from fastapi import APIRouter, Query
from app.schemas.market import WeatherOut
from app.services.weather_service import get_weather_forecast

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.get("", response_model=WeatherOut)
def get_weather(location: str = Query("Lucknow", description="City or agricultural district")):
    return get_weather_forecast(location=location)

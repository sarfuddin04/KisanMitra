"""
Weather API Routes
==================
Backend-proxied weather endpoints — API key NEVER sent to frontend.

- GET /api/weather/current?location=...  OR  ?lat=...&lon=...
- GET /api/weather/forecast?location=...&days=7  OR  ?lat=...&lon=...&days=7
"""
from fastapi import APIRouter, Query
from typing import Optional

from app.services.weather_service import get_current_weather, get_weather_forecast
from app.core.config import settings

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/status")
def weather_status():
    """
    Weather integration health check.
    Returns configuration status WITHOUT exposing the API key.
    """
    key = (settings.WEATHER_API_KEY or "").strip()
    is_configured = bool(key) and key not in ("", "YOUR_API_KEY", "demo-key", "test-key")

    return {
        "configured": is_configured,
        "provider": "WeatherAPI.com",
        "base_url": settings.WEATHER_API_BASE_URL,
        "cache_ttl_minutes": settings.WEATHER_CACHE_MINUTES,
        "status": "Connected" if is_configured else "Not Configured",
        "message": (
            "Weather service is active and ready."
            if is_configured
            else "WEATHER_API_KEY environment variable is not set. Weather data will be unavailable."
        ),
    }


@router.get("/current")
def weather_current(
    location: Optional[str] = Query(None, description="City/district name"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
):
    """Get current weather. Provide either 'location' or 'lat'+'lon'."""
    return get_current_weather(location=location, lat=lat, lon=lon)


@router.get("/forecast")
def weather_forecast(
    location: Optional[str] = Query(None, description="City/district name"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    days: int = Query(7, ge=1, le=7, description="Number of forecast days"),
):
    """Get weather forecast (up to 7 days). Provide either 'location' or 'lat'+'lon'."""
    return get_weather_forecast(location=location, lat=lat, lon=lon, days=days)


# ── Legacy compatibility endpoint ──────────────────────────────────────────────
# The old frontend calls GET /api/weather?location=...
# Keep it working but redirect to the new forecast data shape.

@router.get("")
def weather_legacy(
    location: str = Query("Lucknow", description="City or agricultural district"),
):
    """Legacy endpoint — returns forecast data for backward compatibility."""
    forecast_data = get_weather_forecast(location=location, days=7)

    # If error, return a compatible shape so old UI doesn't crash
    if "error" in forecast_data:
        return {
            "location": location,
            "state": "",
            "temperature": None,
            "feels_like": None,
            "humidity": None,
            "condition": "Data unavailable",
            "rainfall": 0.0,
            "wind_speed": 0.0,
            "uv_index": None,
            "forecast_daily": [],
            "advisory": forecast_data["error"],
            "error": forecast_data["error"],
        }

    current = forecast_data.get("current", {})
    return {
        "location": current.get("location", location),
        "state": current.get("state", ""),
        "temperature": current.get("temperature"),
        "feels_like": current.get("feels_like"),
        "humidity": current.get("humidity"),
        "condition": current.get("condition", ""),
        "icon_url": current.get("icon_url"),
        "rainfall": current.get("rainfall", 0.0),
        "wind_speed": current.get("wind_speed", 0.0),
        "wind_direction": current.get("wind_direction", ""),
        "pressure": current.get("pressure"),
        "visibility": current.get("visibility"),
        "uv_index": current.get("uv_index"),
        "last_updated": current.get("last_updated", ""),
        "forecast_daily": forecast_data.get("forecast_daily", []),
        "advisory": forecast_data.get("advisory", ""),
    }

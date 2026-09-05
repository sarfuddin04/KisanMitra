"""
Weather Service — WeatherAPI.com Integration
=============================================
Backend-only service: API key NEVER exposed to frontend.

- get_current_weather()  → current conditions
- get_weather_forecast() → up to 7-day forecast

Uses TTL caching to avoid redundant API calls per WEATHER_CACHE_MINUTES.
Never fabricates weather data. If the API fails, returns an error dict.
"""
import logging
import requests
import datetime
from typing import Dict, Any, Optional
from cachetools import TTLCache

from app.core.config import settings

logger = logging.getLogger("kisanmitra.weather")

# ── In-memory TTL cache ────────────────────────────────────────────────────────
_weather_cache = TTLCache(
    maxsize=256,
    ttl=max(settings.WEATHER_CACHE_MINUTES, 1) * 60,
)


def _cache_key(endpoint: str, location: Optional[str], lat: Optional[float], lon: Optional[float], days: int = 1) -> str:
    if lat is not None and lon is not None:
        return f"{endpoint}:{lat:.4f},{lon:.4f}:{days}"
    return f"{endpoint}:{(location or 'auto').lower().strip()}:{days}"


def _make_request(endpoint: str, params: dict) -> Optional[dict]:
    """Call WeatherAPI.com and return parsed JSON, or None on failure."""
    api_key = settings.WEATHER_API_KEY.strip()
    if not api_key:
        logger.warning("WEATHER_API_KEY not configured. Weather data unavailable.")
        return None

    url = f"{settings.WEATHER_API_BASE_URL}/{endpoint}"
    params["key"] = api_key

    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            logger.warning(f"WeatherAPI returned {resp.status_code}: {resp.text[:200]}")
            return None
    except requests.exceptions.Timeout:
        logger.warning("WeatherAPI request timed out.")
        return None
    except requests.exceptions.RequestException as exc:
        logger.warning(f"WeatherAPI request error: {exc}")
        return None


def _build_location_q(location: Optional[str], lat: Optional[float], lon: Optional[float]) -> Optional[str]:
    """Build the `q` parameter for WeatherAPI."""
    if lat is not None and lon is not None:
        return f"{lat},{lon}"
    if location:
        return location.strip()
    return None


# ── Public API ─────────────────────────────────────────────────────────────────

def get_current_weather(
    location: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Fetch current weather from WeatherAPI.com.
    Returns real data ONLY. Returns error dict if unavailable.
    """
    ck = _cache_key("current", location, lat, lon)
    cached = _weather_cache.get(ck)
    if cached is not None:
        return cached

    q = _build_location_q(location, lat, lon)
    if not q:
        return {"error": "No location provided for weather lookup."}

    data = _make_request("current.json", {"q": q, "aqi": "no"})
    if not data:
        return {"error": "Weather data temporarily unavailable."}

    loc = data.get("location", {})
    cur = data.get("current", {})
    cond = cur.get("condition", {})

    result = {
        "location": f"{loc.get('name', '')}, {loc.get('region', '')}",
        "country": loc.get("country", ""),
        "state": loc.get("region", ""),
        "latitude": loc.get("lat"),
        "longitude": loc.get("lon"),
        "local_time": loc.get("localtime", ""),
        "temperature": cur.get("temp_c"),
        "feels_like": cur.get("feelslike_c"),
        "humidity": cur.get("humidity"),
        "condition": cond.get("text", ""),
        "icon_url": f"https:{cond.get('icon', '')}" if cond.get("icon") else None,
        "rainfall": cur.get("precip_mm", 0.0),
        "wind_speed": cur.get("wind_kph", 0.0),
        "wind_direction": cur.get("wind_dir", ""),
        "pressure": cur.get("pressure_mb"),
        "visibility": cur.get("vis_km"),
        "uv_index": cur.get("uv"),
        "cloud_cover": cur.get("cloud"),
        "last_updated": cur.get("last_updated", ""),
    }

    _weather_cache[ck] = result
    return result


def get_weather_forecast(
    location: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    days: int = 7,
) -> Dict[str, Any]:
    """
    Fetch weather forecast (up to 7 days) from WeatherAPI.com.
    Returns real data ONLY. Returns error dict if unavailable.
    """
    days = max(1, min(days, 7))
    ck = _cache_key("forecast", location, lat, lon, days)
    cached = _weather_cache.get(ck)
    if cached is not None:
        return cached

    q = _build_location_q(location, lat, lon)
    if not q:
        return {"error": "No location provided for weather lookup."}

    data = _make_request("forecast.json", {"q": q, "days": days, "aqi": "no", "alerts": "no"})
    if not data:
        return {"error": "Weather data temporarily unavailable."}

    loc = data.get("location", {})
    cur = data.get("current", {})
    cond = cur.get("condition", {})
    forecast_days = data.get("forecast", {}).get("forecastday", [])

    # Current weather
    current = {
        "location": f"{loc.get('name', '')}, {loc.get('region', '')}",
        "country": loc.get("country", ""),
        "state": loc.get("region", ""),
        "latitude": loc.get("lat"),
        "longitude": loc.get("lon"),
        "local_time": loc.get("localtime", ""),
        "temperature": cur.get("temp_c"),
        "feels_like": cur.get("feelslike_c"),
        "humidity": cur.get("humidity"),
        "condition": cond.get("text", ""),
        "icon_url": f"https:{cond.get('icon', '')}" if cond.get("icon") else None,
        "rainfall": cur.get("precip_mm", 0.0),
        "wind_speed": cur.get("wind_kph", 0.0),
        "wind_direction": cur.get("wind_dir", ""),
        "pressure": cur.get("pressure_mb"),
        "visibility": cur.get("vis_km"),
        "uv_index": cur.get("uv"),
        "cloud_cover": cur.get("cloud"),
        "last_updated": cur.get("last_updated", ""),
    }

    # Daily forecast
    forecast_list = []
    for fd in forecast_days:
        day_data = fd.get("day", {})
        day_cond = day_data.get("condition", {})
        date_str = fd.get("date", "")
        try:
            d_obj = datetime.date.fromisoformat(date_str)
            day_name = d_obj.strftime("%a")
        except (ValueError, TypeError):
            day_name = ""

        forecast_list.append({
            "date": date_str,
            "day": day_name,
            "max_temp": day_data.get("maxtemp_c"),
            "min_temp": day_data.get("mintemp_c"),
            "avg_temp": day_data.get("avgtemp_c"),
            "condition": day_cond.get("text", ""),
            "icon_url": f"https:{day_cond.get('icon', '')}" if day_cond.get("icon") else None,
            "chance_of_rain": day_data.get("daily_chance_of_rain", 0),
            "total_precip_mm": day_data.get("totalprecip_mm", 0.0),
            "avg_humidity": day_data.get("avghumidity"),
            "max_wind_kph": day_data.get("maxwind_kph"),
            "uv_index": day_data.get("uv"),
        })

    # Agricultural advisory based on real current data
    advisory = _generate_advisory(current, forecast_list)

    result = {
        "current": current,
        "forecast_daily": forecast_list,
        "advisory": advisory,
    }

    _weather_cache[ck] = result
    return result


def _generate_advisory(current: dict, forecast: list) -> str:
    """Generate agricultural advisory based on REAL weather data only."""
    temp = current.get("temperature")
    humidity = current.get("humidity")
    rainfall = current.get("rainfall", 0)

    if temp is None or humidity is None:
        return ""

    # Check tomorrow's rain probability
    tomorrow_rain = 0
    if forecast and len(forecast) > 0:
        tomorrow_rain = forecast[0].get("chance_of_rain", 0) or 0

    if rainfall > 5.0 or tomorrow_rain > 60:
        return "Heavy rain/showers expected. Suspend foliar spray and postpone chemical fertilizer broadcasting to prevent nutrient leaching."
    elif temp > 36.0:
        return "High temperature stress alert. Provide light evening irrigation and ensure mulch coverage to preserve soil moisture."
    elif humidity > 80:
        return "High ambient humidity elevates fungal pathogen risks. Monitor field crops closely for blast or mildew symptoms."
    elif temp < 10.0:
        return "Cold conditions may affect tender crops. Consider frost protection measures for sensitive plants."
    else:
        return "Favorable weather conditions for field tillage, weed control, and balanced foliar spraying."

import requests
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("NEXT_PUBLIC_OPENWEATHER_API_KEY", "")
# Pick a representative point inside UM (central point)
UM_WEATHER_POINT = {
    "lat": 3.120,
    "lon": 101.655,
}

_cached_weather = None
_cached_hour = None

def get_um_hourly_weather():
    global _cached_weather, _cached_hour

    current_hour = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

    if _cached_weather and _cached_hour == current_hour:
        logging.info("Using cached UM hourly weather")
        return _cached_weather

    logging.info("Fetching new UM hourly weather")

    res = requests.get(
        "https://api.openweathermap.org/data/2.5/weather",
        params={
            "lat": UM_WEATHER_POINT["lat"],
            "lon": UM_WEATHER_POINT["lon"],
            "appid": API_KEY,
            "units": "metric",
        },
        timeout=10,
    )

    res.raise_for_status()
    data = res.json()

    weather = {
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "rainfall": data.get("rain", {}).get("1h", 0),
        "fetchedAt": current_hour.isoformat(),
    }

    _cached_weather = weather
    _cached_hour = current_hour

    return weather

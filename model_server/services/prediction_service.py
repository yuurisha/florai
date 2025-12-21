# services/prediction_service.py

from uuid import uuid4
from typing import Optional

from notifications import create_ai_alert
from notifications import save_prediction_to_firestore as save_prediction
from models.model_registry import risk_model, spread_model


def run_prediction_core(
    latitude: float,
    longitude: float,
    temperature: float,
    rainfall: float,
    humidity: float,
    userID: Optional[str] = None,
    source: str = "user",  # "user" or "scheduled"
):
   

    prediction_id = str(uuid4())

    # ---- MODEL INFERENCE ----
    risk = risk_model.predict(
        latitude, longitude, temperature, rainfall, humidity
    )

    spread = spread_model.predict(
        latitude, longitude, temperature, rainfall, humidity
    )

    # ---- SAVE PREDICTION LOG ----
    save_prediction(
        prediction_id=prediction_id,
        latitude=latitude,
        longitude=longitude,
        temperature=temperature,
        rainfall=rainfall,
        humidity=humidity,
        risk=risk,
        spread=spread,
        source=source,
        userID=userID,
    )

    # ---- NOTIFICATION (USER ONLY) ----
    notification_id = None
    if source == "user" and userID:
        notification_id = create_ai_alert(
            prediction_id,
            {
                "latitude": latitude,
                "longitude": longitude,
                "temperature": temperature,
                "rainfall": rainfall,
                "humidity": humidity,
                "userID": userID,
            },
            risk,
            spread,
        )

    return {
        "predictionID": prediction_id,
        "risk_level": risk,
        "spread_distance_km": spread["spread_distance_km"],
        "spread_direction_deg": spread["spread_direction_deg"],
        "notificationID": notification_id,
    }

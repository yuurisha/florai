from firebase_admin import firestore
from uuid import uuid4
from datetime import datetime

from firebase_app import db


def save_prediction_to_firestore(input_data, risk, spread):
    prediction_id = str(uuid4())

    def get(field):
        if isinstance(input_data, dict):
            return input_data.get(field)
        return getattr(input_data, field, None)

    def to_py(value):
        if value is None:
            return None
        if hasattr(value, "item"):  # numpy scalar
            return value.item()
        return value

    prediction_doc = {
        "predictionID": prediction_id,
        "userID": get("userID"),

        "latitude": float(to_py(get("latitude"))),
        "longitude": float(to_py(get("longitude"))),

        "temperature": to_py(get("temperature")),
        "rainfall": to_py(get("rainfall")),
        "humidity": to_py(get("humidity")),

        "risk_level": str(to_py(risk)),
        "spread_distance_km": float(to_py(spread["spread_distance_km"])),
        "spread_direction_deg": float(to_py(spread["spread_direction_deg"])),

        "source": get("source") or "scheduled_um",
        "createdAt": firestore.SERVER_TIMESTAMP,
    }

    db.collection("predictions").document(prediction_id).set(prediction_doc)
    return prediction_id



def create_ai_alert(prediction_id, input_data, risk, spread):
    # if risk == "Low":
    #     return None  # ❗ no notification for low risk
    if input_data is None or not input_data.userID:
        return None  # skip save notification for every cell prediction, only middle cell with userID

      # USER NOTIFICATION PREFERENCE LOGIC
    pref_ref = db.collection("notificationPreferences").document(input_data.userID)
    pref_doc = pref_ref.get()

    if pref_doc.exists:
        prefs = pref_doc.to_dict()
        if not prefs.get("enableAiAlerts", True):
            return None  # ❌ user disabled AI alerts
        if not prefs.get("channelInApp", True):
            return None  # ❌ in-app notifications disabled
        if prefs.get("minSeverity") == "high" and risk != "High":
            return None  # ❌ severity filter
    else:
        # no preferences → allow default behavior
        pass

    notification_id = str(uuid4())

    notif_doc = {
        "userID": input_data.userID,
        "notificationID": notification_id,
        "type": "ai_alert",
        "source": "user_clicked_point",
        "description": f"AI detected {risk} risk spread near your area.",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "read": False,
        "receiveNotifications": True,
        "predictionID": prediction_id,

        # embedded prediction details
        "latitude": input_data.latitude,
        "longitude": input_data.longitude,
        "temperature": input_data.temperature,
        "rainfall": input_data.rainfall,
        "humidity": input_data.humidity,
        "predictedSpread": spread["spread_distance_km"],
        "predictedRisk": risk,
    }

    db.collection("notifications").document(notification_id).set(notif_doc)
    return notification_id

def create_um_special_alert(prediction_id, lat, lon, spread, risk):
    notification_id = str(uuid4())

    notif_doc = {
        "userID": None,
        "notificationID": notification_id,
        "type": "um_special_alert",
        "description": "Invasive plant spread are likely within UM campus.",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "read": False,

        # UM specific
        "source": "scheduled_um",
        "latitude": lat,
        "longitude": lon,
        "predictedSpread": float(spread["spread_distance_km"]),
        "predictedDirection": float(spread["spread_direction_deg"]),
        "predictedRisk": risk,
        "predictionID": prediction_id,
    }

    db.collection("notifications").document(notification_id).set(notif_doc)

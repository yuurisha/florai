from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
from notifications import save_prediction_to_firestore, create_ai_alert
from fastapi.middleware.cors import CORSMiddleware
from firebase_app import db

app = FastAPI()
model = joblib.load("spread_model.pkl") #risk level model
spread_model = joblib.load("area_spread_model.pkl")  # distance/direction model

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputPoint(BaseModel):
    latitude: float
    longitude: float
    temperature: float
    rainfall: float
    humidity: float
    userID: str | None = None

@app.post("/predict")
def predict_spread(point: InputPoint):
    print("Received input:", point.dict())  # ✅ Debug log
    X = np.array([[point.latitude, point.longitude, point.temperature, point.rainfall, point.humidity]])
    label = model.predict(X)[0]
    risk_map = {0: "Low", 1: "Medium", 2: "High"}
    return {"risk_level": risk_map[label]}

@app.post("/predictSpread")
def predict_spread_details(point: InputPoint):
    X = np.array([[point.latitude, point.longitude, point.temperature, point.rainfall, point.humidity]])
    prediction = spread_model.predict(X)[0]
    return {
        "spread_distance_km": round(prediction[0], 2),
        "spread_direction_deg": round(prediction[1] % 360, 2)
    }

@app.post("/predictAll")
def predict_all(point: InputPoint):
    # 1) Predict risk
    X = np.array([[point.latitude, point.longitude, point.temperature, point.rainfall, point.humidity]])
    label = model.predict(X)[0]
    risk_map = {0: "Low", 1: "Medium", 2: "High"}
    risk = risk_map[label]

    # 2) Predict spread
    spread_pred = spread_model.predict(X)[0]
    spread = {
        "spread_distance_km": round(spread_pred[0], 2),
        "spread_direction_deg": round(spread_pred[1] % 360, 2)
    }

    # 3) Save prediction in Firestore
    prediction_id = save_prediction_to_firestore(point, risk, spread)

    # 4) Create AI alert 
    create_ai_alert(prediction_id, point, risk, spread)

    # 5) Return combined response
    return {
        "risk_level": risk,
        "spread_distance_km": spread["spread_distance_km"],
        "spread_direction_deg": spread["spread_direction_deg"],
        "predictionID": prediction_id
    }

# To run the server, use the command:
# cd to venv first,
# venv\\Scripts\\activate
# then run:
# uvicorn app:app --reload

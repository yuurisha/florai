from services.um_grid_service import generate_um_grid
from services.um_weather_service import get_um_hourly_weather
from notifications import create_um_special_alert, save_prediction_to_firestore, create_ai_alert
from models.model_registry import risk_model, spread_model
import logging

def run_um_prediction_job():
    grid = generate_um_grid()
    logging.info(f"UM grid size = {len(grid)} points")

    for lat, lon in grid:
        logging.info(f"Running prediction at lat={lat}, lon={lon}")

######     #averaged weather OR cached weather ###########
        weather = get_um_hourly_weather()
        temperature = weather["temperature"]
        humidity = weather["humidity"]
        rainfall = weather["rainfall"]

        risk = risk_model.predict([[lat, lon, temperature, rainfall, humidity]])[0]
        spread = spread_model.predict([[lat, lon, temperature, rainfall, humidity]])[0]

        prediction_id = save_prediction_to_firestore(
            input_data={
                "userID": None,
                "latitude": lat,
                "longitude": lon,
                "temperature": weather["temperature"],
                "rainfall": weather["rainfall"],
                "humidity": weather["humidity"],
                "source": "scheduled_um"
            },
            risk=risk,
            spread={
                "spread_distance_km": float(spread[0]),
                "spread_direction_deg": float(spread[1])
                }
        )

        logging.info(f"DEBUG spread value = {spread} | type = {type(spread)}")
        logging.info(f"Prediction complete | risk={risk} | spread_distance_km={spread[0]} | spread_direction_deg={spread[1]}")

        # Map risk value to risk label
        risk_labels = {0: "Low", 1: "Medium", 2: "High"}
        risk_label = risk_labels.get(risk, "Unknown")
        
        create_um_special_alert(
            prediction_id=prediction_id,
            lat=lat,
            lon=lon,
            risk=risk_label,
            spread={"spread_distance_km": spread[0], "spread_direction_deg": spread[1]}
        )
        logging.info(f"UM special alert created for {risk_label} risk prediction triggered at lat={lat}, lon={lon}")
           

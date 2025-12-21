# models/model_registry.py
import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

RISK_MODEL_PATH = os.path.join(BASE_DIR, "spread_model.pkl")
SPREAD_MODEL_PATH = os.path.join(BASE_DIR, "area_spread_model.pkl")

# Load ONCE at import time
risk_model = joblib.load(RISK_MODEL_PATH)
spread_model = joblib.load(SPREAD_MODEL_PATH)

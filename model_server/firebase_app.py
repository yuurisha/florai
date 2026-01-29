import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

def init_firebase():
    # Prevent "already initialized" errors (hot reload / multiple imports)
    if firebase_admin._apps:
        return firestore.client()

    # ✅ Render / production: store the whole service account JSON in env var
    sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        cred = credentials.Certificate(json.loads(sa_json))
        firebase_admin.initialize_app(cred)
        return firestore.client()

    # ✅ Local fallback: use file if present
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    return firestore.client()

db = init_firebase()

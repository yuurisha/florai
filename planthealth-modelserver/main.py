from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import os

# --------------------
# App init (MUST come first)
# --------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------
# Load YOLO model
# --------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR, "leaf_detector_hibiscus_ft_v2.pt"
)

model = YOLO(MODEL_PATH)

CONF_THRES = 0.35  # from best F1 ≈ 0.339

# --------------------
# Routes
# --------------------
@app.get("/")
def root():
    return {
        "message": "FLORAI FastAPI running",
        "model": os.path.basename(MODEL_PATH),
        "conf": CONF_THRES,
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = model.predict(img, conf=CONF_THRES)[0]

    detections = []
    leaf_count = 0

    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        cls_name = model.names.get(cls_id, str(cls_id))

        detections.append({
            "class": cls_name,
            "confidence": conf,
        })

        if cls_name.lower() == "leaf":
            leaf_count += 1

    # IMPORTANT:
    # This model is leaf-only, so health cannot be inferred yet
    return {
        "status": "Unknown",
        "detections": detections,
        "summary": {
            "healthy": 0,
            "diseased": 0,
            "leaf": leaf_count,
            "total": leaf_count,
        },
        "meta": {
            "model": os.path.basename(MODEL_PATH),
            "conf": CONF_THRES,
        }
    }

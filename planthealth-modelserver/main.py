from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io

# Load YOLOv8 model
model = YOLO("best.pt")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = model(img)[0]

    detections = []
    healthy = 0
    diseased = 0
    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        cls_name = model.names[cls_id]

        detections.append({
            "class": cls_name,
            "confidence": conf
        })

        if "healthy" in cls_name.lower():
            healthy += 1
        else:
            diseased += 1

    if healthy + diseased == 0:
        status = "Unknown"
    elif healthy >= diseased:
        status = "Healthy"
    else:
        status = "Diseased"

    total = healthy + diseased
    health_index = (healthy / total) if total > 0 else None

    return {
        "status": status,
        "detections": detections,
        "summary": {
            "healthy": healthy,
            "diseased": diseased,
            "total": total,
            "health_index": health_index
        },
    }

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import os
import numpy as np

import torch
import torch.nn.functional as F
from torchvision import transforms
import timm

# --------------------
# App init
# --------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------
# Paths
# --------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DET_PATH = os.path.join(BASE_DIR, "leaf_detector_hibiscus_ft_v2.pt")
CLF_PATH = os.path.join(BASE_DIR, "leaf_classifier_hibiscus_binary_stratified_v1.pth")

# --------------------
# Load models ONCE
# --------------------
device = "cuda" if torch.cuda.is_available() else "cpu"

# YOLO detector
detector = YOLO(DET_PATH)
DET_CONF = 0.35

# EfficientNet classifier
classifier = timm.create_model(
    "efficientnet_b0",
    pretrained=False,
    num_classes=2
)
classifier.load_state_dict(torch.load(CLF_PATH, map_location=device))
classifier = classifier.to(device).eval()

IDX_TO_LABEL = {0: "diseased", 1: "healthy"}

clf_tfms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

# --------------------
# Helper functions
# --------------------
def classify_leaf(pil_img):
    x = clf_tfms(pil_img).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = classifier(x)
        probs = F.softmax(logits, dim=1)[0].cpu().numpy()
    idx = int(np.argmax(probs))
    return IDX_TO_LABEL[idx], float(probs[idx])


def photo_health_level(healthy, diseased):
    total = healthy + diseased
    if total == 0:
        return "Unknown"
    alpha = 1
    score = (healthy + alpha) / (total + 2 * alpha)
    if score >= 0.8:
        return "Healthy"
    if score >= 0.6:
        return "Moderate"
    return "Unhealthy"

# --------------------
# Routes
# --------------------
@app.get("/")
def root():
    return {
        "message": "FLORAI FastAPI running",
        "detector": os.path.basename(DET_PATH),
        "classifier": os.path.basename(CLF_PATH),
        "conf": DET_CONF,
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = detector.predict(img, conf=DET_CONF, verbose=False)[0]

    healthy = 0
    diseased = 0
    detections = []

    if results.boxes is not None:
        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
            det_conf = float(box.conf[0])

            # filter tiny noise
            if (x2 - x1) < 20 or (y2 - y1) < 20:
                continue

            crop = img.crop((x1, y1, x2, y2))
            label, cls_conf = classify_leaf(crop)

            if cls_conf >= 0.6:
                if label == "healthy":
                    healthy += 1
                else:
                    diseased += 1
            else:
                label = "uncertain"

            detections.append({
                "bbox": [x1, y1, x2, y2],
                "confidence": det_conf,
                "leaf_class": label,
                "leaf_conf": cls_conf,
            })

    return {
        "status": photo_health_level(healthy, diseased),
        "summary": {
            "healthy": healthy,
            "diseased": diseased,
            "total": healthy + diseased,
        },
        "detections": detections,
    }

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
CLF_PATH = os.path.join(BASE_DIR, "leaf_classifier_hibiscus_best.pth")

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

IDX_TO_LABEL = {0: "healthy", 1: "diseased"}

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


def compute_metrics(healthy: int, diseased: int):
    """
    Computes Health Ratio and Disease Incidence using ONLY counted leaves
    (healthy + diseased). Uncertain is excluded.
    """
    counted = healthy + diseased
    if counted == 0:
        return {
            "counted": 0,
            "health_ratio": None,
            "disease_incidence": None,
        }

    health_ratio = healthy / counted
    disease_incidence = diseased / counted
    return {
        "counted": counted,
        "health_ratio": float(health_ratio),
        "disease_incidence": float(disease_incidence),
    }


def photo_health_level_from_incidence(disease_incidence: float | None, counted: int):
    if counted == 0 or disease_incidence is None:
        return "Unknown"

    # ✅ tweak these thresholds to your preference
    if disease_incidence <= 0.20:
        return "Healthy"
    if disease_incidence <= 0.40:
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
    uncertain = 0
    detections = []

    # --- STATE A: No leaf detected by YOLO at all ---
    if results.boxes is None or len(results.boxes) == 0:
        return {
            "status": "NoLeafDetected",
            "message": "No leaf detected. Please try again with a clearer photo (closer leaf, better lighting).",
            "summary": {
                "healthy": 0,
                "diseased": 0,
                "uncertain": 0,
                "total_counted": 0,
                "total_all": 0,
            },
            "metrics": {
                "health_ratio": None,
                "disease_incidence": None,
            },
            "detections": [],
        }

    # If boxes exist, process them
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
        det_conf = float(box.conf[0])

        # (Optional extra safety)
        # if det_conf < DET_CONF:
        #     continue

        # filter tiny noise
        if (x2 - x1) < 20 or (y2 - y1) < 20:
            continue

        crop = img.crop((x1, y1, x2, y2))
        label, cls_conf = classify_leaf(crop)

        final_label = label
        if cls_conf >= 0.75:
            if label == "healthy":
                healthy += 1
            else:
                diseased += 1
        else:
            final_label = "uncertain"
            uncertain += 1

        detections.append({
            "bbox": [x1, y1, x2, y2],
            "confidence": det_conf,
            "leaf_class": final_label,
            "leaf_conf": cls_conf,
        })

    # --- STATE B: YOLO found boxes, but after filtering they are all unusable ---
    if len(detections) == 0:
        return {
            "status": "LeafNotClear",
            "message": "Leaf was detected but the regions were too small/unclear to classify. Try a closer photo.",
            "summary": {
                "healthy": 0,
                "diseased": 0,
                "uncertain": 0,
                "total_counted": 0,
                "total_all": 0,
            },
            "metrics": {
                "health_ratio": None,
                "disease_incidence": None,
            },
            "detections": [],
        }

    # --- STATE C: We have usable detections -> compute incidence/ratio ---
    counted = healthy + diseased
    if counted == 0:
        health_ratio = None
        disease_incidence = None
        final_status = "Unknown"  # only uncertain
    else:
        health_ratio = healthy / counted
        disease_incidence = diseased / counted

        # thresholds using disease incidence
        if disease_incidence <= 0.20:
            final_status = "Healthy"
        elif disease_incidence <= 0.40:
            final_status = "Moderate"
        else:
            final_status = "Unhealthy"

    return {
        "status": final_status,
        "message": "OK",
        "summary": {
            "healthy": healthy,
            "diseased": diseased,
            "uncertain": uncertain,
            "total_counted": counted,        # healthy+diseased only
            "total_all": len(detections),    # includes uncertain
        },
        "metrics": {
            "health_ratio": None if health_ratio is None else float(health_ratio),
            "disease_incidence": None if disease_incidence is None else float(disease_incidence),
        },
        "detections": detections,
    }

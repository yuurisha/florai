from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import os
import numpy as np
import onnxruntime as ort

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
# Paths (Updated to ONNX)
# --------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DET_PATH = os.path.join(BASE_DIR, "leaf_detector_hibiscus_ft_v2.onnx")
CLF_PATH = os.path.join(BASE_DIR, "leaf_classifier.onnx")

# --------------------
# Load models ONCE
# --------------------
# YOLO handles ONNX natively via ultralytics
detector = YOLO(DET_PATH)
DET_CONF = 0.35
MIN_BOX_SIZE = 12
MIN_CLASS_CONF = 0.6

# ONNX Runtime session for the classifier
clf_session = ort.InferenceSession(CLF_PATH, providers=['CPUExecutionProvider'])

IDX_TO_LABEL = {1: "diseased", 0: "healthy"}

# --------------------
# Helper functions
# --------------------
def classify_leaf(pil_img):
    """Replaces your torch transforms with manual numpy preprocessing"""
    # 1. Resize (Matches your original transforms.Resize)
    img = pil_img.resize((224, 224))
    
    # 2. ToTensor & Normalize (Matches your original transforms.Normalize)
    # Explicitly set dtype to np.float32
    img_data = np.array(img).transpose(2, 0, 1).astype(np.float32) / 255.0
    
    # Force mean and std to be float32 to prevent promotion to double
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)
    
    img_data = (img_data - mean) / std
    
    # Final safety check: ensure input_tensor is float32
    input_tensor = img_data[np.newaxis, :].astype(np.float32)

    # 3. Run Inference
    outputs = clf_session.run(None, {clf_session.get_inputs()[0].name: input_tensor})
    logits = outputs[0]
    
    # 4. Softmax & Argmax (Matches your original torch logic)
    probs = np.exp(logits) / np.sum(np.exp(logits), axis=1)
    idx = int(np.argmax(probs))
    return IDX_TO_LABEL[idx], float(probs[0][idx])

# Note: Keeping your metrics helpers exactly the same!
def compute_metrics(healthy: int, diseased: int):
    counted = healthy + diseased
    if counted == 0:
        return {"counted": 0, "health_ratio": None, "disease_incidence": None}
    health_ratio = healthy / counted
    disease_incidence = diseased / counted
    return {
        "counted": counted,
        "health_ratio": float(health_ratio),
        "disease_incidence": float(disease_incidence),
    }

# --------------------
# Routes
# --------------------
@app.get("/")
def root():
    return {
        "message": "FLORAI FastAPI running (ONNX Optimized)",
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

    # Using YOLO ONNX
    results = detector.predict(img, conf=DET_CONF, verbose=False)[0]

    healthy, diseased, uncertain = 0, 0, 0
    detections = []

    # --- STATE A: No leaf detected ---
    if results.boxes is None or len(results.boxes) == 0:
        return {
            "status": "NoLeafDetected",
            "message": "No leaf detected. Please try again with a clearer photo (closer leaf, better lighting).",
            "summary": {"healthy": 0, "diseased": 0, "uncertain": 0, "total_counted": 0, "total_all": 0},
            "metrics": {"health_ratio": None, "disease_incidence": None},
            "detections": [],
        }

    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
        det_conf = float(box.conf[0])

        if (x2 - x1) < MIN_BOX_SIZE or (y2 - y1) < MIN_BOX_SIZE:
            continue

        crop = img.crop((x1, y1, x2, y2))
        label, cls_conf = classify_leaf(crop)

        final_label = label
        if cls_conf >= MIN_CLASS_CONF:
            if label == "healthy": healthy += 1
            else: diseased += 1
        else:
            final_label = "uncertain"
            uncertain += 1

        detections.append({
            "bbox": [x1, y1, x2, y2],
            "confidence": det_conf,
            "leaf_class": final_label,
            "leaf_conf": cls_conf,
        })

    # --- STATE B: Filtering usable boxes ---
    if len(detections) == 0:
        return {
            "status": "LeafNotClear",
            "message": "Leaf was detected but the regions were too small/unclear to classify. Try a closer photo.",
            "summary": {"healthy": 0, "diseased": 0, "uncertain": 0, "total_counted": 0, "total_all": 0},
            "metrics": {"health_ratio": None, "disease_incidence": None},
            "detections": [],
        }

    # --- STATE C: Compute incidence/ratio (Your exact logic) ---
    metrics = compute_metrics(healthy, diseased)
    counted = metrics["counted"]
    health_ratio = metrics["health_ratio"]
    disease_incidence = metrics["disease_incidence"]

    if counted == 0:
        final_status = "Unknown"
    else:
        if disease_incidence <= 0.20: final_status = "Healthy"
        elif disease_incidence <= 0.50: final_status = "Moderate"
        else: final_status = "Unhealthy"

    return {
        "status": final_status,
        "message": "OK",
        "summary": {
            "healthy": healthy,
            "diseased": diseased,
            "uncertain": uncertain,
            "total_counted": counted,
            "total_all": len(detections),
        },
        "metrics": metrics,
        "detections": detections,
    }
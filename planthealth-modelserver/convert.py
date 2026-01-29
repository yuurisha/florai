import torch
import timm
from ultralytics import YOLO

# 1. Convert YOLO Detector (.pt -> .onnx)
print("Converting YOLO...")
detector = YOLO("leaf_detector_hibiscus_ft_v2.pt")
detector.export(format="onnx", imgsz=640) # Creates 'leaf_detector_hibiscus_ft_v2.onnx'

# 2. Convert EfficientNet Classifier (.pth -> .onnx)
print("Converting EfficientNet...")
classifier = timm.create_model("efficientnet_b0", num_classes=2)
classifier.load_state_dict(torch.load("leaf_classifier_hibiscus_binary_stratified_v1.pth", map_location="cpu"))
classifier.eval()

dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    classifier, 
    dummy_input, 
    "leaf_classifier.onnx", 
    export_params=True,
    opset_version=17,  # <--- Changed this from 11 to 17 for better compatibility
    input_names=['input'],
    output_names=['output'],
    do_constant_folding=True
)
print("Done! You now have both .onnx files.")
import json
import os
import io   
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware


# ============================================================
# PATHS
# ============================================================

# Ensure these match the exact locations of your files
MODEL_PATH = r"C:\Users\rjrsu\OneDrive\Desktop\npn_final\model_with_remedie\backend\model\best_fold_3.pth"
CLASS_NAMES_PATH = "class_names.json" 
REMEDIES_PATH = r"C:\Users\rjrsu\OneDrive\Desktop\npn_final\model_with_remedie\backend\model\remedies.json" # <--- ADDED: Path to your remedies file


# ============================================================
# DEVICE
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", device)


# ============================================================
# LOAD CLASS NAMES & REMEDIES
# ============================================================

# Load classes
with open(CLASS_NAMES_PATH, "r") as f:
    class_names = json.load(f)
print("Classes:", len(class_names))

# Load remedies (ADDED)
try:
    with open(REMEDIES_PATH, "r") as f:
        remedies_dict = json.load(f)
    print("Remedies loaded successfully!")
except FileNotFoundError:
    print(f"Warning: {REMEDIES_PATH} not found. Remedy features will return default messages.")
    remedies_dict = {}


# ============================================================
# LOAD MODEL
# ============================================================

# 1. Initialize empty ResNet50
model = models.resnet50(weights=None)

# 2. Modify the classifier head to match the 15 classes and the "fc.1" key in weights
in_features = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(0.2),                         # Matches index 0
    nn.Linear(in_features, len(class_names)) # Matches index 1 ("fc.1.weight")
)

# 3. Load the weights from the saved file
checkpoint = torch.load(
    MODEL_PATH,
    map_location=device,
    weights_only=False
)

# 4. Safely load the weights (Bulletproof check for all save formats)
if "model_state_dict" in checkpoint:
    # Used in your v2 training scripts
    model.load_state_dict(checkpoint["model_state_dict"])
elif "model" in checkpoint:
    # Used in your phase 3 training script
    model.load_state_dict(checkpoint["model"])
else:
    # If saved as raw weights without a dictionary
    model.load_state_dict(checkpoint)

model = model.to(device)
model.eval()

print("ResNet50 model loaded successfully!")


# ============================================================
# IMAGE TRANSFORMATION
# ============================================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Plant Disease Detection API",
    description="ResNet50 Plant Disease Classification API with Remedies",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Plant Disease Detection API",
        "model": "ResNet50",
        "classes": len(class_names),
        "status": "running"
    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    image_bytes = await file.read()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs, dim=1)
        top_probs, top_indices = torch.topk(probabilities, 1)

    top_predictions = []

    for prob, index in zip(top_probs[0], top_indices[0]):
        class_name = class_names[index.item()]
        
        # ADDED: Look up the remedy for this specific class
        # .get() is safe; if the exact class name isn't in remedies.json, it returns the default string
        class_remedy = remedies_dict.get(class_name, "No remedy information available for this class.")
        
        top_predictions.append({
            "class": class_name,
            "confidence": round(prob.item() * 100, 2),
            "remedy": class_remedy # Included in top predictions just in case
        })

    prediction = top_predictions[0]["class"]
    confidence = top_predictions[0]["confidence"]
    remedy = top_predictions[0]["remedy"] # <--- ADDED: Extract the main remedy

    return {
        "success": True,
        "filename": file.filename,
        "prediction": prediction,
        "confidence": confidence,
        "remedy": remedy, # <--- ADDED: Return it in the main API response
        "top_predictions": top_predictions
    }

# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "ResNet50",
        "device": str(device),
        "classes": len(class_names),
        "remedies_loaded": len(remedies_dict) > 0
    }
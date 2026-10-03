# Plant Disease Prediction

An end-to-end plant disease detection app with:
- **FastAPI + PyTorch** backend for leaf image classification
- **React + Vite** frontend for uploading images and viewing diagnosis details
- **Remedy recommendations** for predicted diseases

The model is a ResNet50 classifier trained to detect common **pepper, potato, and tomato** diseases from leaf photos.

---

## Features

- Upload a leaf image (JPG/PNG)
- Predict disease class with confidence score
- Display remedy and prevention guidance
- Return structured API response with top prediction details
- Simple health endpoint for service monitoring

---

## Tech Stack

### Backend
- Python
- FastAPI
- PyTorch / Torchvision
- Pillow

### Frontend
- React
- Vite
- Tailwind CSS
- lucide-react icons

---

## Project Structure

```text
PlantDiseasePredicition/
├── backend/
│   ├── main.py
│   ├── class_names.json
│   └── model/
│       ├── best_fold_3.pth
│       └── remedies.json
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── components/
│           └── PlantDiseaseDetector.jsx
├── requirements.txt
└── README.md
```

---

## Supported Classes

1. Pepper bacterial spot  
2. Pepper healthy  
3. Potato early blight  
4. Potato late blight  
5. Potato healthy  
6. Tomato bacterial spot  
7. Tomato early blight  
8. Tomato late blight  
9. Tomato leaf mold  
10. Tomato septoria leaf spot  
11. Tomato spider mites  
12. Tomato target spot  
13. Tomato yellow leaf curl virus  
14. Tomato mosaic virus  
15. Tomato healthy  

> Note: Class names are loaded from `backend/class_names.json`.

---

## Setup

## 1) Clone the Repository

```bash
git clone https://github.com/sujan58/PlantDiseasePredicition.git
cd PlantDiseasePredicition
```

## 2) Backend Setup

Create and activate a virtual environment, then install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

### Important: Update Model Paths

In `backend/main.py`, update these variables to valid local paths before starting the API:
- `MODEL_PATH`
- `REMEDIES_PATH`

Example (if running from `/backend`):
- `MODEL_PATH = "model/best_fold_3.pth"`
- `REMEDIES_PATH = "model/remedies.json"`

Start backend server:

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: `http://localhost:8000/docs`

## 3) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend app: `http://localhost:5173`

By default, frontend uses:
- `http://localhost:8000` (from `VITE_API_URL` or fallback)

To use a different backend URL:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

---

## API

### `GET /`
Returns basic API metadata.

### `GET /health`
Returns service health status and model/device info.

### `POST /predict`
Accepts an image file upload.

**Form field**
- `file`: image file (`multipart/form-data`)

**Sample response**

```json
{
  "success": true,
  "filename": "leaf.jpg",
  "prediction": "Tomato_Early_blight",
  "confidence": 97.34,
  "remedy": {
    "disease": "Early Blight (Tomato)",
    "severity": "Moderate"
  },
  "top_predictions": [
    {
      "class": "Tomato_Early_blight",
      "confidence": 97.34,
      "remedy": {
        "disease": "Early Blight (Tomato)",
        "severity": "Moderate"
      }
    }
  ]
}
```

---

## Dataset

Dataset reference used in this project:

https://drive.google.com/drive/folders/1fFNiqM7D9bqf9ijPVn-vCMpLqkXJmr9W?usp=sharing

---

## Troubleshooting

- **`Failed to fetch` in frontend**  
  Make sure the backend is running and reachable at the configured API URL.

- **Model file not found errors**  
  Verify `MODEL_PATH` and `REMEDIES_PATH` values in `backend/main.py`.

- **CORS/browser access issues**  
  Backend currently allows all origins; confirm requests are sent to the correct backend host/port.

---

## Disclaimer

Predictions are intended for educational/assistance use. Always confirm critical crop health decisions with local agricultural experts or lab diagnostics.

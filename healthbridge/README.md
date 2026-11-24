# HealthBridge — Clinical AI Diagnostic Platform

> Screen Smart. Act Fast. Stay Healthy.

**Infinity AI BuildFest 2025 | Jahangirnagar University**

---

## Quick Start

### 1. Backend Setup

```bash
cd healthbridge/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and add your GROQ_API_KEY
# Set MONGODB_URL if not using local MongoDB

# Run the API server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd healthbridge/frontend

npm install
npm run dev
```

Open `http://localhost:5173`

---

## Environment Variables (backend/.env)

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `healthbridge` |
| `SECRET_KEY` | JWT signing key | *(change this!)* |
| `GROQ_API_KEY` | Groq API key for AI chat | *(required for chat)* |

Get a free Groq API key at: https://console.groq.com

---

## Project Structure

```
healthbridge/
├── backend/                 # FastAPI server
│   ├── main.py              # App entry point
│   ├── config.py            # Settings & model paths
│   ├── database.py          # MongoDB (Motor async)
│   ├── auth/                # JWT authentication
│   ├── routes/              # API endpoints
│   │   ├── analyze.py       # X-Ray, ECG, CT, Skin, Symptoms
│   │   ├── history.py       # Patient report history
│   │   ├── doctor.py        # Doctor dashboard API
│   │   └── chat.py          # Groq AI chat
│   └── services/
│       ├── ml/              # Model inference
│       │   ├── xray.py      # DenseNet121 + ResNet50 + ViT ensemble
│       │   ├── ecg.py       # ResNet + Inception + Transformer ensemble
│       │   ├── ct_scan.py   # Isolation Forest + PCA anomaly detection
│       │   ├── skin.py      # Dual ResNet50 ensemble
│       │   └── symptoms.py  # XGBoost + LightGBM + RF ensemble
│       ├── groq_service.py  # LLaMA 3 chat + recommendations
│       └── risk_score.py    # 0-100 risk score calculator
└── frontend/                # React + Vite + Tailwind
    └── src/
        ├── pages/
        │   ├── Landing.jsx
        │   ├── auth/        # Login, Register
        │   ├── patient/     # Dashboard, Symptoms, Analyze, Results, History, Chat
        │   └── doctor/      # Dashboard, PatientDetail
        └── components/
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register patient or doctor |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/analyze/xray` | Chest X-Ray analysis |
| POST | `/api/analyze/ecg` | ECG signal analysis |
| POST | `/api/analyze/ct` | CT scan anomaly detection |
| POST | `/api/analyze/skin` | Skin disease classification |
| POST | `/api/analyze/symptoms` | Symptom-based prediction |
| GET  | `/api/history` | Patient's report history |
| POST | `/api/chat` | AI health chat (Groq) |
| GET  | `/api/doctor/patients` | All patients (doctor only) |
| GET  | `/api/doctor/stats` | Platform statistics |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (python-jose) |
| ML — X-Ray | PyTorch: DenseNet121 + ResNet50 + ViT-Base |
| ML — ECG | TensorFlow/Keras: ResNet + Inception + Transformer |
| ML — CT Scan | scikit-learn: Isolation Forest + PCA |
| ML — Skin | PyTorch: Dual ResNet50 ensemble |
| ML — Symptoms | scikit-learn: XGBoost + LightGBM + Random Forest |
| AI Chat | Groq API — LLaMA 3.3 70B |
| Explainability | Grad-CAM (X-Ray & Skin Disease) |

---

## Features

- **5 Diagnostic Modules**: X-Ray, ECG, CT Scan, Skin Disease, Symptom Checker
- **Ensemble Models**: Every module uses multiple models for robust predictions
- **Confidence Scoring**: Results < 60% flagged as inconclusive
- **Risk Scoring**: 0-100 score with Low / Moderate / High levels
- **Grad-CAM**: Visual explainability for X-Ray and Skin modules
- **AI Chat**: Groq-powered LLaMA 3 for health guidance
- **Doctor Dashboard**: Patient list ranked by risk, charts, messaging
- **Doctor Messaging**: Secure in-app messaging to patients

---

*HealthBridge is a decision-support tool. All results require physician validation.*

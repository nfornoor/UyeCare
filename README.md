# UyeCare

> Screen Smart. Act Fast. Stay Healthy.

A clinical AI decision-support platform built for **Infinity AI BuildFest 2025** at the
Institute of Information Technology, Jahangirnagar University. UyeCare bundles five
diagnostic ensembles into one web app, routes results to vetted doctors, and ships
Grad-CAM explainability for every imaging module.

---

## What it does

| Module | Models | Conditions |
|---|---|---|
| **Chest X-Ray** | DenseNet121 + ResNet50 + ViT-Base | 6 (Pneumonia, Cardiomegaly, Edema, Consolidation, Atelectasis, No Finding) |
| **ECG Signal** | ResNet + Inception + Transformer | 8 (Normal, AFib, MI, Ischemia, Hypertrophy, …) |
| **CT Scan** | Isolation Forest + PCA + Autoencoder | 2 (Normal, Anomaly Detected) |
| **Skin Lesion** | Triple ResNet50/EfficientNet ensemble + Grad-CAM | 7 (Melanoma, BCC, AKIEC, Nevi, Keratosis, DF, Vascular) |
| **Symptom Checker** | XGBoost + LightGBM + Random Forest | 22 disease categories |

Every module averages **3+ models** before reporting. Ensemble disagreement is surfaced
as an `inconclusive` flag, and a 0–100 **risk score** is computed and persisted with
each report.

---

## Quick start

### Backend

```bash
cd healthbridge/backend

# Virtual env (optional but recommended)
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # Linux/Mac

pip install -r requirements.txt
pip install tensorflow --no-cache-dir   # ECG ensemble needs TF; ~600 MB

# Environment
copy .env.example .env           # then fill in GROQ_API_KEY, MONGODB_URL, etc.

# Seed default accounts (admin + demo patient + demo doctor + 12 reports)
python create_admin.py
python seed_demo.py

# Run the API server
uvicorn main:app --reload --port 8000
```

API: http://localhost:8000  
Interactive docs: http://localhost:8000/docs

### Frontend

```bash
cd healthbridge/frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## Demo credentials

Seeded by [`healthbridge/backend/seed_demo.py`](healthbridge/backend/seed_demo.py)
(re-run any time to refresh; users are kept, reports are wiped + reseeded).

| Role | Email | Password |
|---|---|---|
| Admin | `admin@uyecare.com` | `UyeCare@Admin2025` |
| Patient (`PAT-001`, 12 demo reports) | `patient@uyecare.com` | `Patient@2025` |
| Doctor (`DOC-001`, Cardiologist) | `doctor@uyecare.com` | `Doctor@2025` |

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 · Vite · Tailwind CSS · Zustand · Recharts · GSAP · react-dropzone · react-hot-toast · lucide-react |
| Backend | FastAPI · Motor (async MongoDB) · Pydantic 2 · python-jose (JWT) · passlib (bcrypt) |
| Database | MongoDB (collections: `users`, `reports`, `messages`, `health_profiles`, `counters`) |
| ML — X-Ray | PyTorch (DenseNet121 + ResNet50 + ViT) + Grad-CAM + horizontal-flip TTA |
| ML — ECG | TensorFlow / Keras (ResNet + Inception + Transformer) with batched window inference |
| ML — CT Scan | scikit-learn (Isolation Forest + PCA + scaler) |
| ML — Skin | PyTorch + timm (auto-detects EfficientNet-B0/B1/B3 vs ResNet50) + Grad-CAM + TTA |
| ML — Symptoms | scikit-learn (XGBoost + LightGBM + Random Forest, 28-feature vector) |
| AI Chat | Groq API (LLaMA 3.3 70B) |
| Storage | Cloudinary (X-ray, CT, skin uploads + Grad-CAM PNGs) |
| Email | Gmail SMTP (doctor approval notifications) |

---

## Project structure

```
UyeCare/
├── All Disease Checkup/          # Symptom-checker training + trained_models/
├── ECG/                          # ECG ensemble + test scripts + Trained Model/
├── X-Ray/                        # X-ray ensemble + test_images_by_class/ + Trained Model/
├── ct_scan/                      # CT anomaly detector + Models/ + dataset/
├── skin disease/                 # Skin ensemble package + .pth model files
├── make_pptx.py                  # Generates UyeCare_Presentation.pptx
└── healthbridge/                 # The web app
    ├── backend/                  # FastAPI
    │   ├── main.py
    │   ├── config.py             # Resolves model paths to repo root
    │   ├── database.py           # Motor async client
    │   ├── auth/                 # JWT auth + role-gated dependencies
    │   ├── routes/               # analyze, history, doctor, admin, chat, health_profile
    │   ├── services/
    │   │   ├── ml/               # xray, ecg, ct_scan, skin, symptoms (lazy-loaded)
    │   │   ├── groq_service.py   # LLaMA 3.3 chat + recommendation generator
    │   │   ├── risk_score.py     # 0-100 score from prediction + confidence
    │   │   ├── cloudinary_service.py
    │   │   └── email_service.py
    │   ├── create_admin.py       # Seed admin (run once)
    │   └── seed_demo.py          # Seed demo patient + doctor + 12 reports
    └── frontend/                 # React + Vite
        ├── public/bd-locations.json  # 8 divisions / 64 districts / key upazilas
        └── src/
            ├── App.jsx               # Role-gated routes
            ├── store/authStore.js    # Zustand + persisted JWT
            ├── services/api.js       # Axios + auto-401 logout + getErrorMessage()
            ├── components/
            │   ├── Layout/           # PatientLayout, DoctorLayout, AdminLayout
            │   │                     # (responsive: mobile drawer + desktop top bar)
            │   └── common/           # ProfileMenu, ConfidenceBar, RiskBadge, LoadingSpinner
            └── pages/
                ├── Landing.jsx       # Expressive design (orange / IBM Plex Mono)
                ├── auth/             # Login + Register (premium / Apple-inspired)
                └── patient/, doctor/, admin/  # Neumorphism (teal / Space Mono)
```

---

## Design system

The app deliberately uses **three** distinct visual systems, each pulled from a
[typeui.sh](https://typeui.sh) spec and translated into CSS utilities in
[`src/index.css`](healthbridge/frontend/src/index.css):

| Surface | System | Colors | Typography |
|---|---|---|---|
| Landing page | **Expressive** | Cream `#F1F0EC` + orange `#F97316` + grid pattern | IBM Plex Mono (`.font-plex`) |
| Auth pages | **Premium** (Apple-inspired) | White + blue `#3B82F6` (login switches to orange) | Inter (`.premium-input`, `.premium-btn`) |
| Dashboards (patient/doctor/admin) | **Neumorphism** | Warm gray `#E7E5E4` + teal `#006666` | Space Mono (`.font-display`), JetBrains Mono (`.font-caps`) |

Each system has its own utility prefix (`.neu-*`, `.premium-*`, `.exp-*`) so they don't
bleed into each other.

---

## Key API endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register patient/doctor (doctors → pending approval) |
| POST | `/api/auth/login` | — | Returns JWT + UserOut |
| GET  | `/api/auth/me` | user | Current user |
| PATCH| `/api/auth/me` | user | Edit own profile (whitelisted fields) |
| POST | `/api/analyze/xray` | user | Chest X-ray ensemble + Grad-CAM |
| POST | `/api/analyze/ecg` | user | ECG signal ensemble (batched) |
| POST | `/api/analyze/ct` | user | CT anomaly detection |
| POST | `/api/analyze/skin` | user | Skin lesion ensemble + Grad-CAM |
| POST | `/api/analyze/symptoms` | user | Symptom-based prediction + AI-generated prescription |
| GET  | `/api/history` | user | Patient's report history |
| GET  | `/api/history/{report_id}` | user | Full report detail |
| POST | `/api/chat` | user | Groq LLaMA 3 health chat |
| GET  | `/api/chat/patient/messages` | user | Inbox from doctors (auto-marks read) |
| GET  | `/api/chat/patient/unread-count` | user | Polled by the patient layout |
| GET  | `/api/doctor/patients` | doctor | Patient list ranked by max risk |
| GET  | `/api/doctor/patients/{id}` | doctor | Patient detail + all reports |
| POST | `/api/doctor/message` | doctor | Send message to patient (optionally re: a specific report) |
| GET  | `/api/admin/stats` | admin | Platform stats for the admin dashboard |
| GET  | `/api/admin/users` | admin | All users with report counts |
| PATCH| `/api/admin/doctors/{id}/approve` | admin | Approve doctor + email notification |

Full schema at http://localhost:8000/docs once the backend is up.

---

## Features in the app

- **5 diagnostic modules**, each an ensemble of 3+ specialist models with disagreement-aware verdicts
- **Risk score** (0–100, low/moderate/high) attached to every report
- **Grad-CAM** heatmaps for X-Ray and Skin modules
- **Adaptive symptom questionnaire** that branches based on chief complaint
- **Three role-gated portals**: patient, doctor, admin
- **Doctor approval workflow** with Gmail notifications
- **In-app messaging** from doctor to patient, with optional report context
- **Live notification** when new doctor messages arrive (30s polling + toast)
- **Profile editing** for patients and doctors via avatar menu
- **Cascading address picker** (Division → District → Upazila → Union) for Bangladesh patients
- **Responsive layouts** with mobile drawer + desktop top bar across all three portals
- **Animated dashboards** — line draws over 2.4s, bars stagger in, pulsing latest-point indicator

---

## Configuration (`healthbridge/backend/.env`)

| Variable | Purpose | Default |
|---|---|---|
| `MONGODB_URL` | Mongo connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Mongo database | `healthbridge` |
| `SECRET_KEY` | JWT signing key | _change in production_ |
| `GROQ_API_KEY` | LLaMA 3.3 chat (free tier at https://console.groq.com) | required for chat |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Doctor approval emails | optional |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image storage | optional |

Model paths are resolved automatically from the repo root by
[`config.py`](healthbridge/backend/config.py) — no need to set them.

---

## Notes on ML model files

The trained weights ship in-tree:

- `X-Ray/Trained Model/*.pth` (DenseNet121, ResNet50, ViT-Base)
- `ECG/Trained Model/*.keras` (ResNet, Inception, Transformer)
- `ct_scan/Models/*.pkl` and `*.pth`
- `skin disease/skin_model_package/models/*.pth`
- `All Disease Checkup/trained_models/*.pkl`

Models are **lazy-loaded** on first request to each `/api/analyze/*` endpoint so the
server starts in <1s; first inference per module then takes 10–30s while weights load.
Subsequent requests use the cached models.

If you switch to Git LFS or external storage, uncomment the corresponding patterns
in [`.gitignore`](.gitignore).

---

## License & disclaimer

UyeCare is a **decision-support tool**. All results require physician validation.
The platform does not replace clinical examination.

© 2025 · Institute of Information Technology, Jahangirnagar University.

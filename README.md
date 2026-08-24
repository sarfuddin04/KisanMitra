# KisanMitra AI (किसान मित्र AI)
### *"Your Intelligent Farming Companion"*

> **B.Tech CSE Major Project**  
> An End-to-End Smart Agriculture Intelligence Platform integrating Machine Learning Soil Advisory, Computer Vision Plant Pathology Diagnostic Scanner, Real-time APMC Mandi Rates, Dynamic Fertilizer Deficit Formulator, Hyperlocal Weather Agro-Advisories, Direct Farmer-Buyer Marketplace, Multilingual Support (English & Hindi), and a Full-Featured Administrative Control System.

---

## 🌟 Key Highlights & Engineering Architecture

1. **Dual Independent Portals**:
   - **Farmer Portal** (`/dashboard`, `/crop-recommendation`, `/disease-detection`, `/marketplace`, etc.): Glassmorphic, modern UI tailored for Indian farmers with single-click demo login, soil evaluation history, leaf scan history, order tracking, and agronomist chat.
   - **Admin Command Center** (`/admin/dashboard`, `/admin/users`, `/admin/crops`, `/admin/fertilizers`, etc.): Dynamic CMS & database master CRUD system. When admins add or update crops, fertilizers, diseases, tips, or prices, they immediately reflect across all farmer recommendation models with zero frontend source code modification.

2. **Machine Learning & Computer Vision**:
   - **Crop Suitability Classifier**: Trained Random Forest model over 2,200 agronomic instances across 22 Indian crops achieving **99.39% accuracy** on test split (`ml/crop_recommendation/crop_model.joblib`).
   - **Plant Leaf Pathology Vision Scanner**: Colorimetric analysis & leaf pathology classifier diagnosing fungal/bacterial blights, rusts, mildew, and nutrient deficiencies with confidence metrics.
   - **PDF Diagnostic Generation**: Dynamic ReportLab PDF generator rendering professional diagnostic reports with custom headers, soil parameters, disease stages, and safety disclaimers.

3. **Backend & Database Resilience**:
   - **FastAPI Modern Architecture**: Fully asynchronous REST endpoints, JWT authentication (Bearer tokens), Pydantic schemas, and structured modular routers.
   - **Zero-Downtime Database Auto-Fallback**: Defaults to PostgreSQL and automatically falls back to local SQLite (`sqlite:///./kisanmitra.db`) if PostgreSQL is offline or credentials differ, ensuring instant out-of-the-box execution.
   - **Automatic Data Seeding**: Seeds Admin, Farmer, Crops, Fertilizers, Pathologies, APMC Mandis, Live Prices, Marketplace Categories, Products, FAQs, and Farming Tips on first boot.

4. **Bilingual Support (i18n)**:
   - Complete toggleable translations in **English (`en`)** and **Hindi (`hi`)** across navigation, metrics, buttons, warnings, and form placeholders.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Python 3.13 supported)
- **Node.js 18+** & **npm**

---

### 2. Running the Backend Server
```bash
cd backend
pip install -r requirements.txt
python run.py
```
- API Server: `http://127.0.0.1:8000`
- Interactive OpenAPI / Swagger Docs: `http://127.0.0.1:8000/docs`
- ReDoc Docs: `http://127.0.0.1:8000/redoc`

---

### 3. Running the Frontend Web Application
```bash
cd frontend
npm install
npm run dev
```
- Frontend Portal: `http://localhost:5173`

---

### 4. Or Run Both in One Click (Windows)
Double-click `run_servers.bat` in the root folder.

---

## 🔑 Demo Credentials (Pre-seeded)

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **Farmer (Demo)** | `farmer@kisanmitra.ai` | `Farmer@123` | `http://localhost:5173/login` |
| **Administrator** | `admin@kisanmitra.ai` | `Admin@123` | `http://localhost:5173/admin/login` |

*(Single-click "Prefill Credentials" buttons are also available on the login pages for convenience).*

---

## 📂 Project Directory Structure

```
KisanMitra AI/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, Database Engine, Security & JWT, Auth Dependencies
│   │   ├── models/         # SQLAlchemy 2.0 ORM Models (User, Agronomy, Market, Marketplace, Content)
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # ML Inference, Vision Scanner, Weather, AI Chat, PDF Generation
│   │   ├── utils/          # Database Seeder with realistic Indian agriculture data
│   │   ├── routes/         # 14 REST API Route Modules (Auth, Recommendations, Disease, Admin, etc.)
│   │   └── main.py         # FastAPI App Entrypoint, CORS, Static Storage Mounting
│   ├── uploads/            # Persisted leaf photos and diagnostic attachments
│   ├── requirements.txt    # Python dependencies
│   ├── run.py              # Backend launcher
│   └── .env                # Environment configurations
├── ml/
│   ├── crop_recommendation/
│   │   ├── dataset.py      # Indian agro-climatic dataset generator
│   │   ├── train.py        # Random Forest trainer (99.39% accuracy)
│   │   ├── crop_model.joblib # Saved trained model bundle
│   │   └── metrics.json    # Model evaluation metrics & confusion matrix summary
│   └── disease_detection/
│       ├── disease_db.json # Botanical pathology knowledge base (10+ crop diseases)
│       └── classifier.py   # Leaf vision analyzer & feature extractor
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Footer, FarmerSidebar, AdminSidebar, Topbar
│   │   ├── context/        # AuthContext, LanguageContext (EN/HI), CartContext
│   │   ├── i18n/           # Comprehensive English & Hindi dictionaries
│   │   ├── layouts/        # PublicLayout, FarmerLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── public/     # Home, About, Features, Services, Contact, Login, Register
│   │   │   ├── farmer/     # Dashboard, CropRec, DiseaseScan, Weather, Mandi, Chat, Market, etc.
│   │   │   └── admin/      # 16 Admin CRUD Modules & Recharts Analytics Dashboard
│   │   ├── services/       # Axios API client with JWT interceptors
│   │   ├── App.jsx         # Full React routing & role guards (FarmerRoute, AdminRoute)
│   │   ├── index.css       # Tailwind CSS v4 design system, Glassmorphism, Typography
│   │   └── main.jsx        # Root provider mount
│   ├── package.json
│   └── vite.config.js
├── run_servers.bat         # 1-Click launcher for Windows
└── README.md
```

---

## 🛡️ AI Safety Disclaimer
> *All crop recommendations and plant disease pathology identifications generated by KisanMitra AI are AI-assisted decision-support tools. Farmers should consult with local Krishi Vigyan Kendra (KVK) officers or certified agronomists for field-scale interventions.*

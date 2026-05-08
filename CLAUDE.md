# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vital Watch** is a full-stack health monitoring and risk assessment app. Patients submit vitals and lifestyle data; the backend automatically calculates disease risk scores (hypertension, diabetes, stroke) and raises alerts when risk is high.

- **Backend**: Django REST Framework + Simple JWT, SQLite, running on `http://127.0.0.1:8000`
- **Frontend**: React 19 + Vite + Tailwind CSS, running on `http://localhost:5173`
- During development, Vite proxies `/api/*` requests to the Django backend, so both can be reached without CORS issues.

---

## Development Commands

### Backend (Django)
```bash
# From project root
python manage.py runserver        # Start API server
python manage.py migrate          # Apply migrations
python manage.py makemigrations   # Generate migration files
python manage.py createsuperuser  # Create admin account
python manage.py shell            # Django REPL
```

### Frontend (React + Vite)
```bash
# From frontend/
npm install      # Install dependencies
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

> Both servers must be running simultaneously during development.

---

## Architecture

### Backend (`core/` app)

The backend uses a **signal-driven architecture** — submitting a new `HealthMetric` automatically triggers downstream computation:

```
POST /api/metrics/create/
  → HealthMetric saved
  → Django signal fires
    → risk_engine.calculate_risk() computes 4 scores (pure function, no DB)
    → RiskScore record created
    → If overall_risk ≥ 50 → Alert created (medium/high severity)
```

Key files:
- `core/models.py` — `User` (email-based, custom AbstractBaseUser), `PatientProfile` (1:1 with User), `HealthMetric`, `RiskScore`, `Alert`
- `core/services/risk_engine.py` — pure risk calculation logic, no database access
- `core/signals.py` — wires metric creation → risk calculation → alert generation
- `core/views.py` — DRF generic views for all endpoints
- `core/serializers.py` — validates `activity_level` and `diet_quality_score` as integers 1–10
- `vital_watch/settings.py` — JWT access token lifetime is 60 minutes; auth uses email (no username)

### Frontend (`frontend/src/`)

```
App (Router)
├── AuthContext (Context API)        ← JWT token in localStorage, axios interceptor
├── ProtectedRoute                   ← Redirects unauthenticated users
└── Pages
    ├── LoginPage / RegisterPage
    ├── DashboardPage                ← Risk cards + BP/Glucose line charts + recent alerts
    ├── MetricsPage                  ← Form to submit vitals + lifestyle data
    └── AlertsPage                   ← Currently a stub
```

State management is intentionally minimal:
- **Auth state** lives in `AuthContext` (token, login, logout)
- **Page state** is local `useState` per component
- **Data fetching** uses direct `axios` calls inside `useEffect`, with `Promise.all` for parallel requests on the dashboard

### API Endpoints

```
POST  /api/auth/register/       – Create account
POST  /api/auth/token/          – Login (returns JWT)
POST  /api/auth/token/refresh/  – Refresh access token
GET   /api/profile/             – Fetch patient profile
PUT   /api/profile/             – Update patient profile
GET   /api/metrics/             – List all health metrics
POST  /api/metrics/create/      – Submit new metric (triggers risk calc)
GET   /api/risk/latest/         – Latest risk score (404 if none yet)
GET   /api/alerts/              – List all alerts
```

All non-auth endpoints require `Authorization: Bearer <token>`.

---

## Key Conventions

- The frontend handles `/api/risk/latest/` returning 404 gracefully (no metrics submitted yet is a valid state).
- Risk scores are stored as percentages (0–100). Alert severity is `medium` at ≥50%, `high` at ≥70%.
- `PatientProfile` is auto-created via a Django signal when a new `User` is created — never create one manually.
- Tailwind CSS utilities are used directly in JSX; there is no component library.
- Environment config lives in `.env` at the project root (not committed). The `SECRET_KEY` there is a dev placeholder.

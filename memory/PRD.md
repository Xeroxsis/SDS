# NeuroScan AI - Stroke Detection WebApp PRD

## Problem Statement
Build a stroke detection webapp that scans MRI images and detects the type of stroke using an ML-based model (no LLM APIs). Features: JWT authentication, patient history/record management, PDF report generation, minimalistic medical homepage, model fine-tuning, role-based access control, GitHub Pages compatible.

## Architecture
- **Frontend**: React 19 + TailwindCSS + Shadcn UI (HashRouter for GitHub Pages)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **ML Model**: OpenCV + NumPy feature extraction + RandomForest (trainable)
- **PDF Generation**: ReportLab

## User Personas
1. **Admin**: Full access - user management, model training, all features
2. **Doctor**: Scans, patients, training data upload, reports
3. **Nurse**: View-only access to scans, patients, reports

## What's Been Implemented (April 13, 2026)
### Phase 1 - MVP
- [x] Landing page with hero, features, how-it-works sections
- [x] JWT Authentication (register, login, logout, refresh)
- [x] Patient CRUD (create, read, update, delete)
- [x] MRI scan upload & ML analysis
- [x] Scan results with probability charts
- [x] PDF report generation
- [x] Dashboard with stats

### Phase 2 - RBAC + Training + Deployment
- [x] Role-based access control (admin/doctor/nurse)
- [x] Admin user management page (list users, change roles, delete)
- [x] Model fine-tuning page (upload labeled data, trigger training)
- [x] Training history tracking
- [x] RandomForest model training on uploaded data
- [x] HashRouter for GitHub Pages hosting compatibility
- [x] Removed Emergent branding badge
- [x] Role badges in sidebar navigation
- [x] Role-aware navigation (admin sees Admin link)

## Deployment Notes (GitHub Pages)
- Frontend uses HashRouter - all routes are hash-based (/#/dashboard)
- Add `"homepage": "."` to package.json (already set)
- Build: `cd frontend && yarn build`
- Deploy `build/` folder to GitHub Pages
- Set REACT_APP_BACKEND_URL to your backend URL before building
- Backend must be hosted separately (Railway, Heroku, VPS, etc.)

## Prioritized Backlog
### P1
- DICOM file format support
- Batch upload for multiple MRI slices
- Scan comparison feature
- Export scan history to CSV

### P2
- Multi-factor authentication
- PACS integration
- Real-time collaboration annotations
- Mobile responsive optimizations

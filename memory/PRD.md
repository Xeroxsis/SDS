# NeuroScan AI - Stroke Detection WebApp PRD

## Problem Statement
Build a stroke detection webapp that scans MRI images and detects the type of stroke using an ML-based model (no LLM APIs). Features: JWT authentication, patient history/record management, PDF report generation, minimalistic medical homepage.

## Architecture
- **Frontend**: React 19 + TailwindCSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **ML Model**: OpenCV + NumPy feature extraction + rule-based classification
- **PDF Generation**: ReportLab

## User Personas
1. **Medical Professional**: Uploads MRI scans for quick screening
2. **Researcher**: Uses the tool for educational analysis
3. **Admin**: Manages system and user accounts

## Core Requirements
- ML-based MRI analysis (no external LLM APIs)
- Stroke classification: Hemorrhagic, Ischemic, Normal
- JWT authentication with httpOnly cookies
- Patient CRUD management
- Scan upload, analysis, and history
- PDF report generation
- Landing page + authenticated dashboard

## What's Been Implemented (April 13, 2026)
- [x] Landing page with hero, features, how-it-works sections
- [x] JWT Authentication (register, login, logout, refresh, me)
- [x] Admin seeding on startup
- [x] Patient CRUD (create, read, update, delete)
- [x] MRI scan upload & ML analysis
- [x] ML model: feature extraction (intensity, asymmetry, edges, texture, spatial) + classification
- [x] Scan results page with probability chart (Recharts pie chart)
- [x] PDF report generation with ReportLab
- [x] Dashboard with stats and recent scans
- [x] Responsive sidebar layout
- [x] Medical minimalist design (Outfit + Manrope fonts)

## Prioritized Backlog
### P0 - Done
- All core features implemented and tested

### P1 - Next Phase
- DICOM file format support
- Batch upload for multiple MRI slices
- Scan comparison feature (compare two scans)
- Export scan history to CSV

### P2 - Future
- Training pipeline for custom model weights
- Multi-user role management (doctor, nurse, admin)
- PACS integration
- Real-time collaboration/annotations
- Mobile responsive optimizations

## Next Tasks
1. Add DICOM file support for professional medical imaging
2. Implement scan comparison feature
3. Add training data upload for model fine-tuning
4. Role-based access control

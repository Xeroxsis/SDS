# NeuroScan AI - Stroke Detection WebApp PRD

## Architecture
- **Frontend**: React 19 + TailwindCSS + Shadcn UI (HashRouter)
- **Backend**: FastAPI + MongoDB
- **ML**: Ensemble model - ResNet18 CNN (85.5% accuracy) + RandomForest (73%)
- **Dataset**: 2,501 real brain CT images (Peco602/brain-stroke-detection)
- **Key Files**:
  - CNN model: `/app/backend/cnn_model.pt` (43MB)
  - RF model: `/app/backend/pretrained_model.pkl` (2.8MB)
  - Demo images: `/app/backend/demo_data/` (6 real CT images)
  - CNN trainer: `/app/backend/train_cnn.py`
  - RF trainer: `/app/backend/build_model.py`

## Implemented Features
- JWT Auth + RBAC (admin/doctor/nurse)
- MRI/CT upload + ML analysis (ensemble CNN+RF)
- Batch upload (up to 20 files)
- 6 real CT demo images with one-click analysis
- Scan comparison (side-by-side with probability chart + feature deltas)
- Patient management, PDF reports, Dashboard
- Model training page, Admin user management
- HashRouter for GitHub Pages deployment

## Backlog
- P1: DICOM support, confidence threshold flagging
- P2: Data augmentation for training, mobile optimization

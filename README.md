# MMU Smart Parking System 🚗

Real-time parking monitoring using ESP32-CAM, OpenCV, and Firebase.

## Quick Start

### 1. Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```
→ Opens at **http://localhost:5000** (Admin Dashboard)

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
→ Opens at **http://localhost:3000/dashboard**

### 3. CV Engine (Python)
```bash
cd cv-engine
python -m venv venv
.\venv\Scripts\activate    # Windows
pip install -r requirements.txt
python main.py
```

## Configuration

### ESP32-CAM IP
Edit `cv-engine/config.py`:
```python
CAMERA_SOURCE = "http://YOUR_ESP32_IP:81/stream"
```

### Firebase
1. Place `firebase-service-account.json` in `backend/`
2. Configure `.env.local` in `frontend/` with Firebase keys

## Architecture

```
ESP32-CAM → Python CV Engine → NestJS Backend → Firebase → Next.js Dashboard
   (Stream)    (Detection)       (API)         (Storage)     (Real-time UI)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/events/entry` | POST | Record vehicle entry |
| `/events/exit` | POST | Record vehicle exit |
| `/events/stats` | GET | Current occupancy |
| `/events/history` | GET | Recent events |
| `/admin/reset` | POST | Reset count to 0 |

## Tech Stack

- **IoT**: ESP32-CAM (C++/Arduino)
- **CV Engine**: Python + OpenCV
- **Backend**: NestJS + Firebase Admin SDK
- **Frontend**: Next.js + React
- **Database**: Firebase Firestore

---

MMU Smart Parking System • FYP Project

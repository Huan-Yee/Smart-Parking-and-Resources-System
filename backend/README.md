# MMU Smart Parking System — Backend

NestJS REST API backend for the MMU Smart Parking System FYP prototype.

---

## Overview

This backend receives parking events from the CV Engine (running on a laptop connected to ESP32-CAM devices), stores them in Firebase Firestore, maintains a live occupancy count, and exposes API endpoints for the Next.js admin dashboard.

```
ESP32-CAM (entry) ──┐
                     ├──▶  CV Engine (Python/OpenCV)  ──▶  NestJS Backend  ──▶  Firestore
ESP32-CAM (exit)  ──┘                                              │
                                                                    ▼
                                                       Next.js Admin Dashboard
```

### Prototype Scope

| Parameter | Value |
|---|---|
| Parking lots | **10** (defined in `src/config/parking.config.ts`) |
| Route type | One-way |
| Entry camera | ESP32-CAM #1 |
| Exit camera | ESP32-CAM #2 |
| License plate recognition | **Not implemented** — ESP32-CAM QVGA resolution is insufficient for ALPR. The CV engine sends `"DETECTED_CAR"` as a generic label. ALPR is documented as a future improvement for higher-resolution cameras or edge AI hardware. |

---

## API Endpoints

### Health Check

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Returns backend service status and timestamp |

### Events (called by the CV Engine)

| Method | Route | Description |
|---|---|---|
| `POST` | `/events/entry` | Record a vehicle entry — increments occupied count |
| `POST` | `/events/exit` | Record a vehicle exit — decrements occupied count |
| `POST` | `/events/snapshot` | *(Stub)* Receive an ESP32-CAM image frame — future use |

### Stats & History (consumed by the Next.js dashboard)

| Method | Route | Description |
|---|---|---|
| `GET` | `/events/stats` | Live occupancy: `{ occupied, total, available, lastUpdated }` |
| `GET` | `/events/history?limit=N` | Recent events, newest first (default 20) |

### Admin

| Method | Route | Description |
|---|---|---|
| `POST` | `/events/set-count` | Manually override occupied count (use when CV count drifts) |

---

## Request / Response Examples

### POST /events/entry

**Request body** (sent by CV Engine):
```json
{
  "licensePlate": "DETECTED_CAR",
  "entryTime": 1748675060.123
}
```

> `entryTime` is the backward-compatible alias sent by the current CV engine.
> New integrations should use `timestamp` instead. The backend resolves event
> time as: `timestamp ?? entryTime ?? server time`.

**Response (success)**:
```json
{
  "status": "success",
  "message": "Vehicle DETECTED_CAR entry recorded.",
  "occupied": 3,
  "total": 10,
  "timestamp": "2026-05-31T09:00:00.000Z"
}
```

**Response (lot full)**:
```json
{
  "statusCode": 400,
  "message": "Parking lot is full (10/10)."
}
```

### GET /events/stats

```json
{
  "occupied": 3,
  "total": 10,
  "available": 7,
  "lastUpdated": { "_seconds": 1748675060, "_nanoseconds": 0 }
}
```

### POST /events/set-count

```json
{ "occupied": 5 }
```

Response:
```json
{
  "status": "success",
  "message": "Occupied count set to 5.",
  "occupied": 5,
  "total": 10,
  "available": 5
}
```

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Project Settings → Service Accounts**.
3. Click **Generate New Private Key** and download the JSON file.
4. Save it at `backend/firebase-service-account.json`.

> ⚠️ **Never commit this file.** It is in `.gitignore`.

### Firestore Collections

| Collection | Document | Purpose |
|---|---|---|
| `events` | (auto-ID) | Individual entry/exit event records |
| `live_counts` | `summary` | Live occupancy counter (`occupied`, `lastUpdated`) |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend listen port | `5001` |
| `FIREBASE_SERVICE_ACCOUNT` | JSON string of service account (cloud deployment alternative to the file) | — |

> **Port note:** The CV engine (`cv-engine/config.py`) defaults to port `5000`. Update `BACKEND_URL` in `config.py` to `http://localhost:5001` (or your machine's LAN IP) before running the full system.

---

## Running Locally

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The backend listens on **http://localhost:5001** by default.

---

## Lint & Build

```bash
# TypeScript compile check
npm run build

# ESLint + Prettier
npm run lint

# Format source files
npm run format
```

---

## Prototype Capacity

Capacity is configured in a single file:

```
backend/src/config/parking.config.ts
```

```typescript
export const PARKING_CONFIG = {
  TOTAL_LOTS: 10,      // ← change this to resize the prototype
  DEFAULT_ZONE: 'gate-main',
} as const;
```

All capacity checks, stats calculations, and DTO validators reference `PARKING_CONFIG.TOTAL_LOTS`. No other file hardcodes the capacity number.

---

## Future Improvements

- **ALPR (License Plate Recognition):** Replace the generic `DETECTED_CAR` label with real plate text using a higher-resolution camera (e.g., ESP32-S3 Eye with AI acceleration) or cloud-side OCR on uploaded frames via the `/events/snapshot` stub.
- **Snapshot persistence:** Store ESP32-CAM frames in Firebase Storage and link them to events.
- **Authentication:** Add API key or JWT guard to the admin endpoints before production deployment.
- **Multi-zone support:** The `zoneId` field is already captured per event; extend stats to break occupancy down by zone.

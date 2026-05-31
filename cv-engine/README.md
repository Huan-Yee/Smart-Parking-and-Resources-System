# CV Engine — MMU Smart Parking System

Python-based computer vision engine that reads MJPEG streams from ESP32-CAM
devices, performs motion/vehicle-passing detection using OpenCV, and reports
parking entry/exit events to the NestJS backend.

## Architecture

```
ESP32-CAM (Entry) ──MJPEG──→ ┌──────────────────┐ ──POST /events/entry──→ NestJS :5001
                              │   CV Engine       │                              ↓
ESP32-CAM (Exit)  ──MJPEG──→ │   (Python/OpenCV) │ ──POST /events/exit───→ Firebase
                              └──────────────────┘                              ↓
                                                                          Next.js Dashboard
```

One Python script (`main.py`) drives **either** camera role — no duplicate files.

---

## ⚠️ ALPR Disclaimer

> **Current ESP32-CAM resolution (QVGA 320×240 or VGA 640×480) is used only for
> motion / vehicle-passing detection.  License plate recognition (ALPR) is NOT
> implemented and NOT possible at this resolution.**
>
> ALPR is a documented future improvement requiring:
> - Higher-resolution IP cameras (1080p or 4K), or
> - Dedicated edge-AI hardware (NVIDIA Jetson Nano, Google Coral TPU), or
> - Cloud-based ALPR APIs with good network coverage
>
> The `licensePlate` field in every event payload is always `"DETECTED_CAR"`.

---

## File Structure

```
cv-engine/
├── main.py              # Entry point — parses --role, wires components, runs loop
├── config.py            # All configuration: URLs, thresholds, ROI, role mappings
├── detector.py          # MotionDetector class (ROI, MOG2, contours, cooldown)
├── backend_client.py    # BackendClient class (POST events, error handling)
├── requirements.txt     # Python dependencies
├── .env.example         # Template for environment variable config
├── .env                 # Your local config (NOT committed to git)
├── README.md            # This file
└── arduino/
    └── esp32cam_parking.ino   # Copy-ready Arduino sketch for AI Thinker ESP32-CAM
```

---

## Part 1 — Python CV Engine Setup

### 1.1 Prerequisites

- Python 3.9 or later
- pip

### 1.2 Create a virtual environment

```bash
cd cv-engine
python -m venv venv
```

Activate the environment:

```bash
# macOS / Linux
source venv/bin/activate

# Windows (Command Prompt)
venv\Scripts\activate.bat

# Windows (PowerShell)
venv\Scripts\Activate.ps1
```

### 1.3 Install dependencies

```bash
pip install -r requirements.txt
```

### 1.4 Configure environment

```bash
cp .env.example .env
```

Open `.env` and set your values:

```dotenv
BACKEND_URL=http://localhost:5001        # or your laptop LAN IP
ENTRY_CAMERA_URL=http://192.168.x.x:81/stream   # from Serial Monitor
EXIT_CAMERA_URL=http://192.168.x.x:81/stream    # from Serial Monitor
```

---

## Part 2 — Running the CV Engine

### 2.1 Start the entry camera

```bash
python main.py --role entry
```

### 2.2 Start the exit camera (second terminal)

```bash
python main.py --role exit
```

> Run both simultaneously in separate terminal windows.  
> Each opens its own debug window titled `[ENTRY] Live Feed` or `[EXIT] Live Feed`.

### 2.3 Desktop testing (no ESP32-CAM required)

Test the full pipeline before field deployment using a laptop webcam or video file:

```bash
# Laptop webcam (index 0)
python main.py --role entry --source 0

# Recorded video file (loops automatically)
python main.py --role entry --source test_clip.mp4
```

### 2.4 Environment variable alternative

```bash
CAMERA_ROLE=entry python main.py
CAMERA_ROLE=exit  python main.py
```

### 2.5 Headless mode (no GUI)

Set `DEBUG_WINDOW=false` in `.env` to suppress OpenCV windows (e.g. for demo booths):

```bash
DEBUG_WINDOW=false python main.py --role entry
```

---

## Part 3 — Configuration Reference

All values can be set in `.env` (recommended) or directly in `config.py`.

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://localhost:5001` | NestJS backend base URL |
| `ENTRY_CAMERA_URL` | `http://192.168.1.100:81/stream` | Entry ESP32-CAM stream |
| `EXIT_CAMERA_URL` | `http://192.168.1.101:81/stream` | Exit ESP32-CAM stream |
| `MIN_CONTOUR_AREA` | `3000` | Minimum foreground blob area (px²) to count as vehicle |
| `TRIGGER_COOLDOWN_SECONDS` | `8` | Seconds between consecutive triggers (anti-duplicate) |
| `FRAME_RESIZE_WIDTH` | `320` | Frame processing width in pixels |
| `MOG2_HISTORY` | `300` | Frames used to model background |
| `MOG2_VAR_THRESHOLD` | `40` | Foreground/background sensitivity |
| `ROI_X_START` | `0.1` | ROI left edge (fraction of frame width) |
| `ROI_Y_START` | `0.3` | ROI top edge (fraction of frame height) |
| `ROI_X_END` | `0.9` | ROI right edge |
| `ROI_Y_END` | `0.9` | ROI bottom edge |
| `DEBUG_WINDOW` | `true` | Show OpenCV windows |

### Tuning guide

| Symptom | Adjustment |
|---------|-----------|
| False positives (wind, leaves) | Increase `MIN_CONTOUR_AREA` or narrow ROI |
| Motorcycle/small vehicle missed | Decrease `MIN_CONTOUR_AREA` |
| Same vehicle counted twice | Increase `TRIGGER_COOLDOWN_SECONDS` |
| Slow background adaptation | Decrease `MOG2_HISTORY` |
| Too sensitive to lighting change | Increase `MOG2_VAR_THRESHOLD` |

---

## Part 4 — ESP32-CAM Arduino IDE Setup

### 4.1 Hardware required

- AI Thinker ESP32-CAM board (×2 for entry + exit)
- FTDI USB-to-serial adapter (3.3 V logic, 5 V power) — the AI Thinker has no USB
- Jumper wire to pull IO0 to GND during upload

### 4.2 One-time Arduino IDE board setup

1. Open **Arduino IDE** → **File** → **Preferences**
2. In "Additional boards manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. **Tools** → **Board** → **Board Manager** → search `esp32` →  
   install **"esp32 by Espressif Systems"** (version 2.x recommended)
4. **Tools** → **Board** → **ESP32 Arduino** → **AI Thinker ESP32-CAM**
5. **Tools** → **Upload Speed** → `115200`
6. **Tools** → **Port** → select the FTDI adapter's COM/tty port

### 4.3 Upload wiring (FTDI adapter)

| ESP32-CAM pin | FTDI adapter pin |
|---------------|-----------------|
| GND | GND |
| 5V | VCC (5 V) |
| U0R (RX0) | TX |
| U0T (TX0) | RX |
| IO0 | GND ← **pull LOW before uploading** |

After upload completes: remove the IO0–GND jumper, then press **RST**.

### 4.4 Upload the sketch

Open `arduino/esp32cam_parking.ino` in Arduino IDE.

Edit the three lines at the top of the CONFIGURATION SECTION:

```cpp
#define WIFI_SSID      "YourHotspotName"    // ← your mobile hotspot SSID
#define WIFI_PASSWORD  "YourPassword"       // ← your mobile hotspot password
#define CAMERA_ROLE    "ENTRY"              // ← "ENTRY" for entry cam, "EXIT" for exit
```

Upload (Ctrl+U / ⌘+U).

### 4.5 Recommended camera settings

The sketch defaults to QVGA + quality 12, which is the recommended starting point.

| Resolution | Constant | FPS (typical) | When to use |
|------------|----------|--------------|-------------|
| **QVGA 320×240** | `FRAMESIZE_QVGA` | 8–12 | ✅ Recommended — stable over mobile hotspot |
| VGA 640×480 | `FRAMESIZE_VGA` | 4–8 | Optional — if hotspot signal is strong |
| SVGA 800×600 | `FRAMESIZE_SVGA` | 2–4 | ❌ Not recommended for this prototype |

To change resolution, edit the line in the CONFIGURATION SECTION:

```cpp
#define CAMERA_FRAMESIZE  FRAMESIZE_QVGA  // or FRAMESIZE_VGA
```

JPEG quality (0 = smallest/fastest, 63 = largest/best):

```cpp
#define JPEG_QUALITY  12   // 10–15 is the sweet spot
```

### 4.6 Finding the ESP32-CAM IP address

1. Open **Tools** → **Serial Monitor** at **115200 baud**
2. Press the **RST** button on the ESP32-CAM
3. Wait for:
   ```
   [OK] Camera initialised.
   [OK] Wi-Fi connected.
   [OK] IP Address: 192.168.x.x
   ----------------------------------------------
    Camera Ready! [ENTRY]
    Stream URL: http://192.168.x.x:81/stream
    Copy this URL into cv-engine/.env
   ----------------------------------------------
   ```
4. Test the URL in your browser — you should see the live video feed
5. Copy the URL into `.env` as `ENTRY_CAMERA_URL` or `EXIT_CAMERA_URL`

### 4.7 Mobile hotspot tips

- **Both ESP32-CAMs and the laptop** must connect to the **same hotspot**
- Keep the phone **plugged in to a charger** — two cameras streaming will drain the battery in minutes
- The **IP address may change** every time the hotspot is restarted or the ESP32-CAM reconnects  
  → Always re-check Serial Monitor before a field test session
- Test the stream URL in a browser **before** starting the CV engine
- If the stream lags or drops: switch from VGA to QVGA, or move closer to the phone

---

## Part 5 — Backend API Integration

The CV engine sends events to the NestJS backend running on port 5001.

### Event payload

```json
{
    "licensePlate": "DETECTED_CAR",
    "timestamp":    1748700000,
    "zoneId":       "gate-main"
}
```

| Field | Value | Note |
|-------|-------|------|
| `licensePlate` | `"DETECTED_CAR"` | Static placeholder — no ALPR |
| `timestamp` | `int(time.time())` | Unix seconds |
| `zoneId` | `"gate-main"` | Matches backend default; sent explicitly for clear logs |

### Endpoints

| Role | Method | Path |
|------|--------|------|
| Entry camera | POST | `/events/entry` |
| Exit camera | POST | `/events/exit` |

### Backend capacity limit

When all 10 lots are occupied, `/events/entry` returns HTTP 400  
`"Parking lot is full (10/10)"`.  
The CV engine logs this as a warning and continues running — it does not suppress detection.

---

## Part 6 — Testing Plan

### Phase 1 — Desktop testing (no hardware needed)

| Test | Command | Validates |
|------|---------|-----------|
| Webcam entry detection | `python main.py --role entry --source 0` + wave hand in ROI | Detection pipeline, debug windows |
| Webcam exit detection | `python main.py --role exit --source 0` + wave hand | Exit endpoint, correct zone |
| Video file loop | `python main.py --role entry --source clip.mp4` | File input, looping |
| Backend event | Run with `npm run start:dev` in backend/, trigger detection | Payload accepted, HTTP 201 |
| Dashboard update | Trigger entry → check Next.js at `localhost:3000/dashboard` | End-to-end flow |
| Cooldown behaviour | Wave continuously for 30 s | At most `30/cooldown` triggers |
| ROI boundary | Wave hand outside the cyan ROI rectangle → should NOT trigger | ROI crop working |

### Phase 2 — ESP32-CAM bench testing

1. Upload sketch to both ESP32-CAMs with hotspot credentials
2. Connect laptop to same hotspot
3. Verify stream URLs in browser
4. Run `python main.py --role entry` and `python main.py --role exit` in separate terminals
5. Walk through each camera's field of view
6. Verify events appear in backend logs and dashboard

### Phase 3 — Field testing (prototype deployment)

1. Mount entry camera facing the entry gate (1–3 m distance)
2. Mount exit camera facing the exit gate
3. Adjust ROI coordinates in `.env` until the cyan rectangle covers the gate area
4. Ask a friend to drive through entry gate → verify entry event
5. Drive out through exit gate → verify exit event and occupancy count decreases
6. Record false positives (unexpected triggers) and false negatives (missed vehicles)
7. Tune `MIN_CONTOUR_AREA`, `TRIGGER_COOLDOWN_SECONDS`, and ROI until stable

### Metrics to record for FYP report

- True positive rate: detected vehicles / actual vehicles
- False positive rate: false triggers / total triggers
- Detection latency: time from vehicle entering ROI to trigger
- Stream stability: dropped frames per minute

---

## Part 7 — Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| `Error: Could not open video source` | Wrong stream URL or ESP32-CAM not reachable | Check IP in Serial Monitor; test URL in browser; verify same hotspot |
| Stream lags heavily | VGA over weak hotspot | Switch to `FRAMESIZE_QVGA` in the sketch |
| False positives constantly | ROI too wide, low threshold | Narrow ROI in `.env`; increase `MIN_CONTOUR_AREA` |
| No triggers at all | ROI too small or threshold too high | Widen ROI; decrease `MIN_CONTOUR_AREA`; check debug window |
| Backend rejected (400) with "full" | Lot capacity reached | Use `/events/set-count` or the dashboard manual correction control |
| Backend refused connection | NestJS not running or wrong port | Run `npm run start:dev` in backend/; verify `BACKEND_URL` in `.env` |
| ESP32-CAM won't connect to Wi-Fi | Wrong SSID/password | Re-check CONFIGURATION SECTION in `.ino`; re-upload |
| IP address changed | Hotspot reassigned IP | Re-check Serial Monitor; update `.env` |
| Upload fails in Arduino IDE | IO0 not pulled LOW | Ensure IO0–GND jumper is in place before clicking Upload |

---

## Part 8 — Future Improvements

The following features are intentionally out of scope for the FYP prototype but are documented for future development:

| Feature | Current state | Future requirement |
|---------|--------------|-------------------|
| **License plate recognition (ALPR)** | Not implemented — QVGA/VGA too low | 1080p+ IP cameras, or edge-AI (Jetson/Coral), or cloud ALPR API |
| **Exact parking slot detection** | Not implemented | Top-down camera, YOLO/semantic segmentation, higher resolution |
| **Night/low-light detection** | Not tested | IR LEDs on ESP32-CAM, night mode sensor tuning |
| **Dedicated IoT router** | Mobile hotspot (prototype only) | Fixed Wi-Fi router or campus network; VLAN for IoT devices |
| **Edge detection on device** | All detection on laptop | ESP32-S3 or ESP-EYE with TensorFlow Lite Micro |
| **Two-camera multi-thread** | Two separate terminals | Single process with two threads/asyncio tasks |
| **Event retry queue** | Missed events logged only | Redis/SQLite local queue with replay on reconnect |

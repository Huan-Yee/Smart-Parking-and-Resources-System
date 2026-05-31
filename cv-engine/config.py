"""
config.py — MMU Smart Parking CV Engine Configuration
======================================================
All settings are overridable via environment variables or a .env file.
Copy .env.example to .env and edit before running.
"""

import os
from dotenv import load_dotenv

# Load .env file if present (silently ignored if missing)
load_dotenv()

# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------

# NestJS backend base URL — change to your laptop's LAN IP when field testing
# e.g. http://192.168.x.x:5001 so the ESP32-CAM can reach it over the hotspot
BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:5001")

# ---------------------------------------------------------------------------
# Camera Stream URLs
# ---------------------------------------------------------------------------

# IP addresses assigned to each ESP32-CAM by the hotspot.
# Find these on the Arduino Serial Monitor after upload (115200 baud).
# Stream path is always :81/stream for the CameraWebServer sketch.
ENTRY_CAMERA_URL: str = os.getenv(
    "ENTRY_CAMERA_URL", "http://192.168.1.100:81/stream"
)
EXIT_CAMERA_URL: str = os.getenv(
    "EXIT_CAMERA_URL", "http://192.168.1.101:81/stream"
)

# ---------------------------------------------------------------------------
# Role → Config Mapping
# ---------------------------------------------------------------------------
# Each role specifies:
#   camera_url  — MJPEG stream to read
#   endpoint    — backend route to POST to
#   zone_id     — sent explicitly in the payload for clear logging
#                 (backend also defaults to "gate-main" if omitted)
#   label       — display name shown in log lines and debug windows

ROLE_CONFIG: dict = {
    "entry": {
        "camera_url": ENTRY_CAMERA_URL,
        "endpoint":   "/events/entry",
        "zone_id":    "gate-main",
        "label":      "ENTRY",
    },
    "exit": {
        "camera_url": EXIT_CAMERA_URL,
        "endpoint":   "/events/exit",
        "zone_id":    "gate-main",
        "label":      "EXIT",
    },
}

# ---------------------------------------------------------------------------
# Detection Tuning
# ---------------------------------------------------------------------------

# Minimum foreground contour area (pixels²) to count as a vehicle.
# Increase if wind/leaves cause false positives.
# Decrease if small motorcycles are being missed.
MIN_CONTOUR_AREA: int = int(os.getenv("MIN_CONTOUR_AREA", "3000"))

# Seconds between consecutive trigger events (anti-duplicate cooldown).
# Increase if the same vehicle is counted more than once.
TRIGGER_COOLDOWN_SECONDS: float = float(os.getenv("TRIGGER_COOLDOWN_SECONDS", "8"))

# ---------------------------------------------------------------------------
# Frame Preprocessing
# ---------------------------------------------------------------------------

# Target width (px) to resize frames before processing.
# QVGA streams come in at 320 px — keep at 320.
# Increase to 400 only if using VGA and needing more ROI precision.
FRAME_RESIZE_WIDTH: int = int(os.getenv("FRAME_RESIZE_WIDTH", "320"))

# Gaussian blur kernel size (must be odd integers).
# Reduces JPEG compression noise and sensor grain.
BLUR_KERNEL_SIZE: tuple = (21, 21)

# ---------------------------------------------------------------------------
# MOG2 Background Subtractor
# ---------------------------------------------------------------------------

# Number of frames used to model the background.
# Lower = adapts faster to lighting changes; higher = more stable.
MOG2_HISTORY: int = int(os.getenv("MOG2_HISTORY", "300"))

# Mahalanobis distance threshold for foreground/background decision.
# Lower = more sensitive (catches subtle motion); higher = less noise.
MOG2_VAR_THRESHOLD: int = int(os.getenv("MOG2_VAR_THRESHOLD", "40"))

# Detect and mark shadows (gray pixels) in the foreground mask.
# We threshold them away later, but keeping it True helps MOG2 accuracy.
MOG2_DETECT_SHADOWS: bool = True

# ---------------------------------------------------------------------------
# Region of Interest (ROI)
# ---------------------------------------------------------------------------
# Defined as fractions of the frame (0.0 – 1.0).
# The detector crops to this region before running MOG2, so motion outside
# the gate area (sky, trees, pedestrians) is completely ignored.
#
# Default covers the centre-horizontal band of the frame:
#   X: 10% – 90% of width  (ignore narrow edges)
#   Y: 30% – 90% of height (ignore top sky/canopy)
#
# Adjust after mounting the camera and running in debug mode.

ROI_X_START: float = float(os.getenv("ROI_X_START", "0.1"))
ROI_Y_START: float = float(os.getenv("ROI_Y_START", "0.3"))
ROI_X_END:   float = float(os.getenv("ROI_X_END",   "0.9"))
ROI_Y_END:   float = float(os.getenv("ROI_Y_END",   "0.9"))

# ---------------------------------------------------------------------------
# Debug / Display
# ---------------------------------------------------------------------------

# Show OpenCV windows (live feed + motion mask).
# Set to False for headless servers or demo booths without a monitor.
DEBUG_WINDOW: bool = os.getenv("DEBUG_WINDOW", "true").lower() == "true"

# ---------------------------------------------------------------------------
# Stream Reconnect
# ---------------------------------------------------------------------------

# How many times to retry opening the stream before giving up.
STREAM_RETRY_ATTEMPTS: int = 5

# Seconds to wait between reconnect attempts.
STREAM_RETRY_DELAY: float = 3.0

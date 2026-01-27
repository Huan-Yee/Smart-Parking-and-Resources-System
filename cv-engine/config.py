import os

# Configuration for Smart Parking CV Engine

# The URL of your NestJS Backend
# Use 'http://localhost:5000' if running locally
# Use your Laptop's IP (e.g., 'http://192.168.0.101:5000') if running on a separate device
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

# API Endpoints
API_ENTRY = f"{BACKEND_URL}/api/parking/entry"
API_EXIT = f"{BACKEND_URL}/api/parking/exit"

# Camera Source
# Use an integer (0, 1) for a USB Webcam
# Use a URL (e.g., 'http://192.168.0.100:81/stream') for ESP32-CAM
# Use a file path (e.g., 'test_video.mp4') for debugging
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "0") 

# Detection Settings
CONFIDENCE_THRESHOLD = 0.5

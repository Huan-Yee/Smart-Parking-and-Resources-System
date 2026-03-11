import os

# Configuration for Smart Parking CV Engine

# The URL of your NestJS Backend
# Use 'http://localhost:5000' if running locally
# Use your Laptop's IP (e.g., 'http://192.168.0.101:5000') if running on a separate device
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

# API Endpoints
# API Endpoints
API_ENTRY = f"{BACKEND_URL}/events/entry"
API_EXIT = f"{BACKEND_URL}/events/exit"

# Camera Source
# Use a URL (e.g., 'http://192.168.0.100:81/stream') for ESP32-CAM
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "http://192.168.1.9:81/stream") 

# Detection Settings
CONFIDENCE_THRESHOLD = 0.5

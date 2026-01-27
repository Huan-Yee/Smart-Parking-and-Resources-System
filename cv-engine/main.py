import cv2
import time
import requests
import config

def main():
    print(f"Starting CV Engine...")
    print(f"Connecting to Camera: {config.CAMERA_SOURCE}")
    print(f"Backend URL: {config.BACKEND_URL}")

    # Initialize Video Capture (Webcam, File, or IP Stream)
    # If CAMERA_SOURCE is a digit (e.g. "0"), convert to int for USB camera
    source = int(config.CAMERA_SOURCE) if config.CAMERA_SOURCE.isdigit() else config.CAMERA_SOURCE
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print("Error: Could not open video source.")
        return

    print("Video stream started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame. Exiting or Retrying...")
            break

        # --- TODO: Place Detection Logic Here ---
        # 1. Detect License Plate
        # 2. Recognize Text (OCR)
        # 3. If new plate found -> trigger_entry_event(plate_text)
        
        # Display the stream for debugging
        cv2.imshow('Smart Parking CV View', frame)

        # Press 'q' to exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

def trigger_entry_event(plate_text):
    """
    Sends a POST request to the NestJS Backend when a car enters.
    """
    pkg = {
        "licensePlate": plate_text,
        "entryTime": time.time()
    }
    
    try:
        response = requests.post(config.API_ENTRY, json=pkg)
        if response.status_code == 201:
            print(f"[SUCCESS] Reported Entry: {plate_text}")
        else:
            print(f"[ERROR] Backend rejected: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] Connection Failed: {e}")

if __name__ == "__main__":
    main()

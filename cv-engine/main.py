import cv2
import time
import requests
import numpy as np
import config

def main():
    print(f"Starting CV Engine...")
    print(f"Connecting to Camera: {config.CAMERA_SOURCE}")
    print(f"Backend URL: {config.BACKEND_URL}")

    # Initialize Video Capture
    source = int(config.CAMERA_SOURCE) if config.CAMERA_SOURCE.isdigit() else config.CAMERA_SOURCE
    
    if isinstance(source, int):
        # Force DirectShow on Windows to resolve access errors (-1072875772)
        cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
    else:
        # IP Camera or File
        cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print("Error: Could not open video source.")
        return

    # Background Subtractor for Motion Detection
    fgbg = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=True)
    
    # Cooldown to prevent spamming the API
    last_trigger_time = 0
    TRIGGER_COOLDOWN = 10  # Seconds between entries

    print("Video stream started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            # If reading from a file, loop back to start
            if isinstance(source, str) and not source.startswith('http'):
                print("End of video file. Looping...")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                print("Failed to grab frame. Retrying...")
                break

        # 1. Apply Background Subtraction
        fgmask = fgbg.apply(frame)

        # 2. Remove noise (Shadows/Small dots)
        _, fgmask = cv2.threshold(fgmask, 244, 255, cv2.THRESH_BINARY)
        
        # 3. Find Contours (Shapes of moving objects)
        contours, _ = cv2.findContours(fgmask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        vehicle_detected = False
        
        for contour in contours:
            # Filter small movements (leaves, wind)
            if cv2.contourArea(contour) > 2000:
                # Draw bounding box around vehicle
                x, y, w, h = cv2.boundingRect(contour)
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                vehicle_detected = True

        # 4. Trigger Event if Vehicle Detected AND Cooldown passed
        if vehicle_detected:
            current_time = time.time()
            if current_time - last_trigger_time > TRIGGER_COOLDOWN:
                print(f"[ACTION] Vehicle Detected! Triggering Entry...")
                trigger_entry_event("DETECTED_CAR")
                last_trigger_time = current_time

        # Display the streams
        cv2.imshow('Smart Parking Live', frame)
        cv2.imshow('Motion Mask', fgmask)

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

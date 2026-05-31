"""
main.py — MMU Smart Parking CV Engine (v2.0)
============================================
Configurable entry point that drives either the ENTRY or EXIT camera role
from a single script.  No duplicate files, no hard-coded role logic.

Usage
-----
# Via command-line argument (recommended):
    python main.py --role entry
    python main.py --role exit

# Via environment variable (useful for scripts/shell aliases):
    CAMERA_ROLE=entry python main.py
    CAMERA_ROLE=exit  python main.py

# Override camera source for desktop testing (webcam or video file):
    python main.py --role entry --source 0          # laptop webcam
    python main.py --role entry --source clip.mp4   # recorded video

Architecture
------------
    ESP32-CAM (MJPEG stream)
        ↓  cv2.VideoCapture
    main.py  (orchestrator)
        ↓  MotionDetector.detect(frame)
    detector.py  (ROI → MOG2 → contours → cooldown)
        ↓  if triggered
    BackendClient.send_event()
    backend_client.py  (POST /events/entry | /events/exit)
        ↓
    NestJS Backend :5001  →  Firebase Firestore  →  Next.js Dashboard
"""

import argparse
import os
import sys
import time

import cv2

import config
from detector import MotionDetector
from backend_client import BackendClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def print_banner(role_cfg: dict, source: str) -> None:
    """Print a startup banner summarising the active configuration."""
    width = 52
    border = "╔" + "═" * width + "╗"
    bottom = "╚" + "═" * width + "╝"

    def row(text: str) -> str:
        pad = width - len(text) - 1
        return f"║ {text}{' ' * pad}║"

    print(border)
    print(row("MMU Smart Parking — CV Engine v2.0"))
    print(row(""))
    print(row(f"Role    : {role_cfg['label']}"))
    print(row(f"Camera  : {source[:47]}"))
    print(row(f"Backend : {config.BACKEND_URL}"))
    print(row(f"Endpoint: {role_cfg['endpoint']}"))
    print(row(f"Zone    : {role_cfg['zone_id']}"))
    print(row(""))
    print(row("Press 'q' in the debug window to quit."))
    print(bottom)


def open_stream(source: str | int, role_label: str) -> cv2.VideoCapture:
    """
    Attempt to open the video stream, retrying on failure.

    Args:
        source:      URL string, integer webcam index, or file path.
        role_label:  For log messages.

    Returns:
        An opened cv2.VideoCapture.

    Raises:
        SystemExit if all retries are exhausted.
    """
    for attempt in range(1, config.STREAM_RETRY_ATTEMPTS + 1):
        print(f"[{role_label}] Opening stream (attempt {attempt}/{config.STREAM_RETRY_ATTEMPTS}): {source}")
        cap = cv2.VideoCapture(source)
        if cap.isOpened():
            print(f"[{role_label}] Stream opened successfully.")
            return cap
        cap.release()
        if attempt < config.STREAM_RETRY_ATTEMPTS:
            print(f"[{role_label}] Failed. Retrying in {config.STREAM_RETRY_DELAY}s...")
            time.sleep(config.STREAM_RETRY_DELAY)

    print(f"[{role_label}] ERROR: Could not open stream after "
          f"{config.STREAM_RETRY_ATTEMPTS} attempts. Exiting.")
    sys.exit(1)


def resolve_source(raw_source: str) -> str | int:
    """
    Convert the --source argument to the correct type for VideoCapture.
      - Digit string ("0", "1") → int  (webcam index)
      - URL or file path        → str  (kept as-is)
    """
    if raw_source.isdigit():
        return int(raw_source)
    return raw_source


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def main() -> None:
    # -- Argument parsing --------------------------------------------------
    parser = argparse.ArgumentParser(
        description="MMU Smart Parking CV Engine — entry or exit camera role",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python main.py --role entry\n"
            "  python main.py --role exit\n"
            "  python main.py --role entry --source 0          # laptop webcam\n"
            "  python main.py --role entry --source clip.mp4   # video file\n"
            "  CAMERA_ROLE=exit python main.py                 # env var\n"
        ),
    )
    parser.add_argument(
        "--role",
        choices=["entry", "exit"],
        default=os.getenv("CAMERA_ROLE", "entry"),
        help="Camera role: 'entry' or 'exit'  (default: env CAMERA_ROLE or 'entry')",
    )
    parser.add_argument(
        "--source",
        default=None,
        help="Override camera source: webcam index (0), URL, or video file path",
    )
    args = parser.parse_args()

    # -- Load role config ---------------------------------------------------
    role_cfg = config.ROLE_CONFIG[args.role]
    label    = role_cfg["label"]

    # Camera source: CLI override → role config → default
    raw_source = args.source if args.source is not None else role_cfg["camera_url"]
    source     = resolve_source(raw_source)

    # -- Banner -------------------------------------------------------------
    print_banner(role_cfg, str(source))

    # -- Initialise components ----------------------------------------------
    detector = MotionDetector()
    client   = BackendClient(
        backend_url=config.BACKEND_URL,
        endpoint=role_cfg["endpoint"],
        zone_id=role_cfg["zone_id"],
        label=label,
    )

    # -- Open stream --------------------------------------------------------
    cap = open_stream(source, label)

    # Whether the source is a loopable video file
    is_video_file = isinstance(source, str) and not source.startswith("http")

    # Window names include the role so both cameras can show simultaneously
    win_feed = f"[{label}] Live Feed"
    win_mask = f"[{label}] Motion Mask"

    print(f"[{label}] Detection running. Tune ROI and thresholds in config.py / .env")

    # -- Main detection loop ------------------------------------------------
    while True:
        ret, frame = cap.read()

        if not ret:
            if is_video_file:
                # Loop the video file for offline testing
                print(f"[{label}] End of video file. Looping...")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                # Stream dropped — attempt reconnect
                print(f"[{label}] Frame grab failed. Attempting reconnect...")
                cap.release()
                time.sleep(config.STREAM_RETRY_DELAY)
                cap = open_stream(source, label)
                continue

        # -- Run detection pipeline ----------------------------------------
        result = detector.detect(frame)

        # -- Fire event if triggered ----------------------------------------
        if result.triggered:
            print(f"\n[{label}] *** Vehicle detected! Sending {args.role} event ***")
            client.send_event()
            print()

        # -- Debug display --------------------------------------------------
        if config.DEBUG_WINDOW:
            # Resize source frame to match processing width for annotation
            h, w = frame.shape[:2]
            scale = config.FRAME_RESIZE_WIDTH / w
            display_frame = cv2.resize(
                frame,
                (config.FRAME_RESIZE_WIDTH, int(h * scale)),
                interpolation=cv2.INTER_AREA,
            )
            annotated = detector.draw_debug(display_frame, result, label)
            cv2.imshow(win_feed, annotated)

            if result.mask is not None:
                cv2.imshow(win_mask, result.mask)

            # 'q' quits gracefully
            if cv2.waitKey(1) & 0xFF == ord("q"):
                print(f"[{label}] Quit signal received.")
                break
        else:
            # Headless mode — small sleep to avoid busy-looping
            time.sleep(0.05)

    # -- Cleanup ------------------------------------------------------------
    cap.release()
    cv2.destroyAllWindows()
    print(f"[{label}] CV Engine stopped.")


if __name__ == "__main__":
    main()

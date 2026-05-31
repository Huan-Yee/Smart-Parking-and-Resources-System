"""
detector.py — MotionDetector for MMU Smart Parking CV Engine
=============================================================
Encapsulates all OpenCV motion-detection logic:
  - Frame resize and ROI crop
  - Gaussian blur (noise reduction)
  - MOG2 background subtraction
  - Shadow removal via binary threshold
  - Morphological closing (fill contour gaps)
  - Contour area filtering
  - Cooldown timer (anti-duplicate trigger)
  - Debug annotation overlay

Detection is intentionally kept to ROI-based motion/vehicle-passing detection.
License plate recognition (ALPR) and exact slot detection are NOT implemented —
they are reserved for future hardware with higher-resolution cameras.
"""

import time
import cv2
import numpy as np
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import config


@dataclass
class DetectionResult:
    """Carries the outcome of a single frame's detection pass."""
    triggered:       bool               # True if a vehicle event should fire
    contours:        List               # Filtered contours (for debug drawing)
    mask:            Optional[np.ndarray]  # Binary foreground mask (ROI size)
    roi_rect:        Tuple[int, int, int, int]  # (x, y, w, h) of ROI in full frame
    cooldown_left:   float              # Seconds remaining on cooldown (0 if ready)
    status:          str                # "TRIGGERED" | "COOLDOWN" | "IDLE"


class MotionDetector:
    """
    Stateful motion detector.  Call detect(frame) on every captured frame.
    The detector maintains its own background model and cooldown timer.
    """

    def __init__(
        self,
        min_contour_area:        int   = config.MIN_CONTOUR_AREA,
        cooldown_seconds:        float = config.TRIGGER_COOLDOWN_SECONDS,
        frame_resize_width:      int   = config.FRAME_RESIZE_WIDTH,
        blur_kernel:             tuple = config.BLUR_KERNEL_SIZE,
        mog2_history:            int   = config.MOG2_HISTORY,
        mog2_var_threshold:      int   = config.MOG2_VAR_THRESHOLD,
        mog2_detect_shadows:     bool  = config.MOG2_DETECT_SHADOWS,
        roi_x_start:             float = config.ROI_X_START,
        roi_y_start:             float = config.ROI_Y_START,
        roi_x_end:               float = config.ROI_X_END,
        roi_y_end:               float = config.ROI_Y_END,
    ):
        self.min_contour_area    = min_contour_area
        self.cooldown_seconds    = cooldown_seconds
        self.frame_resize_width  = frame_resize_width
        self.blur_kernel         = blur_kernel
        self.roi_ratios          = (roi_x_start, roi_y_start, roi_x_end, roi_y_end)

        # Background subtractor — keeps its own internal background model
        self._fgbg = cv2.createBackgroundSubtractorMOG2(
            history=mog2_history,
            varThreshold=mog2_var_threshold,
            detectShadows=mog2_detect_shadows,
        )

        # Morphological kernel to close small gaps in vehicle silhouettes
        self._morph_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))

        # Cooldown state
        self._last_trigger_time: float = 0.0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def detect(self, frame: np.ndarray) -> DetectionResult:
        """
        Run the full detection pipeline on one frame.

        Args:
            frame: BGR frame as read from cv2.VideoCapture

        Returns:
            DetectionResult with trigger flag, contours, mask, and ROI rect.
        """
        # 1. Resize to normalise resolution (QVGA or VGA input → same pipeline)
        resized = self._resize_frame(frame)
        h, w = resized.shape[:2]

        # 2. Compute ROI pixel coordinates from ratio config
        roi_rect = self._compute_roi(w, h)
        rx, ry, rw, rh = roi_rect

        # 3. Crop to ROI
        roi_frame = resized[ry : ry + rh, rx : rx + rw]

        # 4. Convert to grayscale and blur (reduces JPEG noise)
        gray = cv2.cvtColor(roi_frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, self.blur_kernel, 0)

        # 5. Background subtraction → foreground mask
        fg_mask = self._fgbg.apply(blurred)

        # 6. Remove MOG2 shadow pixels (value 127) — keep only definite foreground
        _, fg_mask = cv2.threshold(fg_mask, 244, 255, cv2.THRESH_BINARY)

        # 7. Morphological close — fill small holes in vehicle silhouettes
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, self._morph_kernel)

        # 8. Find external contours
        contours, _ = cv2.findContours(
            fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        # 9. Filter contours by minimum area
        large_contours = [
            c for c in contours if cv2.contourArea(c) >= self.min_contour_area
        ]

        # 10. Determine trigger and cooldown state
        now = time.time()
        cooldown_left = max(0.0, self.cooldown_seconds - (now - self._last_trigger_time))
        motion_present = len(large_contours) > 0

        triggered = False
        if motion_present and cooldown_left == 0.0:
            triggered = True
            self._last_trigger_time = now
            status = "TRIGGERED"
        elif motion_present:
            status = "COOLDOWN"
        else:
            status = "IDLE"

        return DetectionResult(
            triggered=triggered,
            contours=large_contours,
            mask=fg_mask,
            roi_rect=roi_rect,
            cooldown_left=cooldown_left,
            status=status,
        )

    def draw_debug(self, frame: np.ndarray, result: DetectionResult, label: str = "") -> np.ndarray:
        """
        Draw debug overlays onto a copy of the full resized frame.

        Draws:
          - Cyan ROI rectangle
          - Green bounding boxes on detected contours (within ROI coordinate space)
          - Status text (TRIGGERED / COOLDOWN / IDLE) with colour coding
          - Cooldown countdown

        Args:
            frame:  BGR resized frame (not ROI-cropped)
            result: DetectionResult from detect()
            label:  Role label ("ENTRY" / "EXIT") for the status text

        Returns:
            Annotated BGR frame (copy — original is not modified)
        """
        out = frame.copy()
        rx, ry, rw, rh = result.roi_rect

        # Draw ROI rectangle (cyan)
        cv2.rectangle(out, (rx, ry), (rx + rw, ry + rh), (255, 255, 0), 2)
        cv2.putText(out, "ROI", (rx + 4, ry + 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

        # Draw bounding boxes for each detected contour
        # Contour coordinates are relative to the ROI crop — offset by (rx, ry)
        for contour in result.contours:
            cx, cy, cw, ch = cv2.boundingRect(contour)
            x1, y1 = rx + cx, ry + cy
            cv2.rectangle(out, (x1, y1), (x1 + cw, y1 + ch), (0, 255, 0), 2)

        # Status text colour coding
        status_colours = {
            "TRIGGERED": (0, 0, 255),   # Red (BGR)
            "COOLDOWN":  (0, 165, 255), # Orange
            "IDLE":      (0, 200, 0),   # Green
        }
        colour = status_colours.get(result.status, (200, 200, 200))

        # Role + status line
        header = f"[{label}] {result.status}"
        cv2.putText(out, header, (8, 26),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, colour, 2)

        # Cooldown countdown (only meaningful during COOLDOWN state)
        if result.cooldown_left > 0:
            cd_text = f"Cooldown: {result.cooldown_left:.1f}s"
            cv2.putText(out, cd_text, (8, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 1)

        return out

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _resize_frame(self, frame: np.ndarray) -> np.ndarray:
        """Resize frame to target width, maintaining aspect ratio."""
        h, w = frame.shape[:2]
        if w == self.frame_resize_width:
            return frame
        scale  = self.frame_resize_width / w
        new_h  = int(h * scale)
        return cv2.resize(frame, (self.frame_resize_width, new_h),
                          interpolation=cv2.INTER_AREA)

    def _compute_roi(self, w: int, h: int) -> Tuple[int, int, int, int]:
        """Convert ratio-based ROI config to pixel coordinates (x, y, width, height)."""
        xs, ys, xe, ye = self.roi_ratios
        x = int(xs * w)
        y = int(ys * h)
        rw = int((xe - xs) * w)
        rh = int((ye - ys) * h)
        # Clamp to frame bounds
        x  = max(0, min(x, w - 1))
        y  = max(0, min(y, h - 1))
        rw = max(1, min(rw, w - x))
        rh = max(1, min(rh, h - y))
        return (x, y, rw, rh)

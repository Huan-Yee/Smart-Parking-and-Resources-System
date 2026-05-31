"""
backend_client.py — BackendClient for MMU Smart Parking CV Engine
=================================================================
Sends parking event POST requests to the NestJS backend.

Payload (CreateEventDto):
  {
      "licensePlate": "DETECTED_CAR",   # required — no ALPR capability
      "timestamp":    <unix_seconds>,   # optional, but sent for accurate timing
      "zoneId":       "gate-main"       # optional, sent explicitly for clear logs
  }

Error handling:
  - Connection refused  → warn and continue (backend may be restarting)
  - 400 Parking Full    → warn and continue (backend capacity enforced server-side)
  - Other 4xx           → log error with response body
  - 5xx                 → log error and continue
  - Timeout             → log and continue (5-second request timeout)
"""

import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

import config


class BackendClient:
    """
    Thin HTTP client that posts a single parking event to the NestJS backend.
    Uses a requests.Session for connection reuse (lower overhead on repeated calls).
    """

    # Payload value for license plate — ESP32-CAM QVGA/VGA cannot do ALPR.
    # This is a documented limitation; ALPR is a future hardware upgrade.
    LICENSE_PLATE_PLACEHOLDER = "DETECTED_CAR"

    # Request timeout in seconds
    REQUEST_TIMEOUT = 5

    def __init__(self, backend_url: str, endpoint: str, zone_id: str, label: str = ""):
        """
        Args:
            backend_url:  Base URL, e.g. "http://localhost:5001"
            endpoint:     Path, e.g. "/events/entry" or "/events/exit"
            zone_id:      Zone identifier, e.g. "gate-main"
            label:        Role label for log output ("ENTRY" / "EXIT")
        """
        self.url      = backend_url.rstrip("/") + endpoint
        self.zone_id  = zone_id
        self.label    = label or endpoint.replace("/events/", "").upper()

        # Session with a conservative retry policy (only on connection-level errors,
        # NOT on HTTP 4xx/5xx — those are handled explicitly below)
        self._session = requests.Session()
        retry = Retry(
            total=2,
            backoff_factor=0.5,
            status_forcelist=(),  # Do not auto-retry on any HTTP status
            allowed_methods=["POST"],
        )
        adapter = HTTPAdapter(max_retries=retry)
        self._session.mount("http://", adapter)
        self._session.mount("https://", adapter)

    def send_event(self) -> bool:
        """
        POST a parking event to the configured backend endpoint.

        Returns:
            True  — event accepted (HTTP 201)
            False — event rejected or network failure
        """
        payload = {
            "licensePlate": self.LICENSE_PLATE_PLACEHOLDER,
            "timestamp":    int(time.time()),   # Unix seconds (canonical field)
            "zoneId":       self.zone_id,       # Explicit for clear server-side logs
        }

        try:
            response = self._session.post(
                self.url,
                json=payload,
                timeout=self.REQUEST_TIMEOUT,
            )

            if response.status_code == 201:
                print(f"  [OK]    [{self.label}] Event accepted — "
                      f"plate={payload['licensePlate']}, zone={self.zone_id}, "
                      f"ts={payload['timestamp']}")
                return True

            # 400: "Parking lot is full" is a valid backend state — not a bug
            if response.status_code == 400:
                try:
                    detail = response.json().get("message", response.text)
                except Exception:
                    detail = response.text
                print(f"  [WARN]  [{self.label}] Backend rejected (400): {detail}")
                return False

            # Other 4xx / 5xx
            print(f"  [ERROR] [{self.label}] Backend returned {response.status_code}: "
                  f"{response.text[:200]}")
            return False

        except requests.exceptions.ConnectionError:
            print(f"  [WARN]  [{self.label}] Cannot reach backend at {self.url} "
                  f"— is NestJS running?")
            return False

        except requests.exceptions.Timeout:
            print(f"  [WARN]  [{self.label}] Backend request timed out "
                  f"({self.REQUEST_TIMEOUT}s)")
            return False

        except Exception as exc:
            print(f"  [ERROR] [{self.label}] Unexpected error: {exc}")
            return False

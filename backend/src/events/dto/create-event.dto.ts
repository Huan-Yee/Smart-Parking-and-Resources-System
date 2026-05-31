import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateEventDto {
  /**
   * Vehicle detection label sent by the CV engine.
   *
   * The current prototype uses ESP32-CAM at QVGA resolution with MOG2
   * background subtraction. At this resolution, Automatic License Plate
   * Recognition (ALPR) is not feasible at the edge. The CV engine therefore
   * sends a generic label such as "DETECTED_CAR" rather than a real plate number.
   *
   * This field is kept as a string for forward compatibility.
   * Future improvement: replace with real ALPR output when higher-resolution
   * cameras (e.g., ESP32-S3 with AI acceleration) or cloud-side OCR are available.
   */
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  /**
   * Canonical event timestamp (Unix seconds timestamp ).
   * If provided, this is stored as the authoritative event time in Firestore.
   * Use this field for any new integrations.
   */
  @IsNumber()
  @IsOptional()
  timestamp?: number;

  /**
   * Backward-compatible alias for `timestamp`.
   * The current CV engine (cv-engine/main.py) sends this field as `entryTime`.
   * The service resolves the stored time as: timestamp ?? entryTime ?? server time.
   * New integrations should prefer `timestamp` over this alias.
   */
  @IsNumber()
  @IsOptional()
  entryTime?: number;

  /**
   * Optional zone identifier (e.g., 'gate-main', 'gate-exit').
   * Defaults to PARKING_CONFIG.DEFAULT_ZONE if omitted.
   */
  @IsString()
  @IsOptional()
  zoneId?: string;

  /**
   * Optional base64-encoded image frame from the ESP32-CAM.
   * Future use: cloud-side AI verification or dashboard snapshot feed.
   * Not persisted in Firestore in the current prototype.
   */
  @IsString()
  @IsOptional()
  image_base64?: string;
}

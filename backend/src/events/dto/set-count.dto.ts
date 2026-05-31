import { IsInt, Min, Max } from 'class-validator';
import { PARKING_CONFIG } from '../../config/parking.config';

export class SetCountDto {
  /**
   * The exact occupied count to set manually.
   *
   * Use this endpoint when the automatic CV count drifts from reality
   * due to hardware limitations (ESP32-CAM QVGA / MOG2 background subtraction).
   *
   * Constraints:
   *   Min 0  — occupied cannot be negative.
   *   Max 10 — cannot exceed prototype capacity (PARKING_CONFIG.TOTAL_LOTS = 10).
   *
   * Note: @Max requires a literal at compile time. The value below MUST be kept
   * in sync with PARKING_CONFIG.TOTAL_LOTS in src/config/parking.config.ts.
   */
  @IsInt()
  @Min(0)
  @Max(PARKING_CONFIG.TOTAL_LOTS) // = 10 — update both places if capacity changes
  occupied: number;
}

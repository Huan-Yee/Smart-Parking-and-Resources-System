import { IsInt, Min, Max } from 'class-validator';

export class SetCountDto {
  // Admin sets the exact occupied count manually.
  // Useful when the automatic CV count drifts due to hardware limitations (ESP32-CAM QVGA/MOG2).
  // Min 0: no negative lots. Max 30: cannot exceed total capacity.
  @IsInt()
  @Min(0)
  @Max(30)
  occupied: number;
}

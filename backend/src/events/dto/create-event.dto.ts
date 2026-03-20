import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateEventDto {
  // For QVGA resolution and MOG2 background subtraction, 
  // ALPR (License Plate Recognition) is not possible at the edge right now (ESP32CAM).
  // The camera will send a generic string (e.g., "DETECTED_CAR") instead of a real plate.
  // Kept as @IsString() for future scalability when deep learning/high-res is added in future.
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  // Future Scalability: If stream the QVGA motion frames 
  // for a dashboard feed or cloud-side AI verification, you can pass a base64 string here.
  @IsString()
  @IsOptional()
  image_base64?: string;

  @IsNumber()
  @IsOptional()
  timestamp?: number;

  @IsString()
  @IsOptional()
  zoneId?: string;
}

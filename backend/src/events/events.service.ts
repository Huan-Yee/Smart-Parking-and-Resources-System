import { Injectable, Logger } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  /**
   * Handles a vehicle entry event from the CV Engine.
   */
  handleEntry(createEventDto: CreateEventDto) {
    // Todo: Integrate real DB and WebSocket logic
    return {
      status: 'success',
      message: `Vehicle ${createEventDto.licensePlate} entry recorded.`,
      timestamp: new Date(),
    };
  }

  handleExit(createEventDto: CreateEventDto) {
    // Todo: Integrate real DB logic to close session and calculate fee
    return {
      status: 'success',
      message: `Vehicle ${createEventDto.licensePlate} exit recorded.`,
      timestamp: new Date(),
    };
  }

  /**
   * Handles image snapshot from ESP32-CAM.
   * In Phase 2, this will forward the image to the Python CV Engine.
   */
  handleSnapshot(zoneId: string, imageBase64: string) {
    this.logger.log(`Snapshot received from zone: ${zoneId}, size: ${imageBase64.length} chars`);

    // TODO: Forward to Python CV Engine for processing
    // For now, just acknowledge receipt
    return {
      status: 'received',
      zoneId,
      imageSize: imageBase64.length,
      timestamp: new Date(),
    };
  }
}

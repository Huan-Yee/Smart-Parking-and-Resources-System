import { Controller, Post, Body } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Post('entry')
  recordEntry(@Body() createEventDto: CreateEventDto) {
    console.log('Received Entry Event:', createEventDto);
    return this.eventsService.handleEntry(createEventDto);
  }

  @Post('exit')
  recordExit(@Body() createEventDto: CreateEventDto) {
    console.log('Received Exit Event:', createEventDto);
    return this.eventsService.handleExit(createEventDto);
  }

  /**
   * Endpoint for ESP32-CAM to POST snapshot images.
   * The image data is passed to the CV Engine for processing.
   */
  @Post('snapshot')
  receiveSnapshot(@Body() body: { zoneId: string; imageBase64: string }) {
    console.log(`Received snapshot from zone: ${body.zoneId}`);
    return this.eventsService.handleSnapshot(body.zoneId, body.imageBase64);
  }
}

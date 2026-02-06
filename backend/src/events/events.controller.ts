import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  /**
   * Record vehicle entry - called by CV Engine
   */
  @Post('entry')
  recordEntry(@Body() createEventDto: CreateEventDto) {
    console.log('Received Entry Event:', createEventDto);
    return this.eventsService.handleEntry(createEventDto);
  }

  /**
   * Record vehicle exit - called by CV Engine
   */
  @Post('exit')
  recordExit(@Body() createEventDto: CreateEventDto) {
    console.log('Received Exit Event:', createEventDto);
    return this.eventsService.handleExit(createEventDto);
  }

  /**
   * Receive snapshot from ESP32-CAM
   */
  @Post('snapshot')
  receiveSnapshot(@Body() body: { zoneId: string; imageBase64: string }) {
    console.log(`Received snapshot from zone: ${body.zoneId}`);
    return this.eventsService.handleSnapshot(body.zoneId, body.imageBase64);
  }

  /**
   * Get current parking statistics
   */
  @Get('stats')
  getStats() {
    return this.eventsService.getStats();
  }

  /**
   * Get recent event history
   */
  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    return this.eventsService.getHistory(limit ? parseInt(limit, 10) : 20);
  }
}

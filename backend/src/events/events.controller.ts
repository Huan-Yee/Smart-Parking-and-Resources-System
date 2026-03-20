import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { SetCountDto } from './dto/set-count.dto';

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);
  constructor(private readonly eventsService: EventsService) { }

  /**
   * Record vehicle entry - called by CV Engine
   */
  @Post('entry')
  recordEntry(@Body() createEventDto: CreateEventDto) {
    this.logger.log(`Received Entry Event: ${createEventDto.licensePlate}`);
    return this.eventsService.handleEntry(createEventDto);
  }

  /**
   * Record vehicle exit - called by CV Engine
   */
  @Post('exit')
  recordExit(@Body() createEventDto: CreateEventDto) {
    this.logger.log(`Received Exit Event: ${createEventDto.licensePlate}`);
    return this.eventsService.handleExit(createEventDto);
  }

  /**
   * Receive snapshot from ESP32-CAM
   */
  @Post('snapshot')
  receiveSnapshot(@Body() body: { zoneId: string; imageBase64: string }) {
    this.logger.log(`Received snapshot from zone: ${body.zoneId}`);
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

  /**
   * Admin: Manually set the occupied count to a specific number.
   * Use when the CV engine count drifts from reality.
   */
  @Post('set-count')
  setCount(@Body() setCountDto: SetCountDto) {
    this.logger.warn(`Admin set count to: ${setCountDto.occupied}`);
    return this.eventsService.setCount(setCountDto);
  }
}

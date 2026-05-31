import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { SetCountDto } from './dto/set-count.dto';

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  /**
   * POST /events/entry
   * Called by the CV Engine when a vehicle is detected at the entry gate.
   * Atomically increments the occupied count; rejects if the lot is full.
   */
  @Post('entry')
  recordEntry(@Body() createEventDto: CreateEventDto) {
    this.logger.log(`Entry event received: ${createEventDto.licensePlate}`);
    return this.eventsService.handleEntry(createEventDto);
  }

  /**
   * POST /events/exit
   * Called by the CV Engine when a vehicle is detected at the exit gate.
   * Atomically decrements the occupied count; floors at 0.
   */
  @Post('exit')
  recordExit(@Body() createEventDto: CreateEventDto) {
    this.logger.log(`Exit event received: ${createEventDto.licensePlate}`);
    return this.eventsService.handleExit(createEventDto);
  }

  /**
   * POST /events/snapshot
   * STUB — Receives a base64-encoded image frame from the ESP32-CAM.
   * Not persisted in the current prototype. Reserved for future use:
   * cloud-side AI verification or live dashboard snapshot feed.
   */
  @Post('snapshot')
  receiveSnapshot(@Body() body: { zoneId: string; imageBase64: string }) {
    this.logger.log(`Snapshot received from zone: ${body.zoneId}`);
    return this.eventsService.handleSnapshot(body.zoneId, body.imageBase64);
  }

  /**
   * GET /events/stats
   * Returns live occupancy: { occupied, total, available, lastUpdated }.
   * Consumed by the Next.js admin dashboard.
   */
  @Get('stats')
  getStats() {
    return this.eventsService.getStats();
  }

  /**
   * GET /events/history?limit=N
   * Returns the N most recent parking events (default 20).
   * Consumed by the Next.js admin dashboard.
   */
  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.eventsService.getHistory(parsedLimit);
  }

  /**
   * POST /events/set-count
   * Admin: Manually override the occupied count.
   * Use when the automatic CV count drifts due to ESP32-CAM hardware limitations.
   * Validated against PARKING_CONFIG.TOTAL_LOTS (10) by SetCountDto.
   */
  @Post('set-count')
  setCount(@Body() setCountDto: SetCountDto) {
    this.logger.warn(`Admin set-count request: ${setCountDto.occupied}`);
    return this.eventsService.setCount(setCountDto);
  }
}

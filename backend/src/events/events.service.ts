import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { SetCountDto } from './dto/set-count.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { PARKING_CONFIG } from '../config/parking.config';

/** Shape of the live_counts/summary Firestore document. */
interface LiveCountData {
  occupied: number;
  lastUpdated?: FirebaseFirestore.Timestamp | Date | null;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Resolves the authoritative event timestamp from the DTO.
   *
   * Priority order:
   *   1. dto.timestamp  — canonical field, preferred for new integrations.
   *   2. dto.entryTime  — backward-compatible alias sent by the current CV engine.
   *   3. server time    — fallback when neither field is provided.
   */
  private resolveTimestamp(dto: CreateEventDto): Date {
    const raw = dto.timestamp ?? dto.entryTime;
    return raw !== undefined ? new Date(raw * 1000) : new Date();
  }

  /**
   * Handles a vehicle entry event from the CV Engine.
   *
   * Uses a Firestore transaction to atomically:
   *   1. Check the current occupied count against PARKING_CONFIG.TOTAL_LOTS.
   *   2. Reject the event if the lot is already at capacity.
   *   3. Increment occupied and update lastUpdated if space is available.
   *   4. Write the event to the 'events' collection.
   */
  async handleEntry(dto: CreateEventDto) {
    const db = this.firebaseService.getFirestore();

    if (!db) {
      this.logger.warn('Firestore not initialized. Skipping entry write.');
      return {
        status: 'warning',
        message: 'Database not connected.',
        timestamp: new Date(),
      };
    }

    const statsRef = db.collection('live_counts').doc('summary');
    const eventTime = this.resolveTimestamp(dto);
    const zoneId = dto.zoneId ?? PARKING_CONFIG.DEFAULT_ZONE;

    try {
      let newOccupied: number;

      await db.runTransaction(async (tx) => {
        const statsDoc = await tx.get(statsRef);
        const data = statsDoc.data() as LiveCountData | undefined;
        const current = statsDoc.exists ? (data?.occupied ?? 0) : 0;

        if (current >= PARKING_CONFIG.TOTAL_LOTS) {
          // Abort the transaction — caller will catch the thrown error below
          throw new BadRequestException(
            `Parking lot is full (${PARKING_CONFIG.TOTAL_LOTS}/${PARKING_CONFIG.TOTAL_LOTS}).`,
          );
        }

        newOccupied = current + 1;

        tx.set(
          statsRef,
          { occupied: newOccupied, lastUpdated: new Date() },
          { merge: true },
        );
      });

      // Log the event outside the transaction (non-critical; no need to hold the lock)
      await db.collection('events').add({
        type: 'entry',
        licensePlate: dto.licensePlate,
        timestamp: eventTime,
        zoneId,
      });

      this.logger.log(
        `Entry recorded: ${dto.licensePlate} | occupied: ${newOccupied!}/${PARKING_CONFIG.TOTAL_LOTS}`,
      );

      return {
        status: 'success',
        message: `Vehicle ${dto.licensePlate} entry recorded.`,
        occupied: newOccupied!,
        total: PARKING_CONFIG.TOTAL_LOTS,
        timestamp: eventTime,
      };
    } catch (error) {
      // Re-throw NestJS HTTP exceptions (e.g., lot-full BadRequestException)
      if (error instanceof BadRequestException) throw error;

      this.logger.error('Failed to write entry event', error);
      return {
        status: 'error',
        message: 'Failed to record entry.',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Handles a vehicle exit event from the CV Engine.
   *
   * Uses a Firestore transaction to atomically:
   *   1. Read the current occupied count.
   *   2. Decrement it by 1, with a floor of 0 (never negative).
   *   3. Write the event to the 'events' collection.
   */
  async handleExit(dto: CreateEventDto) {
    const db = this.firebaseService.getFirestore();

    if (!db) {
      this.logger.warn('Firestore not initialized. Skipping exit write.');
      return {
        status: 'warning',
        message: 'Database not connected.',
        timestamp: new Date(),
      };
    }

    const statsRef = db.collection('live_counts').doc('summary');
    const eventTime = this.resolveTimestamp(dto);
    const zoneId = dto.zoneId ?? PARKING_CONFIG.DEFAULT_ZONE;

    try {
      let newOccupied: number;

      await db.runTransaction(async (tx) => {
        const statsDoc = await tx.get(statsRef);
        const data = statsDoc.data() as LiveCountData | undefined;
        const current = statsDoc.exists ? (data?.occupied ?? 0) : 0;

        newOccupied = Math.max(0, current - 1);

        tx.set(
          statsRef,
          { occupied: newOccupied, lastUpdated: new Date() },
          { merge: true },
        );
      });

      // Log the event outside the transaction (non-critical)
      await db.collection('events').add({
        type: 'exit',
        licensePlate: dto.licensePlate,
        timestamp: eventTime,
        zoneId,
      });

      this.logger.log(
        `Exit recorded: ${dto.licensePlate} | occupied: ${newOccupied!}/${PARKING_CONFIG.TOTAL_LOTS}`,
      );

      return {
        status: 'success',
        message: `Vehicle ${dto.licensePlate} exit recorded.`,
        occupied: newOccupied!,
        total: PARKING_CONFIG.TOTAL_LOTS,
        timestamp: eventTime,
      };
    } catch (error) {
      this.logger.error('Failed to write exit event', error);
      return {
        status: 'error',
        message: 'Failed to record exit.',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Handles an image snapshot from the ESP32-CAM.
   *
   * STUB — This endpoint receives base64-encoded frames but does not persist them.
   * Future use: store frames in Firebase Storage for cloud-side AI verification
   * or stream to the admin dashboard as a live feed.
   */
  handleSnapshot(zoneId: string, imageBase64: string) {
    this.logger.log(
      `Snapshot received from zone: ${zoneId} | size: ${imageBase64.length} chars`,
    );
    return {
      status: 'received',
      zoneId,
      imageSize: imageBase64.length,
      timestamp: new Date(),
    };
  }

  /**
   * Returns the current live parking statistics.
   *
   * Response shape:
   *   { occupied, total, available, lastUpdated }
   */
  async getStats() {
    const db = this.firebaseService.getFirestore();

    if (!db) {
      return {
        occupied: 0,
        total: PARKING_CONFIG.TOTAL_LOTS,
        available: PARKING_CONFIG.TOTAL_LOTS,
        lastUpdated: null,
      };
    }

    try {
      const statsRef = db.collection('live_counts').doc('summary');
      const doc = await statsRef.get();
      const data = doc.data() as LiveCountData | undefined;

      const occupied = doc.exists ? (data?.occupied ?? 0) : 0;
      const clamped = Math.min(
        Math.max(0, occupied),
        PARKING_CONFIG.TOTAL_LOTS,
      );

      return {
        occupied: clamped,
        total: PARKING_CONFIG.TOTAL_LOTS,
        available: PARKING_CONFIG.TOTAL_LOTS - clamped,
        lastUpdated: data?.lastUpdated ?? null,
      };
    } catch (error) {
      this.logger.error('Failed to get stats', error);
      return {
        occupied: 0,
        total: PARKING_CONFIG.TOTAL_LOTS,
        available: PARKING_CONFIG.TOTAL_LOTS,
        lastUpdated: null,
      };
    }
  }

  /**
   * Returns recent parking events ordered by most recent first.
   *
   * @param limit - Maximum number of events to return (default: 20).
   */
  async getHistory(limit = 20) {
    const db = this.firebaseService.getFirestore();

    if (!db) {
      return [];
    }

    try {
      const snapshot = await db
        .collection('events')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this.logger.error('Failed to get history', error);
      return [];
    }
  }

  /**
   * Admin: Manually override the occupied count.
   *
   * Use this when the CV engine count drifts from the actual physical state
   * due to missed detections or hardware limitations (ESP32-CAM QVGA / MOG2).
   *
   * The value is validated against PARKING_CONFIG.TOTAL_LOTS by SetCountDto
   * before reaching this method.
   */
  async setCount(dto: SetCountDto) {
    const db = this.firebaseService.getFirestore();

    if (!db) {
      return { status: 'error', message: 'Database not connected.' };
    }

    // Belt-and-suspenders guard — SetCountDto already enforces @Max(TOTAL_LOTS)
    if (dto.occupied > PARKING_CONFIG.TOTAL_LOTS) {
      throw new BadRequestException(
        `Occupied count cannot exceed total capacity (${PARKING_CONFIG.TOTAL_LOTS}).`,
      );
    }

    try {
      const statsRef = db.collection('live_counts').doc('summary');
      await statsRef.set(
        { occupied: dto.occupied, lastUpdated: new Date() },
        { merge: true },
      );

      this.logger.warn(
        `Admin manually set occupied count to: ${dto.occupied}/${PARKING_CONFIG.TOTAL_LOTS}`,
      );

      return {
        status: 'success',
        message: `Occupied count set to ${dto.occupied}.`,
        occupied: dto.occupied,
        total: PARKING_CONFIG.TOTAL_LOTS,
        available: PARKING_CONFIG.TOTAL_LOTS - dto.occupied,
      };
    } catch (error) {
      this.logger.error('Failed to set count', error);
      return { status: 'error', message: 'Failed to set count.' };
    }
  }
}

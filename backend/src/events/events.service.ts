import { Injectable, Logger } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly firebaseService: FirebaseService) { }

  /**
   * Handles a vehicle entry event from the CV Engine.
   * Increments the occupied count in Firestore.
   */
  async handleEntry(createEventDto: CreateEventDto) {
    const db = this.firebaseService.getFirestore();

    if (!db) {
      this.logger.warn('Firestore not initialized. Skipping write.');
      return {
        status: 'warning',
        message: 'Database not connected.',
        timestamp: new Date(),
      };
    }

    try {
      // 1. Log the event
      await db.collection('events').add({
        type: 'entry',
        licensePlate: createEventDto.licensePlate,
        timestamp: new Date(),
        zoneId: 'gate-main',
      });

      // 2. Update live count (increment occupied)
      const statsRef = db.collection('live_counts').doc('summary');
      await statsRef.set(
        {
          occupied: FieldValue.increment(1),
          lastUpdated: new Date(),
        },
        { merge: true }
      );

      this.logger.log(`Entry recorded: ${createEventDto.licensePlate}`);

      return {
        status: 'success',
        message: `Vehicle ${createEventDto.licensePlate} entry recorded.`,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to write entry event', error);
      return {
        status: 'error',
        message: 'Failed to record entry.',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Handles a vehicle exit event.
   * Decrements the occupied count in Firestore.
   */
  async handleExit(createEventDto: CreateEventDto) {
    const db = this.firebaseService.getFirestore();

    if (!db) {
      return { status: 'warning', message: 'Database not connected.' };
    }

    try {
      // 1. Log the event
      await db.collection('events').add({
        type: 'exit',
        licensePlate: createEventDto.licensePlate,
        timestamp: new Date(),
        zoneId: 'gate-main',
      });

      // 2. Update live count (decrement occupied, min 0)
      const statsRef = db.collection('live_counts').doc('summary');
      const doc = await statsRef.get();
      const currentOccupied = doc.exists ? (doc.data()?.occupied || 0) : 0;

      await statsRef.set(
        {
          occupied: Math.max(0, currentOccupied - 1),
          lastUpdated: new Date(),
        },
        { merge: true }
      );

      this.logger.log(`Exit recorded: ${createEventDto.licensePlate}`);

      return {
        status: 'success',
        message: `Vehicle ${createEventDto.licensePlate} exit recorded.`,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to write exit event', error);
      return { status: 'error', message: 'Failed to record exit.' };
    }
  }

  /**
   * Handles image snapshot from ESP32-CAM.
   */
  handleSnapshot(zoneId: string, imageBase64: string) {
    this.logger.log(`Snapshot received from zone: ${zoneId}, size: ${imageBase64.length} chars`);
    return {
      status: 'received',
      zoneId,
      imageSize: imageBase64.length,
      timestamp: new Date(),
    };
  }

  /**
   * Get current parking statistics.
   */
  async getStats() {
    const db = this.firebaseService.getFirestore();

    if (!db) {
      return { occupied: 0, total: 30, available: 30 };
    }

    try {
      const statsRef = db.collection('live_counts').doc('summary');
      const doc = await statsRef.get();

      const occupied = doc.exists ? (doc.data()?.occupied || 0) : 0;
      const total = 30; // Default total slots

      return {
        occupied,
        total,
        available: total - occupied,
        lastUpdated: doc.data()?.lastUpdated || null,
      };
    } catch (error) {
      this.logger.error('Failed to get stats', error);
      return { occupied: 0, total: 30, available: 30 };
    }
  }

  /**
   * Get recent events history.
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

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this.logger.error('Failed to get history', error);
      return [];
    }
  }

  /**
   * Reset occupancy count to 0 (Admin action)
   */
  async resetCount() {
    const db = this.firebaseService.getFirestore();

    if (!db) {
      return { status: 'error', message: 'Database not connected' };
    }

    try {
      const statsRef = db.collection('live_counts').doc('summary');
      await statsRef.set({
        occupied: 0,
        lastUpdated: new Date(),
      }, { merge: true });

      this.logger.log('Occupancy count reset to 0');
      return { status: 'success', message: 'Count reset to 0' };
    } catch (error) {
      this.logger.error('Failed to reset count', error);
      return { status: 'error', message: 'Failed to reset' };
    }
  }
}

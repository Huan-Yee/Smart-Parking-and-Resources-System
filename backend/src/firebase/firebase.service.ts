import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

/**
 * FirebaseService - Singleton Pattern
 * 
 * This service initializes the Firebase Admin SDK once when the module loads.
 * It provides access to Firestore for all other services via Dependency Injection.
 * 
 * IMPORTANT: You must place your Firebase Service Account JSON file at:
 *   backend/firebase-service-account.json
 * 
 * DO NOT COMMIT this file to Git!
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private db: Firestore;

    onModuleInit() {
        this.logger.log('Initializing Firebase Admin SDK...');

        // Check if already initialized (Singleton safety)
        if (admin.apps.length === 0) {
            try {
                // Option 1: Use service account JSON file (for local development)
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const serviceAccount = require('../../firebase-service-account.json');
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                this.logger.log('Firebase initialized with service account file.');
            } catch {
                // Option 2: Use environment variable (for cloud deployment)
                if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                    this.logger.log('Firebase initialized with environment variable.');
                } else {
                    this.logger.warn(
                        'Firebase NOT initialized! Please provide firebase-service-account.json or FIREBASE_SERVICE_ACCOUNT env var.',
                    );
                    return;
                }
            }
        }

        this.db = admin.firestore();
        this.logger.log('Firestore connection established.');
    }

    /**
     * Get the Firestore database instance.
     * Use this in other services: this.firebaseService.getFirestore()
     */
    getFirestore(): Firestore {
        return this.db;
    }
}

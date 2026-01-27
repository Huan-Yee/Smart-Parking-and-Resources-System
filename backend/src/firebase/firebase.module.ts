import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

/**
 * FirebaseModule - Global Module
 * 
 * By marking this module as @Global(), the FirebaseService becomes
 * available to ALL other modules without needing to import FirebaseModule
 * in each one. This is the Singleton pattern in action.
 */
@Global()
@Module({
    providers: [FirebaseService],
    exports: [FirebaseService],
})
export class FirebaseModule { }

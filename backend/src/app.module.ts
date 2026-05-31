import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    FirebaseModule, // Global — provides FirebaseService to all modules
    EventsModule, // Registers /events/* routes
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

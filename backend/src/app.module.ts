import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParkingLotModule } from './parking_lot/parking_lot.module';
import { ParkingLot } from './parking_lot/entities/parking_lot.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'rebon123',
      database: 'mmu_parking_db',
      entities: [ParkingLot],
      synchronize: true,
    }),
    ParkingLotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

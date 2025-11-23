import { Module } from '@nestjs/common';
import { ParkingLotService } from './parking_lot.service';
import { ParkingLotController } from './parking_lot.controller';

@Module({
  controllers: [ParkingLotController],
  providers: [ParkingLotService],
})
export class ParkingLotModule {}

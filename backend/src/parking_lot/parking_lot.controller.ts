import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ParkingLotService } from './parking_lot.service';
import { CreateParkingLotDto } from './dto/create-parking_lot.dto';
import { UpdateParkingLotDto } from './dto/update-parking_lot.dto';

@Controller('parking-lot')
export class ParkingLotController {
  constructor(private readonly parkingLotService: ParkingLotService) {}

  @Post()
  create(@Body() createParkingLotDto: CreateParkingLotDto) {
    return this.parkingLotService.create(createParkingLotDto);
  }

  @Get()
  findAll() {
    return this.parkingLotService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parkingLotService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateParkingLotDto: UpdateParkingLotDto,
  ) {
    return this.parkingLotService.update(+id, updateParkingLotDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parkingLotService.remove(+id);
  }
}

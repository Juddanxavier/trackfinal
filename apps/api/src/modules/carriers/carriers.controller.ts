import { Controller, Get, Param, Query } from '@nestjs/common';
import { CarriersService } from './carriers.service';

@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Get()
  async getAllCarriers() {
    return this.carriersService.getAllCarriers();
  }

  @Get('detect')
  async detectCarrier(@Query('trackingNumber') trackingNumber: string) {
    const carrier =
      await this.carriersService.detectByTrackingNumber(trackingNumber);
    if (carrier) {
      return {
        detected: true,
        carrierCode: carrier.key,
        carrierName: carrier.name_en,
      };
    }
    return {
      detected: false,
      carrierCode: null,
      carrierName: null,
    };
  }

  @Get(':key')
  async getCarrierByKey(@Param('key') key: string) {
    return this.carriersService.getCarrierByKey(key);
  }
}

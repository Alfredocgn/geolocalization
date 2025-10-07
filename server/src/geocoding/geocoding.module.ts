import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from 'src/clients/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {}

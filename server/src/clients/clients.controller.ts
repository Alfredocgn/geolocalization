import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(id);
  }

  @Get('issues')
  findWithGeocodingIssues() {
    return this.clientsService.findWithGeocodingIssues();
  }

  @Post(':id/geocode')
  geocodeClient(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.geocodeClient(id.toString());
  }
  @Patch(':id/address')
  updateAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    addressDto: {
      street?: string;
      city?: string;
      province?: string;
      country?: string;
      notes?: string;
    },
  ) {
    return this.clientsService.updateAddressAndGeocode(id, addressDto);
  }

  @Patch(':id/select-result')
  selectGeocodingResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() selectionDto: { resultIndex: number },
  ) {
    return this.clientsService.selectGeocodingResult(
      id,
      selectionDto.resultIndex,
    );
  }
}

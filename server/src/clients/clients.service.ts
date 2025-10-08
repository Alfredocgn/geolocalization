import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';
import { GeocodingService } from 'src/geocoding/geocoding.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly geocodingService: GeocodingService,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create({
      ...createClientDto,
      geocodingStatus: 'pending',
    });
    const savedClient = await this.clientRepository.save(client);
    this.geocodingService
      .geocodeClient(savedClient.id.toString())
      .catch((error) => {
        console.error('Error geocoding client:', error);
      });
    return savedClient;
  }

  async findAll(): Promise<Client[]> {
    return await this.clientRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    console.log('📝 ClientsService.update called');
    console.log('ID:', id);
    console.log('Update DTO:', updateClientDto);
    await this.clientRepository.update(id, updateClientDto);
    const updated = await this.findOne(id);
    console.log('Updated client:', updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.clientRepository.delete(id);
  }

  async findWithGeocodingIssues(): Promise<Client[]> {
    return await this.clientRepository.find({
      where: [{ geocodingStatus: 'ambiguous' }, { geocodingStatus: 'failed' }],
      order: { updatedAt: 'DESC' },
    });
  }

  async geocodeClient(id: string): Promise<void> {
    const client = await this.findOne(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    await this.geocodingService.geocodeClient(id);
  }

  async updateAddressAndGeocode(
    id: string,
    addressDto: {
      name?: string;
      lastName?: string;
      street?: string;
      city?: string;
      province?: string;
      country?: string;
      notes?: string;
    },
  ): Promise<Client> {
    const updateData: Partial<Client> = {
      ...addressDto,
      geocodingStatus: 'pending',
      geocodingResults: null,
    };

    if (
      addressDto.street ||
      addressDto.city ||
      addressDto.province ||
      addressDto.country
    ) {
      updateData.latitude = undefined;
      updateData.longitude = undefined;
    }

    await this.clientRepository.update(id, updateData);

    this.geocodingService.geocodeClient(id).catch((error) => {
      console.error('Error re-geocoding client:', error);
    });

    return await this.findOne(id);
  }

  async selectGeocodingResult(
    id: string,
    resultIndex: number,
  ): Promise<Client> {
    const client = await this.findOne(id);

    if (client.geocodingStatus !== 'ambiguous' || !client.geocodingResults) {
      throw new Error('Client does not have ambiguous geocoding results');
    }

    if (!Array.isArray(client.geocodingResults)) {
      throw new Error('Geocoding results is not an array');
    }
    const results = client.geocodingResults;

    if (resultIndex >= results.length || resultIndex < 0) {
      throw new Error('Invalid result index');
    }

    const selectedResult = results[resultIndex];

    const updateData: Partial<Client> = {
      latitude: selectedResult.latitude,
      longitude: selectedResult.longitude,
      geocodingStatus: 'success',
      geocodingResults: selectedResult,
      notes: `Manually selected from ${results.length} options (index: ${resultIndex})`,
    };

    await this.clientRepository.update(id, updateData);
    return await this.findOne(id);
  }
}

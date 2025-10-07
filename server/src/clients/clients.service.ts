import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';
import { GeocodingService } from 'src/geocoding/geocoding.service';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  confidence: number;
  manual_selection?: boolean;
  selected_from?: number;
}

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
    await this.clientRepository.update(id, updateClientDto);
    return await this.findOne(id);
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

    let results: GeocodingResult[];
    try {
      const parsedResults: unknown = JSON.parse(client.geocodingResults);
      if (!Array.isArray(parsedResults)) {
        throw new Error('Geocoding results is not an array');
      }
      results = parsedResults as GeocodingResult[];
    } catch (error) {
      console.error('Error parsing geocoding results:', error);
      throw new Error('Invalid geocoding results format');
    }

    if (resultIndex >= results.length || resultIndex < 0) {
      throw new Error('Invalid result index');
    }

    const selectedResult = results[resultIndex];

    const updateData: Partial<Client> = {
      latitude: selectedResult.latitude,
      longitude: selectedResult.longitude,
      geocodingStatus: 'success',
      geocodingResults: JSON.stringify({
        ...selectedResult,
        manual_selection: true,
        selected_from: results.length,
      } as GeocodingResult),
      notes: `Manually selected from ${results.length} options`,
    };

    await this.clientRepository.update(id, updateData);
    return await this.findOne(id);
  }
}

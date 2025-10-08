import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosError } from 'axios';
import { Client } from '../clients/entities/client.entity';
import { GeocodingResult, GeocodingStatus, NominatimResult } from './types';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly NOMINATIM_URL =
    process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';
  private readonly RATE_LIMIT_MS = 1000;

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async geocodeClient(clientId: string): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      this.logger.error(`Client with id ${clientId} not found`);
      return;
    }

    try {
      const address = this.buildAddress(client);
      this.logger.log(`Geocoding address: "${address}"`);

      const fullUrl = `${this.NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json&limit=5`;
      this.logger.log(`Full request URL: "${fullUrl}"`);

      const response = await axios.get<NominatimResult[]>(this.NOMINATIM_URL, {
        params: {
          q: address,
          format: 'json',
          limit: 5,
        },
        headers: {
          'User-Agent': 'GeoChallenge/1.0',
        },
      });

      this.logger.log(`Nominatim response: ${response.data.length} results`);
      await this.processGeocodingResults(client, response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage =
        axiosError.response?.data?.toString() ||
        axiosError.message ||
        'Unknown error';

      this.logger.error(`Error geocoding client ${clientId}:`, errorMessage);
      this.logger.error(`Full error details:`, error);

      await this.updateClientGeocodingStatus(
        client,
        'failed',
        null,
        errorMessage,
      );
    }
  }

  private buildAddress(client: Client): string {
    return `${client.street}, ${client.city}, ${client.province}, ${client.country}`;
  }

  private async processGeocodingResults(
    client: Client,
    results: NominatimResult[],
  ): Promise<void> {
    if (results.length === 0) {
      await this.updateClientGeocodingStatus(
        client,
        'failed',
        null,
        'No results found',
      );
      return;
    }

    if (results.length === 1) {
      // Resultado único - éxito
      const result = results[0];
      const geocodingResult: GeocodingResult = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name,
        confidence: result.importance || 0,
      };

      await this.updateClientGeocodingStatus(
        client,
        'success',
        geocodingResult,
        null,
      );
      return;
    }

    const processedResults: GeocodingResult[] = results.map((result) => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
      confidence: result.importance || 0,
    }));

    await this.updateClientGeocodingStatus(
      client,
      'ambiguous',
      processedResults,
      `${results.length} possible results found`,
    );
  }

  private async updateClientGeocodingStatus(
    client: Client,
    status: GeocodingStatus,
    results: GeocodingResult | GeocodingResult[] | null,
    errorMessage?: string | null,
  ): Promise<void> {
    const updateData: Partial<Client> = {
      geocodingStatus: status,
      geocodingResults: results || null,
    };

    if (status === 'success' && results && !Array.isArray(results)) {
      updateData.latitude = results.latitude;
      updateData.longitude = results.longitude;
    }

    if (errorMessage) {
      updateData.notes = errorMessage;
    }

    await this.clientRepository.update(client.id, updateData);
    this.logger.log(`Updated client ${client.id} with status: ${status}`);
  }

  async geocodeMultipleClients(clientIds: string[]): Promise<void> {
    for (const clientId of clientIds) {
      await this.geocodeClient(clientId);

      await new Promise((resolve) => setTimeout(resolve, this.RATE_LIMIT_MS));
    }
  }
}

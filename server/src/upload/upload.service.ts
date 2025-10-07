import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from 'src/clients/entities/client.entity';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import csv from 'csv-parser';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly geocodingService: GeocodingService,
  ) {}

  async processCsv(file: Express.Multer.File) {
    const createdClientIds: string[] = [];
    const skipped: Array<{ row: number; reason: string; raw: any }> = [];
    const errors: Array<{ row: number; error: string; raw: any }> = [];

    const requiredFields = [
      'name',
      'lastName',
      'street',
      'city',
      'province',
      'country',
    ];

    const rows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      const stream = csv();
      stream
        .on('data', (data) => rows.push(data))
        .on('end', () => resolve())
        .on('error', (err) => reject(err));

      // Feed the buffer to the parser
      stream.write(file.buffer);
      stream.end();
    });

    let rowIndex = 0;
    for (const row of rows) {
      rowIndex += 1;

      const normalized = this.normalizeRow(row);
      const missing = requiredFields.filter((f) => !normalized[f]);
      if (missing.length > 0) {
        skipped.push({
          row: rowIndex,
          reason: `Missing fields: ${missing.join(', ')}`,
          raw: row,
        });
        continue;
      }

      try {
        const client = this.clientRepository.create({
          name: normalized.name,
          lastName: normalized.lastName,
          street: normalized.street,
          city: normalized.city,
          province: normalized.province,
          country: normalized.country,
          geocodingStatus: 'pending',
        });
        const saved = await this.clientRepository.save(client);
        createdClientIds.push(saved.id);
      } catch (e) {
        this.logger.error('Error saving client from CSV', e as Error);
        errors.push({ row: rowIndex, error: (e as Error).message, raw: row });
      }
    }

    // Geocode created clients in sequence with 1s delay
    try {
      await this.geocodingService.geocodeMultipleClients(createdClientIds);
    } catch (e) {
      this.logger.error('Error during batch geocoding', e as Error);
    }

    return {
      created: createdClientIds.length,
      skipped: skipped.length,
      errors: errors.length,
      createdClientIds,
      skippedDetails: skipped,
      errorDetails: errors,
    };
  }

  private normalizeRow(row: Record<string, any>) {
    const get = (keyVariants: string[]) => {
      for (const k of keyVariants) {
        if (
          row[k] !== undefined &&
          row[k] !== null &&
          String(row[k]).trim() !== ''
        ) {
          return String(row[k]).trim();
        }
      }
      return '';
    };

    return {
      name: get(['name', 'Nombre', 'nombre', 'firstName']),
      lastName: get(['lastName', 'Apellido', 'apellido', 'surname']),
      street: get(['street', 'calle', 'direccion', 'address', 'addr']),
      city: get(['city', 'ciudad', 'localidad']),
      province: get(['province', 'provincia', 'state']),
      country: get(['country', 'pais']),
    } as const;
  }
}

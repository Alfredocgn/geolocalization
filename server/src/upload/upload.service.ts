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
    this.logger.log(
      `Begin CSV processing: name=${file.originalname} size=${file.size} mime=${file.mimetype}`,
    );

    const createdClientIds: string[] = [];
    const skipped: Array<{
      row: number;
      reason: string;
      raw: Record<string, unknown>;
    }> = [];
    const errors: Array<{
      row: number;
      error: string;
      raw: Record<string, unknown>;
    }> = [];

    const requiredFields = [
      'name',
      'lastName',
      'street',
      'city',
      'province',
      'country',
    ];

    const rows: Record<string, unknown>[] = [];

    await new Promise<void>((resolve, reject) => {
      // Detect delimiter by sampling first kilobyte: use ';' if present, else default ','
      const sample = file.buffer
        .subarray(0, Math.min(file.buffer.length, 1024))
        .toString('utf8');
      const detectedDelimiter =
        sample.includes(';') && !sample.includes(',;') ? ';' : ',';
      this.logger.log(`CSV delimiter detected: "${detectedDelimiter}"`);

      const stream = csv({ separator: detectedDelimiter });
      stream
        .on('data', (data: Record<string, unknown>) => {
          rows.push(data);
        })
        .on('end', () => {
          this.logger.log(`CSV parsed rows=${rows.length}`);
          resolve();
        })
        .on('error', (err: Error) => {
          this.logger.error('CSV parse error', err);
          reject(err);
        });

      stream.write(file.buffer);
      stream.end();
    });

    let rowIndex = 0;
    for (const row of rows) {
      rowIndex += 1;

      const normalized = this.normalizeRow(row);
      const missing = requiredFields.filter(
        (f) => !normalized[f] || normalized[f].trim() === '',
      );
      if (missing.length > 0) {
        skipped.push({
          row: rowIndex,
          reason: `Missing fields: ${missing.join(', ')}`,
          raw: row,
        });
        this.logger.warn(
          `Row ${rowIndex} skipped: missing=${missing.join(', ')} rawKeys=${Object.keys(
            row,
          ).join(',')}`,
        );
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
        this.logger.log(`Row ${rowIndex} created clientId=${saved.id}`);
      } catch (e) {
        this.logger.error('Error saving client from CSV', e as Error);
        errors.push({ row: rowIndex, error: (e as Error).message, raw: row });
      }
    }

    try {
      await this.geocodingService.geocodeMultipleClients(createdClientIds);
    } catch (e) {
      this.logger.error('Error during batch geocoding', e as Error);
    }

    const summary = {
      created: createdClientIds.length,
      skipped: skipped.length,
      errors: errors.length,
      createdClientIds,
      skippedDetails: skipped,
      errorDetails: errors,
    };
    this.logger.log(
      `CSV processing finished: created=${summary.created} skipped=${summary.skipped} errors=${summary.errors}`,
    );
    return summary;
  }

  private normalizeRow(row: Record<string, unknown>): Record<string, string> {
    const normalizeKey = (key: string): string =>
      key
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const normalizedRow: Record<string, unknown> = {};
    for (const [rawKey, rawValue] of Object.entries(row)) {
      if (!rawKey) continue;
      const nk = normalizeKey(rawKey);
      if (!nk) continue;
      normalizedRow[nk] = rawValue;
    }

    const get = (keyVariants: string[]) => {
      for (const k of keyVariants) {
        const nk = normalizeKey(k);
        const value = normalizedRow[nk];
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed !== '') return trimmed;
        } else if (typeof value === 'number') {
          return String(value);
        } else if (typeof value === 'boolean') {
          return value ? 'true' : 'false';
        }
      }
      return '';
    };

    // Split "Cliente" into name/lastName if provided as full name
    const fullClient = get(['Cliente', 'cliente']);
    let nameFromFull = '';
    let lastFromFull = '';
    if (fullClient) {
      const parts = fullClient.split(' ').filter((p) => p.trim() !== '');
      if (parts.length >= 2) {
        nameFromFull = parts[0];
        lastFromFull = parts.slice(1).join(' ');
      } else if (parts.length === 1) {
        nameFromFull = parts[0];
      }
    }

    const streetFromCombined = get(['Calle y altura', 'calle y altura']);

    return {
      name: get(['name', 'Nombre', 'nombre', 'firstName']) || nameFromFull,
      lastName:
        get(['lastName', 'Apellido', 'apellido', 'surname']) || lastFromFull,
      street:
        get(['street', 'calle', 'direccion', 'address', 'addr']) ||
        streetFromCombined,
      city: get(['city', 'Ciudad', 'ciudad', 'localidad']),
      province: get(['province', 'Provincia', 'provincia', 'state']),
      country: get(['country', 'Pais', 'país', 'pais']),
    };
  }
}

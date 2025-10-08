import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from 'src/clients/entities/client.entity';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { UploadProgress } from './types';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  private geocodingQueue: string[] = [];
  private isProcessingQueue = false;

  private uploadProgress: Map<string, UploadProgress> = new Map();

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly geocodingService: GeocodingService,
  ) {}

  processCsv(file: Express.Multer.File): {
    uploadId: string;
    message: string;
    tracking: string;
  } {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(
      `Starting CSV upload: id=${uploadId} name=${file.originalname} size=${file.size}`,
    );

    this.uploadProgress.set(uploadId, {
      uploadId,
      totalRows: 0,
      processedRows: 0,
      createdClients: 0,
      skipped: 0,
      errors: 0,
      status: 'processing',
      geocodingProgress: {
        total: 0,
        completed: 0,
      },
    });

    this.processCSVInBackground(file, uploadId).catch((error) => {
      this.logger.error(`Background processing failed for ${uploadId}`, error);
      const progress = this.uploadProgress.get(uploadId);
      if (progress) {
        progress.status = 'failed';
      }
    });

    return {
      uploadId,
      message: 'CSV upload started. Processing in background.',
      tracking: `/upload/progress/${uploadId}`,
    };
  }

  private async processCSVInBackground(
    file: Express.Multer.File,
    uploadId: string,
  ): Promise<void> {
    const progress = this.uploadProgress.get(uploadId)!;
    const requiredFields = [
      'name',
      'lastName',
      'street',
      'city',
      'province',
      'country',
    ];

    const sample = file.buffer
      .subarray(0, Math.min(file.buffer.length, 1024))
      .toString('utf8');
    const delimiter = sample.includes(';') ? ';' : ',';
    this.logger.log(
      `CSV delimiter detected: "${delimiter}" for upload ${uploadId}`,
    );

    const rows: Record<string, unknown>[] = [];

    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(file.buffer);
      stream
        .pipe(csv({ separator: delimiter }))
        .on('data', (data: Record<string, unknown>) => {
          rows.push(data);
          progress.totalRows++;
        })
        .on('end', () => {
          this.logger.log(
            `CSV parsed: ${rows.length} rows for upload ${uploadId}`,
          );
          resolve();
        })
        .on('error', (err: Error) => {
          this.logger.error(`CSV parse error for upload ${uploadId}`, err);
          reject(err);
        });
    });

    const BATCH_SIZE = 10;
    const createdClientIds: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (row, batchIndex) => {
        const rowIndex = i + batchIndex + 1;

        const normalized = this.normalizeRow(row);
        const missing = requiredFields.filter(
          (f) => !normalized[f] || normalized[f].trim() === '',
        );

        if (missing.length > 0) {
          progress.skipped++;
          progress.processedRows++;
          this.logger.warn(
            `Row ${rowIndex} skipped in upload ${uploadId}: missing ${missing.join(', ')}`,
          );
          return null;
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
          progress.createdClients++;
          progress.processedRows++;

          this.logger.log(
            `Row ${rowIndex} created clientId=${saved.id} in upload ${uploadId}`,
          );

          return saved.id;
        } catch (error) {
          progress.errors++;
          progress.processedRows++;
          this.logger.error(
            `Error saving client row ${rowIndex} in upload ${uploadId}`,
            error as Error,
          );
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validIds = batchResults.filter((id): id is string => id !== null);
      createdClientIds.push(...validIds);

      this.logger.log(
        `Upload ${uploadId} progress: ${progress.processedRows}/${progress.totalRows} rows processed`,
      );
    }

    progress.status = 'geocoding';
    progress.geocodingProgress.total = createdClientIds.length;

    this.geocodingQueue.push(...createdClientIds);

    this.logger.log(
      `Upload ${uploadId} completed: ${createdClientIds.length} clients created. Starting geocoding...`,
    );

    if (!this.isProcessingQueue) {
      void this.processGeocodingQueue();
    }
  }

  private async processGeocodingQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;
    this.logger.log(
      `Starting geocoding queue. Size: ${this.geocodingQueue.length}`,
    );

    while (this.geocodingQueue.length > 0) {
      const clientId = this.geocodingQueue.shift();

      if (!clientId) continue;

      try {
        await this.geocodingService.geocodeClient(clientId);

        this.updateGeocodingProgress();

        this.logger.log(
          `Geocoded client ${clientId}. Queue remaining: ${this.geocodingQueue.length}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Error geocoding client ${clientId}: ${errorMessage}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.markUploadsAsCompleted();

    this.isProcessingQueue = false;
    this.logger.log('Geocoding queue processing completed');
  }

  private updateGeocodingProgress(): void {
    for (const [uploadId, progress] of this.uploadProgress.entries()) {
      if (progress.status === 'geocoding') {
        progress.geocodingProgress.completed++;

        if (
          progress.geocodingProgress.completed >=
          progress.geocodingProgress.total
        ) {
          progress.status = 'completed';
          this.logger.log(`Upload ${uploadId} fully completed!`);
        }
      }
    }
  }

  private markUploadsAsCompleted(): void {
    for (const [uploadId, progress] of this.uploadProgress.entries()) {
      if (progress.status === 'geocoding') {
        progress.status = 'completed';
        this.logger.log(`Upload ${uploadId} marked as completed`);
      }
    }
  }

  getUploadProgress(uploadId: string): UploadProgress | null {
    const progress = this.uploadProgress.get(uploadId);

    if (!progress) {
      return null;
    }

    return {
      ...progress,
    };
  }

  async getGeocodingProgress(): Promise<{
    total: number;
    pending: number;
    success: number;
    ambiguous: number;
    failed: number;
    queueSize: number;
    activeUploads: number;
  }> {
    const [total, pending, success, ambiguous, failed] = await Promise.all([
      this.clientRepository.count(),
      this.clientRepository.count({ where: { geocodingStatus: 'pending' } }),
      this.clientRepository.count({ where: { geocodingStatus: 'success' } }),
      this.clientRepository.count({ where: { geocodingStatus: 'ambiguous' } }),
      this.clientRepository.count({ where: { geocodingStatus: 'failed' } }),
    ]);

    const activeUploads = Array.from(this.uploadProgress.values()).filter(
      (p) => p.status === 'processing' || p.status === 'geocoding',
    ).length;

    return {
      total,
      pending,
      success,
      ambiguous,
      failed,
      queueSize: this.geocodingQueue.length,
      activeUploads,
    };
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

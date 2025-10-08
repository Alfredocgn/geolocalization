import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { GeocodingService } from '../geocoding/geocoding.service';
import { Repository } from 'typeorm';

describe('UploadService - Edge Cases', () => {
  let service: UploadService;
  let clientRepository: jest.Mocked<Repository<Client>>;
  let geocodingService: jest.Mocked<GeocodingService>;

  beforeEach(async () => {
    // Mock del repositorio
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    // Mock del servicio de geocodificación
    const mockGeocodingService = {
      geocodeClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
        {
          provide: GeocodingService,
          useValue: mockGeocodingService,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    clientRepository = module.get(getRepositoryToken(Client));
    geocodingService = module.get(GeocodingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CSV con datos incompletos', () => {
    it('debería omitir filas con campos requeridos faltantes (sin nombre)', async () => {
      // CSV sin el campo "name"
      const csvContent = `lastName,street,city,province,country
Pérez,Calle 123,Buenos Aires,CABA,Argentina`;

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = service.processCsv(file);

      expect(result.uploadId).toBeDefined();
      expect(result.message).toContain('Processing in background');

      // Esperar a que termine el procesamiento
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar que no se guardó ningún cliente
      expect(clientRepository.save).not.toHaveBeenCalled();
    });

    it('debería omitir filas con todos los campos vacíos', async () => {
      const csvContent = `name,lastName,street,city,province,country
,,,,,,
   ,   ,   ,   ,   ,   `;

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = service.processCsv(file);

      expect(result.uploadId).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(clientRepository.save).not.toHaveBeenCalled();
    });

    it('debería procesar filas válidas y omitir las inválidas en el mismo CSV', async () => {
      const csvContent = `name,lastName,street,city,province,country
Juan,Pérez,Calle 123,Buenos Aires,CABA,Argentina
,Gómez,Calle 456,Córdoba,Córdoba,Argentina
María,López,Calle 789,Rosario,Santa Fe,Argentina`;

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      clientRepository.create.mockImplementation((dto) => dto as Client);
      clientRepository.save.mockResolvedValue({ id: '1' } as Client);

      const result = service.processCsv(file);

      expect(result.uploadId).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Debería guardar solo 2 clientes (fila 1 y 3)
      expect(clientRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('CSV con diferentes formatos', () => {
    it('debería detectar y procesar CSV con delimitador punto y coma', async () => {
      const csvContent = `name;lastName;street;city;province;country
Juan;Pérez;Calle 123;Buenos Aires;CABA;Argentina`;

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      clientRepository.create.mockImplementation((dto) => dto as Client);
      clientRepository.save.mockResolvedValue({ id: '1' } as Client);

      const result = service.processCsv(file);

      expect(result.uploadId).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(clientRepository.save).toHaveBeenCalledTimes(1);
      expect(clientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Juan',
          lastName: 'Pérez',
          street: 'Calle 123',
          city: 'Buenos Aires',
          province: 'CABA',
          country: 'Argentina',
          geocodingStatus: 'pending',
        }),
      );
    });

    it('debería normalizar columnas con acentos y mayúsculas', async () => {
      const csvContent = `Nombre,Apellido,Calle,Ciudad,Provincia,País
Juan,Pérez,Calle 123,Buenos Aires,CABA,Argentina`;

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      clientRepository.create.mockImplementation((dto) => dto as Client);
      clientRepository.save.mockResolvedValue({ id: '1' } as Client);

      const result = service.processCsv(file);

      expect(result.uploadId).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(clientRepository.save).toHaveBeenCalledTimes(1);
      expect(clientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Juan',
          lastName: 'Pérez',
          geocodingStatus: 'pending',
        }),
      );
    });

    it('debería manejar campo "Cliente" completo y dividirlo en nombre y apellido', async () => {
      const csvContent = `Cliente,street,city,province,country
Juan Pérez González,Calle 123,Buenos Aires,CABA,Argentina`;

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      clientRepository.create.mockImplementation((dto) => dto as Client);
      clientRepository.save.mockResolvedValue({ id: '1' } as Client);

      const result = service.processCsv(file);

      expect(result.uploadId).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(clientRepository.save).toHaveBeenCalledTimes(1);
      expect(clientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Juan',
          lastName: 'Pérez González',
          geocodingStatus: 'pending',
        }),
      );
    });
  });

  describe('Manejo de errores en procesamiento', () => {
    it('debería manejar errores al guardar en la base de datos', async () => {
      const csvContent = `name,lastName,street,city,province,country
Juan,Pérez,Calle 123,Buenos Aires,CABA,Argentina`;

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      clientRepository.create.mockImplementation((dto) => dto as Client);
      clientRepository.save.mockRejectedValue(
        new Error('Database connection error'),
      );

      const result = service.processCsv(file);

      expect(result.uploadId).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar que el progreso refleje el error
      const progress = service.getUploadProgress(result.uploadId);
      expect(progress).toBeDefined();
      expect(progress?.errors).toBeGreaterThan(0);
    });

    it('debería manejar CSV vacío', async () => {
      const csvContent = `name,lastName,street,city,province,country`;

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = service.processCsv(file);

      expect(result.uploadId).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const progress = service.getUploadProgress(result.uploadId);
      expect(progress?.totalRows).toBe(0);
      expect(progress?.createdClients).toBe(0);
    });
  });

  describe('Seguimiento de progreso', () => {
    it('debería retornar el progreso de una carga activa', async () => {
      const csvContent = `name,lastName,street,city,province,country
Juan,Pérez,Calle 123,Buenos Aires,CABA,Argentina`;

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(csvContent),
        size: csvContent.length,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      clientRepository.create.mockImplementation((dto) => dto as Client);
      clientRepository.save.mockResolvedValue({ id: '1' } as Client);

      const result = service.processCsv(file);

      // Inmediatamente debería tener progreso
      const progress = service.getUploadProgress(result.uploadId);
      expect(progress).toBeDefined();
      expect(progress?.uploadId).toBe(result.uploadId);
      expect(progress?.status).toBe('processing');
    });

    it('debería retornar null para un uploadId inexistente', () => {
      const progress = service.getUploadProgress('nonexistent-id');
      expect(progress).toBeNull();
    });
  });
});

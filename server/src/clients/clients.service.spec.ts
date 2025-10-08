import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { GeocodingService } from '../geocoding/geocoding.service';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

describe('ClientsService - Edge Cases', () => {
  let service: ClientsService;
  let clientRepository: jest.Mocked<Repository<Client>>;
  let geocodingService: jest.Mocked<GeocodingService>;

  const mockClient: Client = {
    id: '123',
    name: 'Juan',
    lastName: 'Pérez',
    street: 'Calle 123',
    city: 'Buenos Aires',
    province: 'CABA',
    country: 'Argentina',
    geocodingStatus: 'pending',
    latitude: null,
    longitude: null,
    geocodingResults: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const mockGeocodingService = {
      geocodeClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
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

    service = module.get<ClientsService>(ClientsService);
    clientRepository = module.get(getRepositoryToken(Client));
    geocodingService = module.get(GeocodingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Creación de clientes', () => {
    it('debería crear un cliente y iniciar geocodificación', async () => {
      const createDto: CreateClientDto = {
        name: 'Juan',
        lastName: 'Pérez',
        street: 'Calle 123',
        city: 'Buenos Aires',
        province: 'CABA',
        country: 'Argentina',
      };

      clientRepository.create.mockReturnValue(mockClient);
      clientRepository.save.mockResolvedValue(mockClient);
      geocodingService.geocodeClient.mockResolvedValue();

      const result = await service.create(createDto);

      expect(result).toEqual(mockClient);
      expect(clientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          geocodingStatus: 'pending',
        }),
      );
      expect(geocodingService.geocodeClient).toHaveBeenCalledWith('123');
    });

    it('debería crear cliente aunque falle la geocodificación', async () => {
      const createDto: CreateClientDto = {
        name: 'Juan',
        lastName: 'Pérez',
        street: 'Calle 123',
        city: 'Buenos Aires',
        province: 'CABA',
        country: 'Argentina',
      };

      clientRepository.create.mockReturnValue(mockClient);
      clientRepository.save.mockResolvedValue(mockClient);
      geocodingService.geocodeClient.mockRejectedValue(
        new Error('Geocoding API error'),
      );

      const result = await service.create(createDto);

      // El cliente debe crearse exitosamente
      expect(result).toEqual(mockClient);
    });
  });

  describe('Búsqueda de clientes', () => {
    it('debería lanzar NotFoundException cuando el cliente no existe', async () => {
      clientRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería retornar un cliente existente', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);

      const result = await service.findOne('123');

      expect(result).toEqual(mockClient);
    });

    it('debería retornar todos los clientes ordenados por fecha', async () => {
      const mockClients = [mockClient, { ...mockClient, id: '456' }];
      clientRepository.find.mockResolvedValue(mockClients);

      const result = await service.findAll();

      expect(result).toEqual(mockClients);
      expect(clientRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('debería retornar clientes con problemas de geocodificación', async () => {
      const problematicClients = [
        { ...mockClient, geocodingStatus: 'failed' as const },
        { ...mockClient, id: '456', geocodingStatus: 'ambiguous' as const },
      ];
      clientRepository.find.mockResolvedValue(problematicClients);

      const result = await service.findWithGeocodingIssues();

      expect(result).toEqual(problematicClients);
      expect(clientRepository.find).toHaveBeenCalledWith({
        where: [
          { geocodingStatus: 'ambiguous' },
          { geocodingStatus: 'failed' },
        ],
        order: { updatedAt: 'DESC' },
      });
    });
  });

  describe('Actualización de clientes', () => {
    it('debería actualizar un cliente', async () => {
      const updateDto: UpdateClientDto = {
        name: 'Juan Carlos',
      };

      clientRepository.update.mockResolvedValue(undefined as any);
      clientRepository.findOne.mockResolvedValue({
        ...mockClient,
        name: 'Juan Carlos',
      });

      const result = await service.update('123', updateDto);

      expect(result.name).toBe('Juan Carlos');
      expect(clientRepository.update).toHaveBeenCalledWith('123', updateDto);
    });

    it('debería lanzar error si el cliente a actualizar no existe', async () => {
      const updateDto: UpdateClientDto = {
        name: 'Juan Carlos',
      };

      clientRepository.update.mockResolvedValue(undefined as any);
      clientRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Actualización de dirección y re-geocodificación', () => {
    it('debería actualizar dirección y reiniciar geocodificación', async () => {
      const addressDto = {
        street: 'Nueva Calle 456',
        city: 'Córdoba',
      };

      clientRepository.update.mockResolvedValue(undefined as any);
      clientRepository.findOne.mockResolvedValue({
        ...mockClient,
        ...addressDto,
        geocodingStatus: 'pending',
      });
      geocodingService.geocodeClient.mockResolvedValue();

      const result = await service.updateAddressAndGeocode('123', addressDto);

      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          street: 'Nueva Calle 456',
          city: 'Córdoba',
          geocodingStatus: 'pending',
          geocodingResults: null,
          latitude: undefined,
          longitude: undefined,
        }),
      );
      expect(geocodingService.geocodeClient).toHaveBeenCalledWith('123');
    });

    it('debería continuar aunque falle la re-geocodificación', async () => {
      const addressDto = {
        street: 'Nueva Calle 456',
      };

      clientRepository.update.mockResolvedValue(undefined as any);
      clientRepository.findOne.mockResolvedValue({
        ...mockClient,
        ...addressDto,
      });
      geocodingService.geocodeClient.mockRejectedValue(new Error('API error'));

      // No debería lanzar error
      const result = await service.updateAddressAndGeocode('123', addressDto);

      expect(result).toBeDefined();
    });
  });

  describe('Selección de resultado de geocodificación', () => {
    it('debería seleccionar un resultado de múltiples opciones', async () => {
      const ambiguousClient = {
        ...mockClient,
        geocodingStatus: 'ambiguous' as const,
        geocodingResults: [
          {
            latitude: -34.6037,
            longitude: -58.3816,
            display_name: 'Opción 1',
            confidence: 0.8,
          },
          {
            latitude: -34.605,
            longitude: -58.382,
            display_name: 'Opción 2',
            confidence: 0.7,
          },
        ],
      };

      clientRepository.findOne
        .mockResolvedValueOnce(ambiguousClient)
        .mockResolvedValueOnce({
          ...ambiguousClient,
          geocodingStatus: 'success',
          latitude: -34.605,
          longitude: -58.382,
        });
      clientRepository.update.mockResolvedValue(undefined as any);

      const result = await service.selectGeocodingResult('123', 1);

      expect(result.geocodingStatus).toBe('success');
      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          latitude: -34.605,
          longitude: -58.382,
          geocodingStatus: 'success',
        }),
      );
    });

    it('debería lanzar error si el cliente no tiene resultados ambiguos', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);

      await expect(service.selectGeocodingResult('123', 0)).rejects.toThrow(
        'Client does not have ambiguous geocoding results',
      );
    });

    it('debería lanzar error si el índice está fuera de rango', async () => {
      const ambiguousClient = {
        ...mockClient,
        geocodingStatus: 'ambiguous' as const,
        geocodingResults: [
          {
            latitude: -34.6037,
            longitude: -58.3816,
            display_name: 'Opción 1',
            confidence: 0.8,
          },
        ],
      };

      clientRepository.findOne.mockResolvedValue(ambiguousClient);

      await expect(service.selectGeocodingResult('123', 5)).rejects.toThrow(
        'Invalid result index',
      );
    });

    it('debería lanzar error si geocodingResults está malformado', async () => {
      const brokenClient = {
        ...mockClient,
        geocodingStatus: 'ambiguous' as const,
        geocodingResults: 'invalid json' as unknown as null,
      };

      clientRepository.findOne.mockResolvedValue(brokenClient);

      await expect(service.selectGeocodingResult('123', 0)).rejects.toThrow(
        'Geocoding results is not an array',
      );
    });

    it('debería lanzar error si geocodingResults no es un array', async () => {
      const brokenClient = {
        ...mockClient,
        geocodingStatus: 'ambiguous' as const,
        geocodingResults: { notAnArray: true } as unknown as null,
      };

      clientRepository.findOne.mockResolvedValue(brokenClient);

      await expect(service.selectGeocodingResult('123', 0)).rejects.toThrow(
        'Geocoding results is not an array',
      );
    });
  });

  describe('Eliminación de clientes', () => {
    it('debería eliminar un cliente', async () => {
      clientRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('123');

      expect(clientRepository.delete).toHaveBeenCalledWith('123');
    });
  });

  describe('Re-geocodificación manual', () => {
    it('debería lanzar error si el cliente no existe', async () => {
      clientRepository.findOne.mockResolvedValue(null);

      await expect(service.geocodeClient('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería iniciar geocodificación para un cliente existente', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      geocodingService.geocodeClient.mockResolvedValue();

      await service.geocodeClient('123');

      expect(geocodingService.geocodeClient).toHaveBeenCalledWith('123');
    });
  });
});

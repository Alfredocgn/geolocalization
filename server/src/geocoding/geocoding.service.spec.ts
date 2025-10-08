import { Test, TestingModule } from '@nestjs/testing';
import { GeocodingService } from './geocoding.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { Repository } from 'typeorm';
import axios from 'axios';

// Mock de axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GeocodingService - Edge Cases', () => {
  let service: GeocodingService;
  let clientRepository: jest.Mocked<Repository<Client>>;

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
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodingService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GeocodingService>(GeocodingService);
    clientRepository = module.get(getRepositoryToken(Client));

    // Reset de mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Errores de la API externa', () => {
    it('debería manejar timeout de la API y marcar como failed', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      // Simular timeout
      mockedAxios.get.mockRejectedValue({
        message: 'timeout of 5000ms exceeded',
        code: 'ECONNABORTED',
      });

      await service.geocodeClient('123');

      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'failed',
        }),
      );
    });

    it('debería manejar error 500 de la API', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      // Simular error 500
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 500,
          data: 'Internal Server Error',
        },
        message: 'Request failed with status code 500',
      });

      await service.geocodeClient('123');

      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'failed',
        }),
      );
    });

    it('debería manejar error 429 (rate limit) de la API', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      // Simular rate limit
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 429,
          data: 'Too Many Requests',
        },
        message: 'Request failed with status code 429',
      });

      await service.geocodeClient('123');

      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'failed',
        }),
      );
    });

    it('debería manejar error de red (sin conexión)', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      // Simular error de red
      mockedAxios.get.mockRejectedValue({
        message: 'Network Error',
        code: 'ENOTFOUND',
      });

      await service.geocodeClient('123');

      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'failed',
        }),
      );
    });

    it('debería manejar respuesta vacía de la API', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      // Simular respuesta vacía
      mockedAxios.get.mockResolvedValue({
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await service.geocodeClient('123');

      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'failed',
          notes: 'No results found',
        }),
      );
    });
  });

  describe('Casos de resultados de geocodificación', () => {
    it('debería manejar un resultado único (success)', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      // Simular un resultado único
      mockedAxios.get.mockResolvedValue({
        data: [
          {
            lat: '-34.6037',
            lon: '-58.3816',
            display_name: 'Calle 123, Buenos Aires, Argentina',
            importance: 0.8,
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await service.geocodeClient('123');

      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'success',
          latitude: -34.6037,
          longitude: -58.3816,
        }),
      );
    });

    it('debería manejar múltiples resultados (ambiguous)', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      // Simular múltiples resultados
      mockedAxios.get.mockResolvedValue({
        data: [
          {
            lat: '-34.6037',
            lon: '-58.3816',
            display_name: 'Calle 123, Buenos Aires, CABA, Argentina',
            importance: 0.8,
          },
          {
            lat: '-34.6050',
            lon: '-58.3820',
            display_name: 'Calle 123, Buenos Aires, Provincia, Argentina',
            importance: 0.7,
          },
          {
            lat: '-34.6100',
            lon: '-58.3900',
            display_name: 'Calle 123, Buenos Aires, Argentina',
            importance: 0.6,
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await service.geocodeClient('123');

      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'ambiguous',
          notes: '3 possible results found',
        }),
      );
    });

    it('debería manejar resultados con coordenadas inválidas', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      // Simular resultado con coordenadas inválidas
      mockedAxios.get.mockResolvedValue({
        data: [
          {
            lat: 'invalid',
            lon: 'invalid',
            display_name: 'Unknown location',
            importance: 0.1,
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await service.geocodeClient('123');

      // Debería intentar parsear y guardar (parseFloat de 'invalid' = NaN)
      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'success',
        }),
      );
    });
  });

  describe('Manejo de clientes', () => {
    it('debería manejar cliente inexistente', async () => {
      clientRepository.findOne.mockResolvedValue(null);

      await service.geocodeClient('nonexistent-id');

      // No debería intentar actualizar
      expect(clientRepository.update).not.toHaveBeenCalled();
    });

    it('debería construir correctamente la dirección para geocodificar', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      mockedAxios.get.mockResolvedValue({
        data: [
          {
            lat: '-34.6037',
            lon: '-58.3816',
            display_name: 'Address',
            importance: 0.8,
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await service.geocodeClient('123');

      // Verificar que se llamó a axios con la dirección correcta
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Calle 123, Buenos Aires, CABA, Argentina',
          }),
        }),
      );
    });
  });

  describe('Procesamiento en lote', () => {
    it('debería procesar múltiples clientes con delay entre llamadas', async () => {
      const clientIds = ['1', '2', '3'];

      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);
      mockedAxios.get.mockResolvedValue({
        data: [
          {
            lat: '-34.6037',
            lon: '-58.3816',
            display_name: 'Address',
            importance: 0.8,
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const startTime = Date.now();
      await service.geocodeMultipleClients(clientIds);
      const endTime = Date.now();

      // Debería tomar al menos 2 segundos (3 clientes con 1 segundo de delay cada uno)
      expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
      expect(clientRepository.update).toHaveBeenCalledTimes(3);
    });

    it('debería continuar procesando aunque un cliente falle', async () => {
      const clientIds = ['1', '2', '3'];

      clientRepository.findOne
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(null) // El segundo cliente no existe
        .mockResolvedValueOnce(mockClient);

      clientRepository.update.mockResolvedValue(undefined as any);
      mockedAxios.get.mockResolvedValue({
        data: [
          {
            lat: '-34.6037',
            lon: '-58.3816',
            display_name: 'Address',
            importance: 0.8,
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await service.geocodeMultipleClients(clientIds);

      // Debería actualizar solo 2 clientes (1 y 3)
      expect(clientRepository.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('Manejo de respuestas malformadas', () => {
    it('debería manejar respuesta con formato inesperado', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      // Simular respuesta con formato inesperado
      mockedAxios.get.mockResolvedValue({
        data: 'invalid json response',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await service.geocodeClient('123');

      // Debería manejar el error
      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'failed',
        }),
      );
    });

    it('debería manejar resultados sin campo importance', async () => {
      clientRepository.findOne.mockResolvedValue(mockClient);
      clientRepository.update.mockResolvedValue(undefined as any);

      mockedAxios.get.mockResolvedValue({
        data: [
          {
            lat: '-34.6037',
            lon: '-58.3816',
            display_name: 'Address',
            // Sin campo importance
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await service.geocodeClient('123');

      expect(clientRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          geocodingStatus: 'success',
        }),
      );
    });
  });
});

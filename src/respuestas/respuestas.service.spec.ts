import { BadRequestException, ConflictException } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Item } from '../items/schemas/item.schema.js';
import { Opcion } from '../opciones/schemas/opcion.schema.js';
import { Presentacion } from '../presentaciones/schemas/presentacion.schema.js';
import { RespuestaOpcion } from '../respuestas_opciones/schemas/respuesta-opcion.schema.js';
import { Respuesta } from './schemas/respuesta.schema.js';
import { RespuestasService } from './respuestas.service.js';

describe('RespuestasService', () => {
  const session = {
    withTransaction: vi.fn(),
    endSession: vi.fn(),
  };
  const mockConnection = {
    startSession: vi.fn(),
  };
  const mockRespuestaModel = {
    create: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
  };
  const mockRespuestaOpcionModel = {
    insertMany: vi.fn(),
    find: vi.fn(),
  };
  const mockPresentacionModel = {
    findById: vi.fn(),
  };
  const mockItemModel = {
    findById: vi.fn(),
  };
  const mockOpcionModel = {
    find: vi.fn(),
  };
  let service: RespuestasService;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockConnection.startSession.mockResolvedValue(session);
    session.withTransaction.mockImplementation(
      async (callback: () => Promise<unknown>) => callback(),
    );
    session.endSession.mockResolvedValue(undefined);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RespuestasService,
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: getModelToken(Respuesta.name), useValue: mockRespuestaModel },
        {
          provide: getModelToken(RespuestaOpcion.name),
          useValue: mockRespuestaOpcionModel,
        },
        {
          provide: getModelToken(Presentacion.name),
          useValue: mockPresentacionModel,
        },
        { provide: getModelToken(Item.name), useValue: mockItemModel },
        { provide: getModelToken(Opcion.name), useValue: mockOpcionModel },
      ],
    }).compile();

    service = module.get<RespuestasService>(RespuestasService);
  });

  it('returns conflict if the presentation already has a response', async () => {
    mockPresentacionModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        id_item: '507f1f77bcf86cd799439012',
      }),
    });
    mockRespuestaModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: 'existing-response' }),
    });

    await expect(
      service.create({
        id_presentacion: '507f1f77bcf86cd799439011',
        certeza: 4,
        opciones: [],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mockRespuestaModel.create).not.toHaveBeenCalled();
  });

  it('returns bad request for certainty outside the allowed range', async () => {
    await expect(
      service.create({
        id_presentacion: '507f1f77bcf86cd799439011',
        certeza: 6,
        opciones: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockPresentacionModel.findById).not.toHaveBeenCalled();
  });

  it('creates response and selected options in one transaction', async () => {
    const idPresentacion = new Types.ObjectId('507f1f77bcf86cd799439011');
    const idItem = new Types.ObjectId('507f1f77bcf86cd799439012');
    const idOpcion = new Types.ObjectId('507f1f77bcf86cd799439013');
    const respuesta = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
      toObject: () => ({ _id: 'respuesta', correcta: true }),
    };
    const respuestaOpcion = { id_opcion: idOpcion };

    mockPresentacionModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: idPresentacion,
        id_item: idItem,
      }),
    });
    mockRespuestaModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });
    mockItemModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ formato: 'single_choice' }),
    });
    mockOpcionModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          _id: idOpcion,
          id_item: idItem,
          orden: 1,
          es_correcta: true,
        },
      ]),
    });
    mockRespuestaModel.create.mockResolvedValue([respuesta]);
    mockRespuestaOpcionModel.insertMany.mockResolvedValue([respuestaOpcion]);

    await expect(
      service.create({
        id_presentacion: idPresentacion.toString(),
        certeza: 4,
        opciones: [{ id_opcion: idOpcion.toString() }],
      }),
    ).resolves.toEqual({
      _id: 'respuesta',
      correcta: true,
      opciones: [respuestaOpcion],
    });

    expect(mockConnection.startSession).toHaveBeenCalledOnce();
    expect(session.withTransaction).toHaveBeenCalledOnce();
    expect(mockRespuestaModel.create).toHaveBeenCalledWith(
      [
        {
          id_presentacion: idPresentacion,
          certeza: 4,
          correcta: true,
        },
      ],
      { session },
    );
    expect(mockRespuestaOpcionModel.insertMany).toHaveBeenCalledWith(
      [
        {
          id_respuesta: respuesta._id,
          id_opcion: idOpcion,
        },
      ],
      { session },
    );
    expect(session.endSession).toHaveBeenCalledOnce();
  });
});

import { ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Experiencia } from '../experiencias/schemas/experiencia.schema.js';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Inscripcion } from '../inscripciones/schemas/inscripcion.schema.js';
import { Item } from '../items/schemas/item.schema.js';
import { Presentacion } from '../presentaciones/schemas/presentacion.schema.js';
import { Respuesta } from '../respuestas/schemas/respuesta.schema.js';
import { Resultado } from './schemas/resultado.schema.js';
import { ResultadosService } from './resultados.service.js';

function consulta<T>(valor: T) {
  return { exec: vi.fn().mockResolvedValue(valor) };
}

describe('ResultadosService', () => {
  const idInscripcion = new Types.ObjectId('507f1f77bcf86cd799439011');
  const idExperiencia = new Types.ObjectId('507f1f77bcf86cd799439012');
  const idExperienciaEvidencia = new Types.ObjectId(
    '507f1f77bcf86cd799439013',
  );
  const idPresentacion = new Types.ObjectId('507f1f77bcf86cd799439014');
  const idItem = new Types.ObjectId('507f1f77bcf86cd799439015');
  const mockResultadoModel = {
    exists: vi.fn(),
    insertMany: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
  };
  const mockInscripcionModel = {
    findById: vi.fn(),
  };
  const mockExperienciaEvidenciaModel = {
    find: vi.fn(),
  };
  const mockPresentacionModel = {
    find: vi.fn(),
  };
  const mockRespuestaModel = {
    find: vi.fn(),
  };
  const mockItemModel = {
    find: vi.fn(),
  };
  const mockExperienciaModel = {
    findById: vi.fn(),
  };
  let service: ResultadosService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultadosService,
        { provide: getModelToken(Resultado.name), useValue: mockResultadoModel },
        {
          provide: getModelToken(Inscripcion.name),
          useValue: mockInscripcionModel,
        },
        {
          provide: getModelToken(ExperienciaEvidencia.name),
          useValue: mockExperienciaEvidenciaModel,
        },
        {
          provide: getModelToken(Presentacion.name),
          useValue: mockPresentacionModel,
        },
        { provide: getModelToken(Respuesta.name), useValue: mockRespuestaModel },
        { provide: getModelToken(Item.name), useValue: mockItemModel },
        {
          provide: getModelToken(Experiencia.name),
          useValue: mockExperienciaModel,
        },
      ],
    }).compile();

    service = module.get<ResultadosService>(ResultadosService);
  });

  it('creates a no_concluyente result per included evidence', async () => {
    mockInscripcionModel.findById.mockReturnValue(
      consulta({ id_experiencia: idExperiencia }),
    );
    mockResultadoModel.exists.mockResolvedValue(null);
    mockExperienciaEvidenciaModel.find.mockReturnValue(
      consulta([{ _id: idExperienciaEvidencia }]),
    );
    mockPresentacionModel.find.mockReturnValue(
      consulta([{ _id: idPresentacion, id_item: idItem }]),
    );
    mockRespuestaModel.find.mockReturnValue(
      consulta([
        {
          id_presentacion: idPresentacion,
          correcta: true,
          certeza: 4,
        },
      ]),
    );
    mockItemModel.find.mockReturnValue(
      consulta([
        {
          _id: idItem,
          id_experiencia_evidencia: idExperienciaEvidencia,
        },
      ]),
    );
    mockResultadoModel.insertMany.mockImplementation(async (resultados) =>
      resultados,
    );

    const resultados = await service.calcularPorInscripcion(idInscripcion);

    expect(resultados).toHaveLength(1);
    expect(resultados[0]).toMatchObject({
      id_inscripcion: idInscripcion,
      id_experiencia_evidencia: idExperienciaEvidencia,
      estado: 'muestra',
    });
    expect(resultados[0].fecha_calculo).toBeInstanceOf(Date);
  });

  it('keeps unanswered presentations when calculating evidence state', async () => {
    mockInscripcionModel.findById.mockReturnValue(
      consulta({ id_experiencia: idExperiencia }),
    );
    mockResultadoModel.exists.mockResolvedValue(null);
    mockExperienciaEvidenciaModel.find.mockReturnValue(
      consulta([{ _id: idExperienciaEvidencia }]),
    );
    mockPresentacionModel.find.mockReturnValue(
      consulta([{ _id: idPresentacion, id_item: idItem }]),
    );
    mockRespuestaModel.find.mockReturnValue(consulta([]));
    mockItemModel.find.mockReturnValue(
      consulta([
        {
          _id: idItem,
          id_experiencia_evidencia: idExperienciaEvidencia,
        },
      ]),
    );
    mockResultadoModel.insertMany.mockImplementation(async (resultados) =>
      resultados,
    );

    const resultados = await service.calcularPorInscripcion(idInscripcion);

    expect(resultados[0].estado).toBe('no_concluyente');
  });

  it('returns conflict when recalculating an inscription with existing results', async () => {
    mockInscripcionModel.findById.mockReturnValue(
      consulta({ id_experiencia: idExperiencia }),
    );
    mockResultadoModel.exists.mockResolvedValue({ _id: 'existing-result' });

    await expect(
      service.calcularPorInscripcion(idInscripcion),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mockResultadoModel.insertMany).not.toHaveBeenCalled();
  });

  it('calculates report counts per included evidence without storing a report', async () => {
    const segundaEvidencia = new Types.ObjectId(
      '507f1f77bcf86cd799439016',
    );
    mockExperienciaModel.findById.mockReturnValue(consulta({ _id: idExperiencia }));
    mockExperienciaEvidenciaModel.find.mockReturnValue(
      consulta([
        { _id: idExperienciaEvidencia },
        { _id: segundaEvidencia },
      ]),
    );
    mockResultadoModel.find.mockReturnValue(
      consulta([
        {
          id_experiencia_evidencia: idExperienciaEvidencia,
          estado: 'muestra',
        },
        {
          id_experiencia_evidencia: idExperienciaEvidencia,
          estado: 'no_muestra',
        },
        {
          id_experiencia_evidencia: segundaEvidencia,
          estado: 'no_concluyente',
        },
      ]),
    );

    const reporte = await service.generarReporte(idExperiencia);

    expect(reporte).toEqual({
      estado_por_evidencia: [
        {
          id_experiencia_evidencia: idExperienciaEvidencia,
          muestra: 1,
          no_muestra: 1,
          no_concluyente: 0,
        },
        {
          id_experiencia_evidencia: segundaEvidencia,
          muestra: 0,
          no_muestra: 0,
          no_concluyente: 1,
        },
      ],
      estado_general: 'en_proceso',
    });
    expect(mockResultadoModel.insertMany).not.toHaveBeenCalled();
  });
});

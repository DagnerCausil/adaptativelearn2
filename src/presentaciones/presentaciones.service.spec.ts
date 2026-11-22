import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CERTEZA_ALTA_PARADA, ITEMS_MINIMOS } from '../common/umbrales.js';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Inscripcion } from '../inscripciones/schemas/inscripcion.schema.js';
import { Item } from '../items/schemas/item.schema.js';
import { Opcion } from '../opciones/schemas/opcion.schema.js';
import { Respuesta } from '../respuestas/schemas/respuesta.schema.js';
import { PresentacionesService } from './presentaciones.service.js';
import { Presentacion } from './schemas/presentacion.schema.js';

/** Imita una consulta de Mongoose: admite .sort() y termina en .exec(). */
function consulta<T>(valor: T) {
  const query = {
    sort: vi.fn(() => query),
    exec: vi.fn().mockResolvedValue(valor),
  };
  return query;
}

describe('PresentacionesService', () => {
  const idInscripcion = new Types.ObjectId();
  const idExperiencia = new Types.ObjectId();
  const evidenciaA = { _id: new Types.ObjectId() };
  const evidenciaB = { _id: new Types.ObjectId() };
  const itemDe = (evidencia: { _id: Types.ObjectId }, enunciado: string) => ({
    _id: new Types.ObjectId(),
    id_experiencia_evidencia: evidencia._id,
    enunciado,
    formato: 'single_choice',
    estado_revision: 'aprobado',
    excluido: false,
  });
  const itemA1 = itemDe(evidenciaA, 'Pregunta A1');
  const itemA2 = itemDe(evidenciaA, 'Pregunta A2');
  const itemB1 = itemDe(evidenciaB, 'Pregunta B1');

  const mockPresentacionModel = {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  };
  const mockInscripcionModel = { findById: vi.fn() };
  const mockRespuestaModel = { find: vi.fn() };
  const mockExperienciaEvidenciaModel = { find: vi.fn() };
  const mockItemModel = { find: vi.fn() };
  const mockOpcionModel = { find: vi.fn() };
  let service: PresentacionesService;

  const presentacionDe = (item: { _id: Types.ObjectId }, orden: number) => ({
    _id: new Types.ObjectId(),
    id_inscripcion: idInscripcion,
    id_item: item._id,
    orden_presentacion: orden,
  });

  function prepararInscripcion() {
    mockInscripcionModel.findById.mockReturnValue(
      consulta({ _id: idInscripcion, id_experiencia: idExperiencia }),
    );
    mockExperienciaEvidenciaModel.find.mockReturnValue(
      consulta([evidenciaA, evidenciaB]),
    );
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresentacionesService,
        {
          provide: getModelToken(Presentacion.name),
          useValue: mockPresentacionModel,
        },
        {
          provide: getModelToken(Inscripcion.name),
          useValue: mockInscripcionModel,
        },
        {
          provide: getModelToken(Respuesta.name),
          useValue: mockRespuestaModel,
        },
        {
          provide: getModelToken(ExperienciaEvidencia.name),
          useValue: mockExperienciaEvidenciaModel,
        },
        { provide: getModelToken(Item.name), useValue: mockItemModel },
        { provide: getModelToken(Opcion.name), useValue: mockOpcionModel },
      ],
    }).compile();

    service = module.get<PresentacionesService>(PresentacionesService);
  });

  it('lista las presentaciones de una inscripción en orden', async () => {
    const query = consulta([]);
    mockPresentacionModel.find.mockReturnValue(query);

    await service.findAll({ id_inscripcion: idInscripcion.toHexString() });
    expect(mockPresentacionModel.find).toHaveBeenCalledWith({
      id_inscripcion: idInscripcion,
    });
    expect(query.sort).toHaveBeenCalledWith({ orden_presentacion: 1 });
  });

  it('da 404 si la presentación no existe', async () => {
    mockPresentacionModel.findById.mockReturnValue(consulta(null));

    await expect(service.findOne(new Types.ObjectId())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('siguienteItem', () => {
    it('da 404 si la inscripción no existe', async () => {
      mockInscripcionModel.findById.mockReturnValue(consulta(null));

      await expect(service.siguienteItem(idInscripcion)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('da 409 si la última presentación no tiene respuesta', async () => {
      prepararInscripcion();
      mockPresentacionModel.find.mockReturnValue(
        consulta([presentacionDe(itemA1, 1)]),
      );
      mockRespuestaModel.find.mockReturnValue(consulta([]));

      await expect(service.siguienteItem(idInscripcion)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockPresentacionModel.create).not.toHaveBeenCalled();
    });

    it('presenta el primer ítem sin revelar la respuesta correcta', async () => {
      prepararInscripcion();
      mockPresentacionModel.find.mockReturnValue(consulta([]));
      mockItemModel.find.mockReturnValueOnce(
        consulta([itemA1, itemA2, itemB1]),
      );
      const creada = presentacionDe(itemA1, 1);
      mockPresentacionModel.create.mockResolvedValue(creada);
      mockOpcionModel.find.mockReturnValue(
        consulta([
          {
            _id: new Types.ObjectId(),
            id_item: itemA1._id,
            texto: 'Correcta',
            orden: 1,
            es_correcta: true,
            hipotesis_error: undefined,
          },
          {
            _id: new Types.ObjectId(),
            id_item: itemA1._id,
            texto: 'Distractor',
            orden: 2,
            es_correcta: false,
            hipotesis_error: 'Confunde suma con resta',
          },
        ]),
      );

      const resultado = await service.siguienteItem(idInscripcion);

      expect(mockItemModel.find).toHaveBeenCalledWith({
        id_experiencia_evidencia: { $in: [evidenciaA._id, evidenciaB._id] },
        estado_revision: 'aprobado',
        excluido: false,
      });
      expect(mockPresentacionModel.create).toHaveBeenCalledWith({
        id_inscripcion: idInscripcion,
        id_item: itemA1._id,
        orden_presentacion: 1,
      });
      expect(resultado).toMatchObject({
        terminado: false,
        presentacion: creada,
        item: { enunciado: 'Pregunta A1', formato: 'single_choice' },
      });
      if (resultado.terminado) throw new Error('no debía terminar');
      expect(resultado.opciones).toHaveLength(2);
      for (const opcion of resultado.opciones) {
        expect(Object.keys(opcion).sort()).toEqual(['_id', 'texto']);
        expect(opcion).not.toHaveProperty('es_correcta');
        expect(opcion).not.toHaveProperty('orden');
        expect(opcion).not.toHaveProperty('hipotesis_error');
      }
    });

    it('en matching envía grupo, pero nunca orden', async () => {
      prepararInscripcion();
      mockPresentacionModel.find.mockReturnValue(consulta([]));
      mockItemModel.find.mockReturnValueOnce(consulta([itemA1]));
      mockPresentacionModel.create.mockResolvedValue(presentacionDe(itemA1, 1));
      mockOpcionModel.find.mockReturnValue(
        consulta([
          {
            _id: new Types.ObjectId(),
            texto: 'Perro',
            orden: 1,
            es_correcta: true,
            grupo: 'izquierda',
          },
          {
            _id: new Types.ObjectId(),
            texto: 'Ladra',
            orden: 1,
            es_correcta: true,
            grupo: 'derecha',
          },
        ]),
      );

      const resultado = await service.siguienteItem(idInscripcion);

      if (resultado.terminado) throw new Error('no debía terminar');
      for (const opcion of resultado.opciones) {
        expect(Object.keys(opcion).sort()).toEqual(['_id', 'grupo', 'texto']);
      }
    });

    it('reparte: después de una evidencia presenta otra', async () => {
      prepararInscripcion();
      const anterior = presentacionDe(itemA1, 1);
      mockPresentacionModel.find.mockReturnValue(consulta([anterior]));
      mockRespuestaModel.find.mockReturnValue(
        consulta([
          { id_presentacion: anterior._id, correcta: true, certeza: 5 },
        ]),
      );
      mockItemModel.find
        .mockReturnValueOnce(consulta([itemA1, itemA2, itemB1]))
        .mockReturnValueOnce(consulta([itemA1]));
      mockPresentacionModel.create.mockImplementation((datos) =>
        Promise.resolve(datos),
      );
      mockOpcionModel.find.mockReturnValue(consulta([]));

      await service.siguienteItem(idInscripcion);

      expect(mockPresentacionModel.create).toHaveBeenCalledWith({
        id_inscripcion: idInscripcion,
        id_item: itemB1._id,
        orden_presentacion: 2,
      });
    });

    it('se detiene tras 4 respuestas correctas con certeza alta', async () => {
      prepararInscripcion();
      const items = Array.from({ length: ITEMS_MINIMOS + 2 }, (_, i) =>
        itemDe(i % 2 ? evidenciaB : evidenciaA, `P${i}`),
      );
      const presentadas = items
        .slice(0, ITEMS_MINIMOS)
        .map((item, i) => presentacionDe(item, i + 1));
      mockPresentacionModel.find.mockReturnValue(consulta(presentadas));
      mockRespuestaModel.find.mockReturnValue(
        consulta(
          presentadas.map((p) => ({
            id_presentacion: p._id,
            correcta: true,
            certeza: CERTEZA_ALTA_PARADA,
          })),
        ),
      );
      mockItemModel.find.mockReturnValueOnce(consulta(items));

      await expect(service.siguienteItem(idInscripcion)).resolves.toEqual({
        terminado: true,
      });
      expect(mockPresentacionModel.create).not.toHaveBeenCalled();
    });

    it('se detiene si no quedan ítems aprobados sin presentar', async () => {
      prepararInscripcion();
      mockPresentacionModel.find.mockReturnValue(consulta([]));
      mockItemModel.find.mockReturnValueOnce(consulta([]));

      await expect(service.siguienteItem(idInscripcion)).resolves.toEqual({
        terminado: true,
      });
      expect(mockPresentacionModel.create).not.toHaveBeenCalled();
    });
  });
});

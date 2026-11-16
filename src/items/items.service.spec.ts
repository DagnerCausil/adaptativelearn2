import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Opcion } from '../opciones/schemas/opcion.schema.js';
import { Presentacion } from '../presentaciones/schemas/presentacion.schema.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { Item } from './schemas/item.schema.js';
import { ItemsService } from './items.service.js';

const conExec = (valor: unknown) => ({
  exec: vi.fn().mockResolvedValue(valor),
});

describe('ItemsService', () => {
  const id = new Types.ObjectId('507f1f77bcf86cd799439011');
  const idSeleccion = new Types.ObjectId('507f1f77bcf86cd799439012');
  const idExperiencia = new Types.ObjectId('507f1f77bcf86cd799439013');
  const item = {
    _id: id,
    id_experiencia_evidencia: idSeleccion,
    enunciado: '¿Cuál es el resultado?',
    formato: 'single_choice',
    origen: 'docente',
    estado_revision: 'borrador',
    excluido: false,
  };
  const mockItemModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const mockOpcionModel = {
    find: vi.fn(),
    exists: vi.fn(),
    deleteMany: vi.fn(),
  };
  const mockExperienciaEvidenciaModel = {
    findById: vi.fn(),
    find: vi.fn(),
  };
  const mockPresentacionModel = {
    exists: vi.fn(),
  };
  let service: ItemsService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: getModelToken(Item.name), useValue: mockItemModel },
        { provide: getModelToken(Opcion.name), useValue: mockOpcionModel },
        {
          provide: getModelToken(ExperienciaEvidencia.name),
          useValue: mockExperienciaEvidenciaModel,
        },
        {
          provide: getModelToken(Presentacion.name),
          useValue: mockPresentacionModel,
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  describe('create', () => {
    const dto: CreateItemDto = {
      id_experiencia_evidencia: idSeleccion.toString(),
      enunciado: '¿Cuál es el resultado?',
      formato: 'single_choice',
      origen: 'docente',
    };

    it('creates the item in borrador and not excluded', async () => {
      mockExperienciaEvidenciaModel.findById.mockReturnValue(
        conExec({ _id: idSeleccion }),
      );
      mockItemModel.create.mockResolvedValue(item);

      await expect(service.create(dto)).resolves.toBe(item);
      expect(mockItemModel.create).toHaveBeenCalledWith({
        id_experiencia_evidencia: idSeleccion,
        enunciado: dto.enunciado,
        formato: 'single_choice',
        origen: 'docente',
        estado_revision: 'borrador',
        excluido: false,
      });
    });

    it('throws 404 when the evidence selection does not exist', async () => {
      mockExperienciaEvidenciaModel.findById.mockReturnValue(conExec(null));

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockItemModel.create).not.toHaveBeenCalled();
    });
  });

  it('filters items by id_experiencia_evidencia', async () => {
    mockItemModel.find.mockReturnValue(conExec([item]));

    await expect(
      service.findAll({ id_experiencia_evidencia: idSeleccion.toString() }),
    ).resolves.toEqual([item]);
    expect(mockItemModel.find).toHaveBeenCalledWith({
      id_experiencia_evidencia: idSeleccion,
    });
  });

  it('lists all items without filter', async () => {
    mockItemModel.find.mockReturnValue(conExec([item]));

    await service.findAll({});
    expect(mockItemModel.find).toHaveBeenCalledWith({});
  });

  it('throws 404 when the item does not exist', async () => {
    mockItemModel.findById.mockReturnValue(conExec(null));

    await expect(service.findOne(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('update', () => {
    it('updates enunciado, formato and excluido', async () => {
      mockItemModel.findById.mockReturnValue(conExec(item));
      mockOpcionModel.exists.mockResolvedValue(null);
      mockItemModel.findByIdAndUpdate.mockReturnValue(conExec(item));
      const dto = {
        enunciado: 'Nuevo',
        formato: 'ordering' as const,
        excluido: true,
      };

      await expect(service.update(id, dto)).resolves.toBe(item);
      expect(mockItemModel.findByIdAndUpdate).toHaveBeenCalledWith(id, dto, {
        new: true,
        runValidators: true,
      });
    });

    it('rejects leaving matching when options have grupo', async () => {
      mockItemModel.findById.mockReturnValue(
        conExec({ ...item, formato: 'matching' }),
      );
      mockOpcionModel.exists.mockResolvedValue({ _id: 'opcion' });

      await expect(
        service.update(id, { formato: 'single_choice' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockItemModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('revisar (control docente)', () => {
    it('approves an item', async () => {
      const aprobado = { ...item, estado_revision: 'aprobado' };
      mockItemModel.findByIdAndUpdate.mockReturnValue(conExec(aprobado));

      await expect(
        service.revisar(id, { estado_revision: 'aprobado' }),
      ).resolves.toBe(aprobado);
      expect(mockItemModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { estado_revision: 'aprobado' },
        { new: true, runValidators: true },
      );
    });

    it('rejects an item', async () => {
      mockItemModel.findByIdAndUpdate.mockReturnValue(
        conExec({ ...item, estado_revision: 'rechazado' }),
      );

      await expect(
        service.revisar(id, { estado_revision: 'rechazado' }),
      ).resolves.toMatchObject({ estado_revision: 'rechazado' });
    });

    it('throws 404 when the item does not exist', async () => {
      mockItemModel.findByIdAndUpdate.mockReturnValue(conExec(null));

      await expect(
        service.revisar(id, { estado_revision: 'aprobado' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an item without presentations and its options', async () => {
      mockItemModel.findById.mockReturnValue(conExec(item));
      mockPresentacionModel.exists.mockResolvedValue(null);
      mockOpcionModel.deleteMany.mockReturnValue(conExec({ deletedCount: 2 }));
      mockItemModel.findByIdAndDelete.mockReturnValue(conExec(item));

      await expect(service.remove(id)).resolves.toBe(item);
      expect(mockOpcionModel.deleteMany).toHaveBeenCalledWith({ id_item: id });
      expect(mockItemModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('prevents removing an item with presentations (409)', async () => {
      mockItemModel.findById.mockReturnValue(conExec(item));
      mockPresentacionModel.exists.mockResolvedValue({ _id: 'presentacion' });

      await expect(service.remove(id)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockItemModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('validarOpciones (RI-4)', () => {
    it('passes a valid single_choice item', async () => {
      mockItemModel.findById.mockReturnValue(conExec(item));
      mockOpcionModel.find.mockReturnValue(
        conExec([{ es_correcta: true }, { es_correcta: false }]),
      );

      await expect(service.validarOpciones(id)).resolves.toBeUndefined();
      expect(mockOpcionModel.find).toHaveBeenCalledWith({ id_item: id });
    });

    it('throws 400 saying what is missing', async () => {
      mockItemModel.findById.mockReturnValue(conExec(item));
      mockOpcionModel.find.mockReturnValue(conExec([{ es_correcta: true }]));

      await expect(service.validarOpciones(id)).rejects.toThrow(
        /al menos 2 opciones/,
      );
    });

    it('throws 404 when the item does not exist', async () => {
      mockItemModel.findById.mockReturnValue(conExec(null));

      await expect(service.validarOpciones(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('validarBancoDeExperiencia', () => {
    it('only validates approved, non-excluded items of the experience', async () => {
      mockExperienciaEvidenciaModel.find.mockReturnValue(
        conExec([{ _id: idSeleccion }]),
      );
      mockItemModel.find.mockReturnValue(conExec([]));

      await expect(
        service.validarBancoDeExperiencia(idExperiencia),
      ).resolves.toBeUndefined();
      expect(mockExperienciaEvidenciaModel.find).toHaveBeenCalledWith({
        id_experiencia: idExperiencia,
      });
      expect(mockItemModel.find).toHaveBeenCalledWith({
        id_experiencia_evidencia: { $in: [idSeleccion] },
        estado_revision: 'aprobado',
        excluido: false,
      });
    });

    it('blocks publishing when an approved matching item has 3 options', async () => {
      mockExperienciaEvidenciaModel.find.mockReturnValue(
        conExec([{ _id: idSeleccion }]),
      );
      mockItemModel.find.mockReturnValue(
        conExec([
          { ...item, formato: 'matching', estado_revision: 'aprobado' },
        ]),
      );
      mockOpcionModel.find.mockReturnValue(
        conExec([
          { es_correcta: true, grupo: 'izquierda' },
          { es_correcta: true, grupo: 'izquierda' },
          { es_correcta: true, grupo: 'derecha' },
        ]),
      );

      await expect(
        service.validarBancoDeExperiencia(idExperiencia),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('passes when every approved item meets RI-4', async () => {
      mockExperienciaEvidenciaModel.find.mockReturnValue(
        conExec([{ _id: idSeleccion }]),
      );
      mockItemModel.find.mockReturnValue(
        conExec([
          { ...item, formato: 'ordering', estado_revision: 'aprobado' },
        ]),
      );
      mockOpcionModel.find.mockReturnValue(
        conExec([{ es_correcta: true }, { es_correcta: true }]),
      );

      await expect(
        service.validarBancoDeExperiencia(idExperiencia),
      ).resolves.toBeUndefined();
    });

    it('does nothing when the experience has no selected evidences', async () => {
      mockExperienciaEvidenciaModel.find.mockReturnValue(conExec([]));

      await expect(
        service.validarBancoDeExperiencia(idExperiencia),
      ).resolves.toBeUndefined();
      expect(mockItemModel.find).not.toHaveBeenCalled();
    });
  });
});

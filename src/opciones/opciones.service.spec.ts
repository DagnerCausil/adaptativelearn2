import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Item } from '../items/schemas/item.schema.js';
import { RespuestaOpcion } from '../respuestas_opciones/schemas/respuesta-opcion.schema.js';
import { CreateOpcionDto } from './dto/create-opcion.dto.js';
import { Opcion } from './schemas/opcion.schema.js';
import { OpcionesService } from './opciones.service.js';

const conExec = (valor: unknown) => ({
  exec: vi.fn().mockResolvedValue(valor),
});

describe('OpcionesService', () => {
  const idItem = new Types.ObjectId('507f1f77bcf86cd799439021');
  const idOpcion = new Types.ObjectId('507f1f77bcf86cd799439022');
  const itemSingle = { _id: idItem, formato: 'single_choice' };
  const itemMatching = { _id: idItem, formato: 'matching' };
  const opcion = {
    _id: idOpcion,
    id_item: idItem,
    texto: 'Opción',
    orden: 1,
    es_correcta: true,
  };
  const mockOpcionModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const mockItemModel = { findById: vi.fn() };
  const mockRespuestaOpcionModel = { exists: vi.fn() };
  let service: OpcionesService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpcionesService,
        { provide: getModelToken(Opcion.name), useValue: mockOpcionModel },
        { provide: getModelToken(Item.name), useValue: mockItemModel },
        {
          provide: getModelToken(RespuestaOpcion.name),
          useValue: mockRespuestaOpcionModel,
        },
      ],
    }).compile();

    service = module.get<OpcionesService>(OpcionesService);
  });

  describe('create', () => {
    const dto: CreateOpcionDto = {
      texto: 'Opción',
      orden: 1,
      es_correcta: true,
      hipotesis_error: 'Confunde suma con resta',
    };

    it('creates an option for the item', async () => {
      mockItemModel.findById.mockReturnValue(conExec(itemSingle));
      mockOpcionModel.create.mockResolvedValue(opcion);

      await expect(service.create(idItem, dto)).resolves.toBe(opcion);
      expect(mockOpcionModel.create).toHaveBeenCalledWith({
        ...dto,
        id_item: idItem,
      });
    });

    it('rejects grupo in a single_choice item (400)', async () => {
      mockItemModel.findById.mockReturnValue(conExec(itemSingle));

      await expect(
        service.create(idItem, { ...dto, grupo: 'izquierda' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockOpcionModel.create).not.toHaveBeenCalled();
    });

    it('accepts grupo in a matching item', async () => {
      mockItemModel.findById.mockReturnValue(conExec(itemMatching));
      mockOpcionModel.create.mockResolvedValue(opcion);

      await expect(
        service.create(idItem, { ...dto, grupo: 'derecha' }),
      ).resolves.toBe(opcion);
    });

    it('throws 404 when the item does not exist', async () => {
      mockItemModel.findById.mockReturnValue(conExec(null));

      await expect(service.create(idItem, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  it('lists the options of an item sorted by orden', async () => {
    const sort = vi.fn().mockReturnValue(conExec([opcion]));
    mockItemModel.findById.mockReturnValue(conExec(itemSingle));
    mockOpcionModel.find.mockReturnValue({ sort });

    await expect(service.findByItem(idItem)).resolves.toEqual([opcion]);
    expect(mockOpcionModel.find).toHaveBeenCalledWith({ id_item: idItem });
    expect(sort).toHaveBeenCalledWith({ orden: 1 });
  });

  describe('update', () => {
    it('updates an option', async () => {
      mockOpcionModel.findById.mockReturnValue(conExec(opcion));
      mockOpcionModel.findByIdAndUpdate.mockReturnValue(conExec(opcion));

      await expect(service.update(idOpcion, { texto: 'Nuevo' })).resolves.toBe(
        opcion,
      );
      expect(mockOpcionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        idOpcion,
        { texto: 'Nuevo' },
        { new: true, runValidators: true },
      );
    });

    it('rejects adding grupo to an option of a non-matching item', async () => {
      mockOpcionModel.findById.mockReturnValue(conExec(opcion));
      mockItemModel.findById.mockReturnValue(conExec(itemSingle));

      await expect(
        service.update(idOpcion, { grupo: 'izquierda' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws 404 when the option does not exist', async () => {
      mockOpcionModel.findById.mockReturnValue(conExec(null));

      await expect(service.update(idOpcion, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes an option nobody chose', async () => {
      mockOpcionModel.findById.mockReturnValue(conExec(opcion));
      mockRespuestaOpcionModel.exists.mockResolvedValue(null);
      mockOpcionModel.findByIdAndDelete.mockReturnValue(conExec(opcion));

      await expect(service.remove(idOpcion)).resolves.toBe(opcion);
      expect(mockRespuestaOpcionModel.exists).toHaveBeenCalledWith({
        id_opcion: idOpcion,
      });
    });

    it('prevents removing an option chosen in respuestas_opciones (409)', async () => {
      mockOpcionModel.findById.mockReturnValue(conExec(opcion));
      mockRespuestaOpcionModel.exists.mockResolvedValue({ _id: 'eleccion' });

      await expect(service.remove(idOpcion)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockOpcionModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});

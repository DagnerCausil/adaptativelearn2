import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateOpcionDto } from './dto/create-opcion.dto.js';
import {
  ItemOpcionesController,
  OpcionesController,
} from './opciones.controller.js';
import { OpcionesService } from './opciones.service.js';

describe('Opciones controllers', () => {
  const idItem = new Types.ObjectId();
  const idOpcion = new Types.ObjectId();
  const opcion = { _id: idOpcion, texto: 'Opción' };
  const mockOpcionesService = {
    create: vi.fn(),
    findByItem: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
  let itemOpciones: ItemOpcionesController;
  let opciones: OpcionesController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemOpcionesController, OpcionesController],
      providers: [{ provide: OpcionesService, useValue: mockOpcionesService }],
    }).compile();

    itemOpciones = module.get(ItemOpcionesController);
    opciones = module.get(OpcionesController);
  });

  it('creates and lists options of an item', async () => {
    const dto: CreateOpcionDto = {
      texto: 'Opción',
      orden: 1,
      es_correcta: true,
    };
    mockOpcionesService.create.mockResolvedValue(opcion);
    mockOpcionesService.findByItem.mockResolvedValue([opcion]);

    await expect(itemOpciones.create(idItem, dto)).resolves.toBe(opcion);
    await expect(itemOpciones.findByItem(idItem)).resolves.toEqual([opcion]);
    expect(mockOpcionesService.create).toHaveBeenCalledWith(idItem, dto);
    expect(mockOpcionesService.findByItem).toHaveBeenCalledWith(idItem);
  });

  it('finds, updates and removes an option by ObjectId', async () => {
    mockOpcionesService.findOne.mockResolvedValue(opcion);
    mockOpcionesService.update.mockResolvedValue(opcion);
    mockOpcionesService.remove.mockResolvedValue(opcion);

    await expect(opciones.findOne(idOpcion)).resolves.toBe(opcion);
    await expect(opciones.update(idOpcion, { texto: 'Nuevo' })).resolves.toBe(
      opcion,
    );
    await expect(opciones.remove(idOpcion)).resolves.toBe(opcion);
    expect(mockOpcionesService.update).toHaveBeenCalledWith(idOpcion, {
      texto: 'Nuevo',
    });
  });
});

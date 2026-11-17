import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateItemDto } from './dto/create-item.dto.js';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';

describe('ItemsController', () => {
  const itemId = new Types.ObjectId();
  const item = { _id: itemId, enunciado: 'Ítem' };
  const mockItemsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    revisar: vi.fn(),
    remove: vi.fn(),
  };
  let controller: ItemsController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [{ provide: ItemsService, useValue: mockItemsService }],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
  });

  it('creates through the service', async () => {
    const dto: CreateItemDto = {
      id_experiencia_evidencia: new Types.ObjectId().toString(),
      enunciado: 'Ítem',
      formato: 'ordering',
      origen: 'ia',
    };
    mockItemsService.create.mockResolvedValue(item);

    await expect(controller.create(dto)).resolves.toBe(item);
    expect(mockItemsService.create).toHaveBeenCalledWith(dto);
  });

  it('lists with the optional filter', async () => {
    const filtro = {
      id_experiencia_evidencia: new Types.ObjectId().toString(),
    };
    mockItemsService.findAll.mockResolvedValue([item]);

    await expect(controller.findAll(filtro)).resolves.toEqual([item]);
    expect(mockItemsService.findAll).toHaveBeenCalledWith(filtro);
  });

  it('finds, updates, reviews and removes by ObjectId', async () => {
    mockItemsService.findOne.mockResolvedValue(item);
    mockItemsService.update.mockResolvedValue(item);
    mockItemsService.revisar.mockResolvedValue(item);
    mockItemsService.remove.mockResolvedValue(item);

    await expect(controller.findOne(itemId)).resolves.toBe(item);
    await expect(controller.update(itemId, { excluido: true })).resolves.toBe(
      item,
    );
    await expect(
      controller.revisar(itemId, { estado_revision: 'aprobado' }),
    ).resolves.toBe(item);
    await expect(controller.remove(itemId)).resolves.toBe(item);

    expect(mockItemsService.revisar).toHaveBeenCalledWith(itemId, {
      estado_revision: 'aprobado',
    });
    expect(mockItemsService.remove).toHaveBeenCalledWith(itemId);
  });
});

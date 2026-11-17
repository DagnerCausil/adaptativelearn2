import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateDbaDto } from './dto/create-dba.dto.js';
import { UpdateDbaDto } from './dto/update-dba.dto.js';
import { DbasController } from './dbas.controller.js';
import { DbasService } from './dbas.service.js';

describe('DbasController', () => {
  const dbaId = new Types.ObjectId();
  const dba = { _id: dbaId, codigo: 'DBA-PRUEBA' };
  const mockDbasService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    findEvidencias: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
  let controller: DbasController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DbasController],
      providers: [{ provide: DbasService, useValue: mockDbasService }],
    }).compile();

    controller = module.get<DbasController>(DbasController);
  });

  it('creates and lists through the service', async () => {
    const dto: CreateDbaDto = {
      codigo: 'DBA-PRUEBA',
      area: 'Área',
      grado: 3,
      enunciado: 'Enunciado',
    };
    mockDbasService.create.mockResolvedValue(dba);
    mockDbasService.findAll.mockResolvedValue([dba]);

    await expect(controller.create(dto)).resolves.toBe(dba);
    await expect(controller.findAll()).resolves.toEqual([dba]);
    expect(mockDbasService.create).toHaveBeenCalledWith(dto);
  });

  it('finds, lists evidencias, updates and removes by ObjectId', async () => {
    const updateDto: UpdateDbaDto = { area: 'Otra' };
    mockDbasService.findOne.mockResolvedValue(dba);
    mockDbasService.findEvidencias.mockResolvedValue([]);
    mockDbasService.update.mockResolvedValue(dba);
    mockDbasService.remove.mockResolvedValue(dba);

    await expect(controller.findOne(dbaId)).resolves.toBe(dba);
    await expect(controller.findEvidencias(dbaId)).resolves.toEqual([]);
    await expect(controller.update(dbaId, updateDto)).resolves.toBe(dba);
    await expect(controller.remove(dbaId)).resolves.toBe(dba);

    expect(mockDbasService.findEvidencias).toHaveBeenCalledWith(dbaId);
    expect(mockDbasService.update).toHaveBeenCalledWith(dbaId, updateDto);
    expect(mockDbasService.remove).toHaveBeenCalledWith(dbaId);
  });
});

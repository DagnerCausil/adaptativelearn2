import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateDictamenEvidenciaDto } from './dto/create-dictamen-evidencia.dto.js';
import { UpdateDictamenEvidenciaDto } from './dto/update-dictamen-evidencia.dto.js';
import { DictamenesEvidenciaController } from './dictamenes-evidencia.controller.js';
import { DictamenesEvidenciaService } from './dictamenes-evidencia.service.js';

describe('DictamenesEvidenciaController', () => {
  const dictamenId = new Types.ObjectId();
  const dictamen = { _id: dictamenId, aplica_formato_cerrado: true };
  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
  let controller: DictamenesEvidenciaController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DictamenesEvidenciaController],
      providers: [
        { provide: DictamenesEvidenciaService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<DictamenesEvidenciaController>(
      DictamenesEvidenciaController,
    );
  });

  it('creates and lists through the service', async () => {
    const dto: CreateDictamenEvidenciaDto = {
      id_evidencia: new Types.ObjectId().toString(),
      aplica_formato_cerrado: true,
    };
    mockService.create.mockResolvedValue(dictamen);
    mockService.findAll.mockResolvedValue([dictamen]);

    await expect(controller.create(dto)).resolves.toBe(dictamen);
    await expect(controller.findAll()).resolves.toEqual([dictamen]);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('finds, updates and removes by ObjectId', async () => {
    const updateDto: UpdateDictamenEvidenciaDto = {
      aplica_formato_cerrado: false,
    };
    mockService.findOne.mockResolvedValue(dictamen);
    mockService.update.mockResolvedValue(dictamen);
    mockService.remove.mockResolvedValue(dictamen);

    await expect(controller.findOne(dictamenId)).resolves.toBe(dictamen);
    await expect(controller.update(dictamenId, updateDto)).resolves.toBe(
      dictamen,
    );
    await expect(controller.remove(dictamenId)).resolves.toBe(dictamen);

    expect(mockService.update).toHaveBeenCalledWith(dictamenId, updateDto);
    expect(mockService.remove).toHaveBeenCalledWith(dictamenId);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto.js';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto.js';
import { EvidenciasController } from './evidencias.controller.js';
import { EvidenciasService } from './evidencias.service.js';

describe('EvidenciasController', () => {
  const evidenciaId = new Types.ObjectId();
  const evidencia = { _id: evidenciaId, numero: 1 };
  const mockEvidenciasService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
  let controller: EvidenciasController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvidenciasController],
      providers: [
        { provide: EvidenciasService, useValue: mockEvidenciasService },
      ],
    }).compile();

    controller = module.get<EvidenciasController>(EvidenciasController);
  });

  it('creates and lists through the service', async () => {
    const dto: CreateEvidenciaDto = {
      id_dba: new Types.ObjectId().toString(),
      numero: 1,
      enunciado: 'Evidencia',
    };
    mockEvidenciasService.create.mockResolvedValue(evidencia);
    mockEvidenciasService.findAll.mockResolvedValue([evidencia]);

    await expect(controller.create(dto)).resolves.toBe(evidencia);
    await expect(controller.findAll()).resolves.toEqual([evidencia]);
    expect(mockEvidenciasService.create).toHaveBeenCalledWith(dto);
  });

  it('finds, updates and removes by ObjectId', async () => {
    const updateDto: UpdateEvidenciaDto = { enunciado: 'Nuevo' };
    mockEvidenciasService.findOne.mockResolvedValue(evidencia);
    mockEvidenciasService.update.mockResolvedValue(evidencia);
    mockEvidenciasService.remove.mockResolvedValue(evidencia);

    await expect(controller.findOne(evidenciaId)).resolves.toBe(evidencia);
    await expect(controller.update(evidenciaId, updateDto)).resolves.toBe(
      evidencia,
    );
    await expect(controller.remove(evidenciaId)).resolves.toBe(evidencia);

    expect(mockEvidenciasService.update).toHaveBeenCalledWith(
      evidenciaId,
      updateDto,
    );
    expect(mockEvidenciasService.remove).toHaveBeenCalledWith(evidenciaId);
  });
});

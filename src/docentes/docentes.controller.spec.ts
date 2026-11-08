import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateDocenteDto } from './dto/create-docente.dto.js';
import { UpdateDocenteDto } from './dto/update-docente.dto.js';
import { DocentesController } from './docentes.controller.js';
import { DocentesService } from './docentes.service.js';

describe('DocentesController', () => {
  const docenteId = new Types.ObjectId();
  const docente = { _id: docenteId, nombre: 'Docente' };
  const mockDocentesService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
  let controller: DocentesController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocentesController],
      providers: [
        { provide: DocentesService, useValue: mockDocentesService },
      ],
    }).compile();

    controller = module.get<DocentesController>(DocentesController);
  });

  it('creates through the service', async () => {
    const dto: CreateDocenteDto = {
      nombre: 'Docente',
      correo: 'docente@example.com',
    };
    mockDocentesService.create.mockResolvedValue(docente);

    await expect(controller.create(dto)).resolves.toBe(docente);
    expect(mockDocentesService.create).toHaveBeenCalledWith(dto);
  });

  it('lists docentes through the service', async () => {
    mockDocentesService.findAll.mockResolvedValue([docente]);

    await expect(controller.findAll()).resolves.toEqual([docente]);
  });

  it('finds, updates and removes by ObjectId', async () => {
    const updateDto: UpdateDocenteDto = { nombre: 'Actualizado' };
    mockDocentesService.findOne.mockResolvedValue(docente);
    mockDocentesService.update.mockResolvedValue(docente);
    mockDocentesService.remove.mockResolvedValue(docente);

    await expect(controller.findOne(docenteId)).resolves.toBe(docente);
    await expect(controller.update(docenteId, updateDto)).resolves.toBe(docente);
    await expect(controller.remove(docenteId)).resolves.toBe(docente);

    expect(mockDocentesService.findOne).toHaveBeenCalledWith(docenteId);
    expect(mockDocentesService.update).toHaveBeenCalledWith(
      docenteId,
      updateDto,
    );
    expect(mockDocentesService.remove).toHaveBeenCalledWith(docenteId);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateEstudianteDto } from './dto/create-estudiante.dto.js';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto.js';
import { EstudiantesController } from './estudiantes.controller.js';
import { EstudiantesService } from './estudiantes.service.js';

describe('EstudiantesController', () => {
  const estudianteId = new Types.ObjectId();
  const estudiante = { _id: estudianteId, nombre: 'Estudiante' };
  const mockEstudiantesService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
  let controller: EstudiantesController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstudiantesController],
      providers: [
        { provide: EstudiantesService, useValue: mockEstudiantesService },
      ],
    }).compile();

    controller = module.get<EstudiantesController>(EstudiantesController);
  });

  it('creates through the service', async () => {
    const dto: CreateEstudianteDto = {
      nombre: 'Estudiante',
      correo: 'estudiante@example.com',
    };
    mockEstudiantesService.create.mockResolvedValue(estudiante);

    await expect(controller.create(dto)).resolves.toBe(estudiante);
    expect(mockEstudiantesService.create).toHaveBeenCalledWith(dto);
  });

  it('lists estudiantes through the service', async () => {
    mockEstudiantesService.findAll.mockResolvedValue([estudiante]);

    await expect(controller.findAll()).resolves.toEqual([estudiante]);
  });

  it('finds, updates and removes by ObjectId', async () => {
    const updateDto: UpdateEstudianteDto = { nombre: 'Actualizado' };
    mockEstudiantesService.findOne.mockResolvedValue(estudiante);
    mockEstudiantesService.update.mockResolvedValue(estudiante);
    mockEstudiantesService.remove.mockResolvedValue(estudiante);

    await expect(controller.findOne(estudianteId)).resolves.toBe(estudiante);
    await expect(
      controller.update(estudianteId, updateDto),
    ).resolves.toBe(estudiante);
    await expect(controller.remove(estudianteId)).resolves.toBe(estudiante);

    expect(mockEstudiantesService.findOne).toHaveBeenCalledWith(estudianteId);
    expect(mockEstudiantesService.update).toHaveBeenCalledWith(
      estudianteId,
      updateDto,
    );
    expect(mockEstudiantesService.remove).toHaveBeenCalledWith(estudianteId);
  });
});

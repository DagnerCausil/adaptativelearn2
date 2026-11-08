import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Inscripcion } from '../inscripciones/schemas/inscripcion.schema.js';
import { CreateEstudianteDto } from './dto/create-estudiante.dto.js';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto.js';
import { Estudiante } from './schemas/estudiante.schema.js';
import { EstudiantesService } from './estudiantes.service.js';

describe('EstudiantesService', () => {
  const id = new Types.ObjectId('507f1f77bcf86cd799439011');
  const estudiante = {
    _id: id,
    nombre: 'Estudiante',
    correo: 'estudiante@example.com',
  };
  const mockEstudianteModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const mockInscripcionModel = {
    exists: vi.fn(),
  };
  let service: EstudiantesService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstudiantesService,
        {
          provide: getModelToken(Estudiante.name),
          useValue: mockEstudianteModel,
        },
        {
          provide: getModelToken(Inscripcion.name),
          useValue: mockInscripcionModel,
        },
      ],
    }).compile();

    service = module.get<EstudiantesService>(EstudiantesService);
  });

  it('creates an estudiante', async () => {
    const dto: CreateEstudianteDto = {
      nombre: 'Estudiante',
      correo: 'estudiante@example.com',
    };
    mockEstudianteModel.create.mockResolvedValue(estudiante);

    await expect(service.create(dto)).resolves.toBe(estudiante);
    expect(mockEstudianteModel.create).toHaveBeenCalledWith(dto);
  });

  it('rejects duplicate email on create', async () => {
    mockEstudianteModel.create.mockRejectedValue({ code: 11000 });

    await expect(
      service.create({
        nombre: 'Estudiante',
        correo: 'repetido@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns all estudiantes', async () => {
    mockEstudianteModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([estudiante]),
    });

    await expect(service.findAll()).resolves.toEqual([estudiante]);
  });

  it('finds one estudiante by id', async () => {
    mockEstudianteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(estudiante),
    });

    await expect(service.findOne(id)).resolves.toBe(estudiante);
    expect(mockEstudianteModel.findById).toHaveBeenCalledWith(id);
  });

  it('throws when the estudiante does not exist on findOne', async () => {
    mockEstudianteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.findOne(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an estudiante', async () => {
    const dto: UpdateEstudianteDto = { nombre: 'Nombre actualizado' };
    mockEstudianteModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(estudiante),
    });

    await expect(service.update(id, dto)).resolves.toBe(estudiante);
    expect(mockEstudianteModel.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      dto,
      { new: true, runValidators: true },
    );
  });

  it('throws when the estudiante does not exist on update', async () => {
    mockEstudianteModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.update(id, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects duplicate email on update', async () => {
    mockEstudianteModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockRejectedValue({ code: 11000 }),
    });

    await expect(
      service.update(id, { correo: 'repetido@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('removes an estudiante with no related inscripciones', async () => {
    mockEstudianteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(estudiante),
    });
    mockInscripcionModel.exists.mockResolvedValue(null);
    mockEstudianteModel.findByIdAndDelete.mockReturnValue({
      exec: vi.fn().mockResolvedValue(estudiante),
    });

    await expect(service.remove(id)).resolves.toBe(estudiante);
    expect(mockInscripcionModel.exists).toHaveBeenCalledWith({
      id_estudiante: id,
    });
    expect(mockEstudianteModel.findByIdAndDelete).toHaveBeenCalledWith(id);
  });

  it('throws when the estudiante does not exist on remove', async () => {
    mockEstudianteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.remove(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents removing an estudiante with related inscripciones', async () => {
    mockEstudianteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(estudiante),
    });
    mockInscripcionModel.exists.mockResolvedValue({ _id: 'inscripcion-id' });

    await expect(service.remove(id)).rejects.toBeInstanceOf(ConflictException);
    expect(mockEstudianteModel.findByIdAndDelete).not.toHaveBeenCalled();
  });
});

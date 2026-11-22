import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Estudiante } from '../estudiantes/schemas/estudiante.schema.js';
import { Experiencia } from '../experiencias/schemas/experiencia.schema.js';
import { Presentacion } from '../presentaciones/schemas/presentacion.schema.js';
import { InscripcionesService } from './inscripciones.service.js';
import { Inscripcion } from './schemas/inscripcion.schema.js';

describe('InscripcionesService', () => {
  const idEstudiante = new Types.ObjectId();
  const idExperiencia = new Types.ObjectId();
  const idInscripcion = new Types.ObjectId();
  const dto = {
    id_estudiante: idEstudiante.toHexString(),
    codigo_invitacion: 'k7m3qx9p',
  };
  const inscripcion = {
    _id: idInscripcion,
    id_estudiante: idEstudiante,
    id_experiencia: idExperiencia,
  };
  const mockInscripcionModel = {
    create: vi.fn(),
    exists: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const mockEstudianteModel = { exists: vi.fn() };
  const mockExperienciaModel = { findOne: vi.fn() };
  const mockPresentacionModel = { exists: vi.fn() };
  let service: InscripcionesService;

  const experienciaCon = (estado: string) => ({
    exec: vi.fn().mockResolvedValue({ _id: idExperiencia, estado }),
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InscripcionesService,
        {
          provide: getModelToken(Inscripcion.name),
          useValue: mockInscripcionModel,
        },
        {
          provide: getModelToken(Estudiante.name),
          useValue: mockEstudianteModel,
        },
        {
          provide: getModelToken(Experiencia.name),
          useValue: mockExperienciaModel,
        },
        {
          provide: getModelToken(Presentacion.name),
          useValue: mockPresentacionModel,
        },
      ],
    }).compile();

    service = module.get<InscripcionesService>(InscripcionesService);
  });

  it('inscribe al estudiante en una experiencia publicada', async () => {
    mockEstudianteModel.exists.mockResolvedValue({ _id: idEstudiante });
    mockExperienciaModel.findOne.mockReturnValue(experienciaCon('publicada'));
    mockInscripcionModel.exists.mockResolvedValue(null);
    mockInscripcionModel.create.mockResolvedValue(inscripcion);

    await expect(service.unirse(dto)).resolves.toBe(inscripcion);
    expect(mockExperienciaModel.findOne).toHaveBeenCalledWith({
      codigo_invitacion: 'K7M3QX9P',
    });
    expect(mockInscripcionModel.create).toHaveBeenCalledWith({
      id_estudiante: idEstudiante,
      id_experiencia: idExperiencia,
    });
  });

  it('da 404 si el estudiante no existe', async () => {
    mockEstudianteModel.exists.mockResolvedValue(null);

    await expect(service.unirse(dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('da 404 si el código de invitación no existe', async () => {
    mockEstudianteModel.exists.mockResolvedValue({ _id: idEstudiante });
    mockExperienciaModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.unirse(dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('da 400 si la experiencia está en borrador', async () => {
    mockEstudianteModel.exists.mockResolvedValue({ _id: idEstudiante });
    mockExperienciaModel.findOne.mockReturnValue(experienciaCon('borrador'));

    await expect(service.unirse(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockInscripcionModel.create).not.toHaveBeenCalled();
  });

  it('da 409 si el estudiante ya estaba inscrito', async () => {
    mockEstudianteModel.exists.mockResolvedValue({ _id: idEstudiante });
    mockExperienciaModel.findOne.mockReturnValue(experienciaCon('publicada'));
    mockInscripcionModel.exists.mockResolvedValue({ _id: idInscripcion });

    await expect(service.unirse(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('da 409 si el índice único rechaza la inscripción', async () => {
    mockEstudianteModel.exists.mockResolvedValue({ _id: idEstudiante });
    mockExperienciaModel.findOne.mockReturnValue(experienciaCon('publicada'));
    mockInscripcionModel.exists.mockResolvedValue(null);
    mockInscripcionModel.create.mockRejectedValue({ code: 11000 });

    await expect(service.unirse(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('filtra por estudiante y experiencia', async () => {
    mockInscripcionModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([inscripcion]),
    });

    await expect(
      service.findAll({
        id_estudiante: idEstudiante.toHexString(),
        id_experiencia: idExperiencia.toHexString(),
      }),
    ).resolves.toEqual([inscripcion]);
    expect(mockInscripcionModel.find).toHaveBeenCalledWith({
      id_estudiante: idEstudiante,
      id_experiencia: idExperiencia,
    });
  });

  it('da 404 si la inscripción no existe', async () => {
    mockInscripcionModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.findOne(idInscripcion)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('no borra una inscripción con presentaciones (409)', async () => {
    mockInscripcionModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(inscripcion),
    });
    mockPresentacionModel.exists.mockResolvedValue({
      _id: new Types.ObjectId(),
    });

    await expect(service.remove(idInscripcion)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mockInscripcionModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('borra una inscripción sin presentaciones', async () => {
    mockInscripcionModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(inscripcion),
    });
    mockPresentacionModel.exists.mockResolvedValue(null);
    mockInscripcionModel.findByIdAndDelete.mockReturnValue({
      exec: vi.fn().mockResolvedValue(inscripcion),
    });

    await expect(service.remove(idInscripcion)).resolves.toBe(inscripcion);
  });
});

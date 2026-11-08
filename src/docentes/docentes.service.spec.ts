import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Experiencia } from '../experiencias/schemas/experiencia.schema.js';
import { CreateDocenteDto } from './dto/create-docente.dto.js';
import { UpdateDocenteDto } from './dto/update-docente.dto.js';
import { Docente } from './schemas/docente.schema.js';
import { DocentesService } from './docentes.service.js';

describe('DocentesService', () => {
  const id = new Types.ObjectId('507f1f77bcf86cd799439011');
  const docente = {
    _id: id,
    nombre: 'Docente',
    correo: 'docente@example.com',
  };
  const mockDocenteModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const mockExperienciaModel = {
    exists: vi.fn(),
  };
  let service: DocentesService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocentesService,
        {
          provide: getModelToken(Docente.name),
          useValue: mockDocenteModel,
        },
        {
          provide: getModelToken(Experiencia.name),
          useValue: mockExperienciaModel,
        },
      ],
    }).compile();

    service = module.get<DocentesService>(DocentesService);
  });

  it('creates a docente', async () => {
    const dto: CreateDocenteDto = {
      nombre: 'Docente',
      correo: 'docente@example.com',
    };
    mockDocenteModel.create.mockResolvedValue(docente);

    await expect(service.create(dto)).resolves.toBe(docente);
    expect(mockDocenteModel.create).toHaveBeenCalledWith(dto);
  });

  it('rejects duplicate email on create', async () => {
    mockDocenteModel.create.mockRejectedValue({ code: 11000 });

    await expect(
      service.create({ nombre: 'Docente', correo: 'repetido@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns all docentes', async () => {
    mockDocenteModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([docente]),
    });

    await expect(service.findAll()).resolves.toEqual([docente]);
  });

  it('finds one docente by id', async () => {
    mockDocenteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(docente),
    });

    await expect(service.findOne(id)).resolves.toBe(docente);
    expect(mockDocenteModel.findById).toHaveBeenCalledWith(id);
  });

  it('throws when the docente does not exist on findOne', async () => {
    mockDocenteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.findOne(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a docente', async () => {
    const dto: UpdateDocenteDto = { nombre: 'Nombre actualizado' };
    mockDocenteModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(docente),
    });

    await expect(service.update(id, dto)).resolves.toBe(docente);
    expect(mockDocenteModel.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      dto,
      { new: true, runValidators: true },
    );
  });

  it('throws when the docente does not exist on update', async () => {
    mockDocenteModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.update(id, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects duplicate email on update', async () => {
    mockDocenteModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockRejectedValue({ code: 11000 }),
    });

    await expect(
      service.update(id, { correo: 'repetido@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('removes a docente with no related experiences', async () => {
    mockDocenteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(docente),
    });
    mockExperienciaModel.exists.mockResolvedValue(null);
    mockDocenteModel.findByIdAndDelete.mockReturnValue({
      exec: vi.fn().mockResolvedValue(docente),
    });

    await expect(service.remove(id)).resolves.toBe(docente);
    expect(mockExperienciaModel.exists).toHaveBeenCalledWith({
      id_docente: id,
    });
    expect(mockDocenteModel.findByIdAndDelete).toHaveBeenCalledWith(id);
  });

  it('throws when the docente does not exist on remove', async () => {
    mockDocenteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.remove(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents removing a docente with related experiences', async () => {
    mockDocenteModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(docente),
    });
    mockExperienciaModel.exists.mockResolvedValue({ _id: 'experiencia-id' });

    await expect(service.remove(id)).rejects.toBeInstanceOf(ConflictException);
    expect(mockDocenteModel.findByIdAndDelete).not.toHaveBeenCalled();
  });
});

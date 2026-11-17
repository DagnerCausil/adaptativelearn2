import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Evidencia } from '../evidencias/schemas/evidencia.schema.js';
import { Experiencia } from '../experiencias/schemas/experiencia.schema.js';
import { CreateDbaDto } from './dto/create-dba.dto.js';
import { Dba } from './schemas/dba.schema.js';
import { DbasService } from './dbas.service.js';

describe('DbasService', () => {
  const id = new Types.ObjectId('507f1f77bcf86cd799439011');
  const dto: CreateDbaDto = {
    codigo: 'DBA-PRUEBA',
    area: 'Área',
    grado: 3,
    enunciado: 'Enunciado',
  };
  const dba = { _id: id, ...dto };
  const mockDbaModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const mockEvidenciaModel = { find: vi.fn(), exists: vi.fn() };
  const mockExperienciaModel = { exists: vi.fn() };
  let service: DbasService;

  const dbaEncontrado = (valor: unknown) =>
    mockDbaModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(valor),
    });

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbasService,
        { provide: getModelToken(Dba.name), useValue: mockDbaModel },
        {
          provide: getModelToken(Evidencia.name),
          useValue: mockEvidenciaModel,
        },
        {
          provide: getModelToken(Experiencia.name),
          useValue: mockExperienciaModel,
        },
      ],
    }).compile();

    service = module.get<DbasService>(DbasService);
  });

  it('creates a DBA', async () => {
    mockDbaModel.create.mockResolvedValue(dba);

    await expect(service.create(dto)).resolves.toBe(dba);
    expect(mockDbaModel.create).toHaveBeenCalledWith(dto);
  });

  it('rejects a duplicated codigo on create with 409', async () => {
    mockDbaModel.create.mockRejectedValue({ code: 11000 });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists DBA sorted by codigo', async () => {
    const sort = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([dba]),
    });
    mockDbaModel.find.mockReturnValue({ sort });

    await expect(service.findAll()).resolves.toEqual([dba]);
    expect(sort).toHaveBeenCalledWith({ codigo: 1 });
  });

  it('finds one DBA or throws 404', async () => {
    dbaEncontrado(dba);
    await expect(service.findOne(id)).resolves.toBe(dba);

    dbaEncontrado(null);
    await expect(service.findOne(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists the evidencias of a DBA sorted by numero', async () => {
    const evidencias = [{ numero: 1 }, { numero: 2 }];
    const sort = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(evidencias),
    });
    dbaEncontrado(dba);
    mockEvidenciaModel.find.mockReturnValue({ sort });

    await expect(service.findEvidencias(id)).resolves.toBe(evidencias);
    expect(mockEvidenciaModel.find).toHaveBeenCalledWith({ id_dba: id });
    expect(sort).toHaveBeenCalledWith({ numero: 1 });
  });

  it('throws 404 when listing evidencias of a missing DBA', async () => {
    dbaEncontrado(null);

    await expect(service.findEvidencias(id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mockEvidenciaModel.find).not.toHaveBeenCalled();
  });

  it('updates a DBA', async () => {
    mockDbaModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(dba),
    });

    await expect(service.update(id, { area: 'Otra' })).resolves.toBe(dba);
    expect(mockDbaModel.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      { area: 'Otra' },
      { new: true, runValidators: true },
    );
  });

  it('throws 404 or 409 on update', async () => {
    mockDbaModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });
    await expect(service.update(id, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );

    mockDbaModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockRejectedValue({ code: 11000 }),
    });
    await expect(
      service.update(id, { codigo: 'REPETIDO' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('removes a DBA without evidencias or experiencias', async () => {
    dbaEncontrado(dba);
    mockEvidenciaModel.exists.mockResolvedValue(null);
    mockExperienciaModel.exists.mockResolvedValue(null);
    mockDbaModel.findByIdAndDelete.mockReturnValue({
      exec: vi.fn().mockResolvedValue(dba),
    });

    await expect(service.remove(id)).resolves.toBe(dba);
    expect(mockEvidenciaModel.exists).toHaveBeenCalledWith({ id_dba: id });
    expect(mockExperienciaModel.exists).toHaveBeenCalledWith({ id_dba: id });
    expect(mockDbaModel.findByIdAndDelete).toHaveBeenCalledWith(id);
  });

  it('throws 404 when removing a missing DBA', async () => {
    dbaEncontrado(null);

    await expect(service.remove(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents removing a DBA with evidencias (409)', async () => {
    dbaEncontrado(dba);
    mockEvidenciaModel.exists.mockResolvedValue({ _id: 'evidencia' });

    await expect(service.remove(id)).rejects.toBeInstanceOf(ConflictException);
    expect(mockDbaModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('prevents removing a DBA with experiencias (409)', async () => {
    dbaEncontrado(dba);
    mockEvidenciaModel.exists.mockResolvedValue(null);
    mockExperienciaModel.exists.mockResolvedValue({ _id: 'experiencia' });

    await expect(service.remove(id)).rejects.toBeInstanceOf(ConflictException);
    expect(mockDbaModel.findByIdAndDelete).not.toHaveBeenCalled();
  });
});

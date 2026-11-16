import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Dba } from '../dbas/schemas/dba.schema.js';
import { DictamenEvidencia } from '../dictamenes_evidencia/schemas/dictamen-evidencia.schema.js';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto.js';
import { Evidencia } from './schemas/evidencia.schema.js';
import { EvidenciasService } from './evidencias.service.js';

describe('EvidenciasService', () => {
  const id = new Types.ObjectId('507f1f77bcf86cd799439011');
  const idDba = new Types.ObjectId('507f1f77bcf86cd799439022');
  const dto: CreateEvidenciaDto = {
    id_dba: idDba.toString(),
    numero: 1,
    enunciado: 'Evidencia',
  };
  const evidencia = {
    _id: id,
    id_dba: idDba,
    numero: 1,
    enunciado: 'Evidencia',
  };
  const mockEvidenciaModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const mockDbaModel = { exists: vi.fn() };
  const mockDictamenModel = { exists: vi.fn() };
  const mockExperienciaEvidenciaModel = { exists: vi.fn() };
  let service: EvidenciasService;

  const evidenciaEncontrada = (valor: unknown) =>
    mockEvidenciaModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(valor),
    });

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenciasService,
        {
          provide: getModelToken(Evidencia.name),
          useValue: mockEvidenciaModel,
        },
        { provide: getModelToken(Dba.name), useValue: mockDbaModel },
        {
          provide: getModelToken(DictamenEvidencia.name),
          useValue: mockDictamenModel,
        },
        {
          provide: getModelToken(ExperienciaEvidencia.name),
          useValue: mockExperienciaEvidenciaModel,
        },
      ],
    }).compile();

    service = module.get<EvidenciasService>(EvidenciasService);
  });

  it('creates an evidencia when the DBA exists', async () => {
    mockDbaModel.exists.mockResolvedValue({ _id: idDba });
    mockEvidenciaModel.create.mockResolvedValue(evidencia);

    await expect(service.create(dto)).resolves.toBe(evidencia);
    expect(mockDbaModel.exists).toHaveBeenCalledWith({ _id: idDba });
    expect(mockEvidenciaModel.create).toHaveBeenCalledWith({
      ...dto,
      id_dba: idDba,
    });
  });

  it('throws 404 when the DBA does not exist', async () => {
    mockDbaModel.exists.mockResolvedValue(null);

    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(mockEvidenciaModel.create).not.toHaveBeenCalled();
  });

  it('throws 409 when { id_dba, numero } is repeated', async () => {
    mockDbaModel.exists.mockResolvedValue({ _id: idDba });
    mockEvidenciaModel.create.mockRejectedValue({ code: 11000 });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists evidencias and finds one or throws 404', async () => {
    mockEvidenciaModel.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([evidencia]),
      }),
    });
    await expect(service.findAll()).resolves.toEqual([evidencia]);

    evidenciaEncontrada(evidencia);
    await expect(service.findOne(id)).resolves.toBe(evidencia);

    evidenciaEncontrada(null);
    await expect(service.findOne(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an evidencia', async () => {
    mockEvidenciaModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(evidencia),
    });

    await expect(service.update(id, { enunciado: 'Nuevo' })).resolves.toBe(
      evidencia,
    );
    expect(mockDbaModel.exists).not.toHaveBeenCalled();
    expect(mockEvidenciaModel.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      { enunciado: 'Nuevo' },
      { new: true, runValidators: true },
    );
  });

  it('checks the new DBA when id_dba changes on update', async () => {
    mockDbaModel.exists.mockResolvedValue(null);

    await expect(
      service.update(id, { id_dba: idDba.toString() }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mockEvidenciaModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('throws 404 or 409 on update', async () => {
    mockEvidenciaModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });
    await expect(service.update(id, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );

    mockEvidenciaModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockRejectedValue({ code: 11000 }),
    });
    await expect(service.update(id, { numero: 2 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('removes an evidencia without dictamen or selection', async () => {
    evidenciaEncontrada(evidencia);
    mockDictamenModel.exists.mockResolvedValue(null);
    mockExperienciaEvidenciaModel.exists.mockResolvedValue(null);
    mockEvidenciaModel.findByIdAndDelete.mockReturnValue({
      exec: vi.fn().mockResolvedValue(evidencia),
    });

    await expect(service.remove(id)).resolves.toBe(evidencia);
    expect(mockDictamenModel.exists).toHaveBeenCalledWith({ id_evidencia: id });
    expect(mockExperienciaEvidenciaModel.exists).toHaveBeenCalledWith({
      id_evidencia: id,
    });
  });

  it('throws 404 when removing a missing evidencia', async () => {
    evidenciaEncontrada(null);

    await expect(service.remove(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents removing an evidencia with dictamen (409)', async () => {
    evidenciaEncontrada(evidencia);
    mockDictamenModel.exists.mockResolvedValue({ _id: 'dictamen' });

    await expect(service.remove(id)).rejects.toBeInstanceOf(ConflictException);
    expect(mockEvidenciaModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('prevents removing an evidencia selected in experiencias (409)', async () => {
    evidenciaEncontrada(evidencia);
    mockDictamenModel.exists.mockResolvedValue(null);
    mockExperienciaEvidenciaModel.exists.mockResolvedValue({ _id: 'sel' });

    await expect(service.remove(id)).rejects.toBeInstanceOf(ConflictException);
    expect(mockEvidenciaModel.findByIdAndDelete).not.toHaveBeenCalled();
  });
});

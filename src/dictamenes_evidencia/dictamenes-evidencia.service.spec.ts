import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Evidencia } from '../evidencias/schemas/evidencia.schema.js';
import { CreateDictamenEvidenciaDto } from './dto/create-dictamen-evidencia.dto.js';
import { DictamenEvidencia } from './schemas/dictamen-evidencia.schema.js';
import { DictamenesEvidenciaService } from './dictamenes-evidencia.service.js';

describe('DictamenesEvidenciaService', () => {
  const id = new Types.ObjectId('507f1f77bcf86cd799439011');
  const idEvidencia = new Types.ObjectId('507f1f77bcf86cd799439033');
  const dto: CreateDictamenEvidenciaDto = {
    id_evidencia: idEvidencia.toString(),
    aplica_formato_cerrado: true,
    justificacion: 'Se puede observar con pregunta cerrada.',
  };
  const dictamen = { _id: id, ...dto, fecha_dictamen: new Date() };
  const mockDictamenModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const mockEvidenciaModel = { exists: vi.fn() };
  let service: DictamenesEvidenciaService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DictamenesEvidenciaService,
        {
          provide: getModelToken(DictamenEvidencia.name),
          useValue: mockDictamenModel,
        },
        {
          provide: getModelToken(Evidencia.name),
          useValue: mockEvidenciaModel,
        },
      ],
    }).compile();

    service = module.get<DictamenesEvidenciaService>(
      DictamenesEvidenciaService,
    );
  });

  it('creates a dictamen with a server-side fecha_dictamen', async () => {
    mockEvidenciaModel.exists.mockResolvedValue({ _id: idEvidencia });
    mockDictamenModel.create.mockResolvedValue(dictamen);

    await expect(service.create(dto)).resolves.toBe(dictamen);
    expect(mockEvidenciaModel.exists).toHaveBeenCalledWith({
      _id: idEvidencia,
    });
    expect(mockDictamenModel.create).toHaveBeenCalledWith({
      ...dto,
      id_evidencia: idEvidencia,
      fecha_dictamen: expect.any(Date),
    });
  });

  it('throws 404 when the evidencia does not exist', async () => {
    mockEvidenciaModel.exists.mockResolvedValue(null);

    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(mockDictamenModel.create).not.toHaveBeenCalled();
  });

  it('throws 409 when the evidencia already has a dictamen', async () => {
    mockEvidenciaModel.exists.mockResolvedValue({ _id: idEvidencia });
    mockDictamenModel.create.mockRejectedValue({ code: 11000 });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists dictamenes and finds one or throws 404', async () => {
    mockDictamenModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([dictamen]),
    });
    await expect(service.findAll()).resolves.toEqual([dictamen]);

    mockDictamenModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(dictamen),
    });
    await expect(service.findOne(id)).resolves.toBe(dictamen);

    mockDictamenModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });
    await expect(service.findOne(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a dictamen and renews fecha_dictamen', async () => {
    mockDictamenModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(dictamen),
    });

    await expect(
      service.update(id, { aplica_formato_cerrado: false }),
    ).resolves.toBe(dictamen);
    expect(mockDictamenModel.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      { aplica_formato_cerrado: false, fecha_dictamen: expect.any(Date) },
      { new: true, runValidators: true },
    );
  });

  it('throws 404 on update and remove of a missing dictamen', async () => {
    mockDictamenModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });
    mockDictamenModel.findByIdAndDelete.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.update(id, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a dictamen', async () => {
    mockDictamenModel.findByIdAndDelete.mockReturnValue({
      exec: vi.fn().mockResolvedValue(dictamen),
    });

    await expect(service.remove(id)).resolves.toBe(dictamen);
    expect(mockDictamenModel.findByIdAndDelete).toHaveBeenCalledWith(id);
  });
});

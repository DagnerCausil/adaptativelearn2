import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Evidencia } from '../evidencias/schemas/evidencia.schema.js';
import { Experiencia } from '../experiencias/schemas/experiencia.schema.js';
import { ExperienciasEvidenciasService } from './experiencias-evidencias.service.js';
import { ExperienciaEvidencia } from './schemas/experiencia-evidencia.schema.js';

describe('ExperienciasEvidenciasService', () => {
  const idExperiencia = new Types.ObjectId();
  const idDba = new Types.ObjectId();
  const otroDba = new Types.ObjectId();
  const idEvidencia = new Types.ObjectId();
  const idSeleccion = new Types.ObjectId();

  const mockSeleccionModel = {
    create: vi.fn(),
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  };
  const mockExperienciaModel = { findById: vi.fn() };
  const mockEvidenciaModel = { findById: vi.fn() };
  let service: ExperienciasEvidenciasService;

  function experienciaExiste(
    existe = true,
    estado: 'borrador' | 'publicada' = 'borrador',
  ) {
    mockExperienciaModel.findById.mockReturnValue({
      exec: vi
        .fn()
        .mockResolvedValue(
          existe ? { _id: idExperiencia, id_dba: idDba, estado } : null,
        ),
    });
  }

  function evidenciaDelDba(dba: Types.ObjectId | null) {
    mockEvidenciaModel.findById.mockReturnValue({
      exec: vi
        .fn()
        .mockResolvedValue(dba ? { _id: idEvidencia, id_dba: dba } : null),
    });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperienciasEvidenciasService,
        {
          provide: getModelToken(ExperienciaEvidencia.name),
          useValue: mockSeleccionModel,
        },
        { provide: getModelToken(Experiencia.name), useValue: mockExperienciaModel },
        { provide: getModelToken(Evidencia.name), useValue: mockEvidenciaModel },
      ],
    }).compile();

    service = module.get(ExperienciasEvidenciasService);
  });

  describe('seleccionar', () => {
    const dto = { id_evidencia: idEvidencia.toHexString() };

    it('selecciona una evidencia del mismo DBA, incluida por defecto', async () => {
      experienciaExiste();
      evidenciaDelDba(idDba);
      mockSeleccionModel.create.mockImplementation((data: unknown) =>
        Promise.resolve(data),
      );

      await service.seleccionar(idExperiencia, dto);

      expect(mockSeleccionModel.create).toHaveBeenCalledWith({
        id_experiencia: idExperiencia,
        id_evidencia: idEvidencia,
        incluida: true,
      });
    });

    it('400 si la evidencia es de otro DBA', async () => {
      experienciaExiste();
      evidenciaDelDba(otroDba);

      await expect(service.seleccionar(idExperiencia, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockSeleccionModel.create).not.toHaveBeenCalled();
    });

    it('404 si la experiencia no existe', async () => {
      experienciaExiste(false);

      await expect(service.seleccionar(idExperiencia, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('404 si la evidencia no existe', async () => {
      experienciaExiste();
      evidenciaDelDba(null);

      await expect(service.seleccionar(idExperiencia, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('409 si la evidencia ya estaba seleccionada', async () => {
      experienciaExiste();
      evidenciaDelDba(idDba);
      mockSeleccionModel.create.mockRejectedValue({ code: 11000 });

      await expect(service.seleccionar(idExperiencia, dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('400 si la experiencia no está en borrador', async () => {
      experienciaExiste(true, 'publicada');

      await expect(service.seleccionar(idExperiencia, dto)).rejects.toThrow(
        new BadRequestException(
          'Solo se pueden cambiar las evidencias de una experiencia en borrador',
        ),
      );
      expect(mockEvidenciaModel.findById).not.toHaveBeenCalled();
      expect(mockSeleccionModel.create).not.toHaveBeenCalled();
    });
  });

  describe('listar', () => {
    it('devuelve las selecciones con populate, ordenadas por número de evidencia', async () => {
      experienciaExiste();
      const tercera = { id_evidencia: { numero: 3 } };
      const primera = { id_evidencia: { numero: 1 } };
      const populate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([tercera, primera]),
      });
      mockSeleccionModel.find.mockReturnValue({ populate });

      await expect(service.listar(idExperiencia)).resolves.toEqual([
        primera,
        tercera,
      ]);
      expect(mockSeleccionModel.find).toHaveBeenCalledWith({
        id_experiencia: idExperiencia,
      });
      expect(populate).toHaveBeenCalledWith('id_evidencia');
    });

    it('404 si la experiencia no existe', async () => {
      experienciaExiste(false);

      await expect(service.listar(idExperiencia)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('cambiarInclusion', () => {
    it('excluye una selección de la experiencia', async () => {
      experienciaExiste();
      const actualizada = { _id: idSeleccion, incluida: false };
      mockSeleccionModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(actualizada),
      });

      await expect(
        service.cambiarInclusion(idExperiencia, idSeleccion, { incluida: false }),
      ).resolves.toBe(actualizada);
      expect(mockSeleccionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: idSeleccion, id_experiencia: idExperiencia },
        { incluida: false },
        { new: true, runValidators: true },
      );
    });

    it('404 si la selección no es de esa experiencia', async () => {
      experienciaExiste();
      mockSeleccionModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.cambiarInclusion(idExperiencia, idSeleccion, { incluida: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('404 si la experiencia no existe', async () => {
      experienciaExiste(false);

      await expect(
        service.cambiarInclusion(idExperiencia, idSeleccion, { incluida: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockSeleccionModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('400 si la experiencia no está en borrador', async () => {
      experienciaExiste(true, 'publicada');

      await expect(
        service.cambiarInclusion(idExperiencia, idSeleccion, { incluida: false }),
      ).rejects.toThrow(
        new BadRequestException(
          'Solo se pueden cambiar las evidencias de una experiencia en borrador',
        ),
      );
      expect(mockSeleccionModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});

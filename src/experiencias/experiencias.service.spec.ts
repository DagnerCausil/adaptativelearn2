import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Dba } from '../dbas/schemas/dba.schema.js';
import { Docente } from '../docentes/schemas/docente.schema.js';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Inscripcion } from '../inscripciones/schemas/inscripcion.schema.js';
import { Item } from '../items/schemas/item.schema.js';
import { ExperienciasService } from './experiencias.service.js';
import { Experiencia } from './schemas/experiencia.schema.js';

describe('ExperienciasService', () => {
  const id = new Types.ObjectId();
  const idDocente = new Types.ObjectId();
  const idDba = new Types.ObjectId();

  const mockExperienciaModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const mockDocenteModel = { exists: vi.fn() };
  const mockDbaModel = { exists: vi.fn() };
  const mockExperienciaEvidenciaModel = {
    exists: vi.fn(),
    find: vi.fn(),
    deleteMany: vi.fn(),
  };
  const mockInscripcionModel = { exists: vi.fn() };
  const mockItemModel = { exists: vi.fn() };
  let service: ExperienciasService;

  function experienciaDoc(estado: 'borrador' | 'publicada' = 'borrador') {
    const doc: Record<string, unknown> = {
      _id: id,
      id_docente: idDocente,
      id_dba: idDba,
      nombre: 'Diagnóstico',
      estado,
      codigo_invitacion: 'ABCD2345',
    };
    doc.save = vi.fn().mockImplementation(() => Promise.resolve(doc));
    return doc;
  }

  function encontrarExperiencia(doc: unknown) {
    mockExperienciaModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(doc),
    });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperienciasService,
        { provide: getModelToken(Experiencia.name), useValue: mockExperienciaModel },
        { provide: getModelToken(Docente.name), useValue: mockDocenteModel },
        { provide: getModelToken(Dba.name), useValue: mockDbaModel },
        {
          provide: getModelToken(ExperienciaEvidencia.name),
          useValue: mockExperienciaEvidenciaModel,
        },
        { provide: getModelToken(Inscripcion.name), useValue: mockInscripcionModel },
        { provide: getModelToken(Item.name), useValue: mockItemModel },
      ],
    }).compile();

    service = module.get<ExperienciasService>(ExperienciasService);
  });

  describe('create', () => {
    const dto = {
      id_docente: idDocente.toHexString(),
      id_dba: idDba.toHexString(),
      nombre: 'Diagnóstico',
    };

    it('crea en borrador con un código de invitación de 8 caracteres', async () => {
      mockDocenteModel.exists.mockResolvedValue({ _id: idDocente });
      mockDbaModel.exists.mockResolvedValue({ _id: idDba });
      mockExperienciaModel.create.mockImplementation((data: unknown) =>
        Promise.resolve(data),
      );

      const creada = (await service.create(dto)) as unknown as Record<
        string,
        unknown
      >;

      expect(creada.estado).toBe('borrador');
      expect(creada.fecha_creacion).toBeInstanceOf(Date);
      expect(creada.codigo_invitacion).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
      expect(creada.id_docente).toEqual(idDocente);
      expect(creada.id_dba).toEqual(idDba);
    });

    it('reintenta con otro código si el generado ya existe', async () => {
      mockDocenteModel.exists.mockResolvedValue({ _id: idDocente });
      mockDbaModel.exists.mockResolvedValue({ _id: idDba });
      mockExperienciaModel.create
        .mockRejectedValueOnce({
          code: 11000,
          keyPattern: { codigo_invitacion: 1 },
        })
        .mockImplementation((data: unknown) => Promise.resolve(data));

      await service.create(dto);

      expect(mockExperienciaModel.create).toHaveBeenCalledTimes(2);
    });

    it('404 si el docente no existe', async () => {
      mockDocenteModel.exists.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockExperienciaModel.create).not.toHaveBeenCalled();
    });

    it('404 si el DBA no existe', async () => {
      mockDocenteModel.exists.mockResolvedValue({ _id: idDocente });
      mockDbaModel.exists.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockExperienciaModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filtra por docente cuando se envía id_docente', async () => {
      mockExperienciaModel.find.mockReturnValue({
        exec: vi.fn().mockResolvedValue([]),
      });

      await service.findAll({ id_docente: idDocente.toHexString() });

      expect(mockExperienciaModel.find).toHaveBeenCalledWith({
        id_docente: idDocente,
      });
    });

    it('sin filtro devuelve todas', async () => {
      mockExperienciaModel.find.mockReturnValue({
        exec: vi.fn().mockResolvedValue([]),
      });

      await service.findAll({});

      expect(mockExperienciaModel.find).toHaveBeenCalledWith({});
    });
  });

  it('findOne lanza 404 si no existe', async () => {
    encontrarExperiencia(null);

    await expect(service.findOne(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('update', () => {
    it('cambia el nombre de una experiencia en borrador', async () => {
      const doc = experienciaDoc('borrador');
      encontrarExperiencia(doc);

      await service.update(id, { nombre: 'Nuevo nombre' });

      expect(doc.nombre).toBe('Nuevo nombre');
      expect(doc.save).toHaveBeenCalled();
    });

    it('400 si la experiencia ya está publicada', async () => {
      const doc = experienciaDoc('publicada');
      encontrarExperiencia(doc);

      await expect(
        service.update(id, { nombre: 'Nuevo nombre' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(doc.save).not.toHaveBeenCalled();
    });
  });

  describe('publicar', () => {
    it('400 si no tiene ninguna evidencia incluida', async () => {
      const doc = experienciaDoc('borrador');
      encontrarExperiencia(doc);
      mockExperienciaEvidenciaModel.exists.mockResolvedValue(null);

      await expect(service.publicar(id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockExperienciaEvidenciaModel.exists).toHaveBeenCalledWith({
        id_experiencia: id,
        incluida: true,
      });
      expect(doc.save).not.toHaveBeenCalled();
    });

    it('publica cuando tiene una evidencia incluida', async () => {
      const doc = experienciaDoc('borrador');
      encontrarExperiencia(doc);
      mockExperienciaEvidenciaModel.exists.mockResolvedValue({
        _id: new Types.ObjectId(),
      });

      await service.publicar(id);

      expect(doc.estado).toBe('publicada');
      expect(doc.fecha_publicacion).toBeInstanceOf(Date);
      expect(doc.save).toHaveBeenCalled();
    });

    it('400 si ya estaba publicada', async () => {
      const doc = experienciaDoc('publicada');
      encontrarExperiencia(doc);

      await expect(service.publicar(id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(doc.save).not.toHaveBeenCalled();
    });

    it('404 si la experiencia no existe', async () => {
      encontrarExperiencia(null);

      await expect(service.publicar(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    function sinSelecciones() {
      mockExperienciaEvidenciaModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([]) }),
      });
      mockExperienciaEvidenciaModel.deleteMany.mockReturnValue({
        exec: vi.fn().mockResolvedValue({}),
      });
      mockExperienciaModel.findByIdAndDelete.mockReturnValue({
        exec: vi.fn().mockResolvedValue({}),
      });
    }

    it('409 si la experiencia tiene inscripciones', async () => {
      encontrarExperiencia(experienciaDoc());
      mockInscripcionModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(service.remove(id)).rejects.toBeInstanceOf(ConflictException);
      expect(mockExperienciaModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('409 si alguna evidencia seleccionada tiene ítems', async () => {
      encontrarExperiencia(experienciaDoc());
      mockInscripcionModel.exists.mockResolvedValue(null);
      mockExperienciaEvidenciaModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([{ _id: new Types.ObjectId() }]),
        }),
      });
      mockItemModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(service.remove(id)).rejects.toBeInstanceOf(ConflictException);
      expect(mockExperienciaModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('borra la experiencia y sus selecciones si no tiene referencias vivas', async () => {
      const doc = experienciaDoc();
      encontrarExperiencia(doc);
      mockInscripcionModel.exists.mockResolvedValue(null);
      sinSelecciones();

      await expect(service.remove(id)).resolves.toBe(doc);
      expect(mockExperienciaEvidenciaModel.deleteMany).toHaveBeenCalledWith({
        id_experiencia: id,
      });
      expect(mockExperienciaModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });
  });
});

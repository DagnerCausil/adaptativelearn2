import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { InscripcionesController } from './inscripciones.controller.js';
import { InscripcionesService } from './inscripciones.service.js';

describe('InscripcionesController', () => {
  const id = new Types.ObjectId();
  const inscripcion = { _id: id };
  const mockInscripcionesService = {
    unirse: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
  };
  let controller: InscripcionesController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InscripcionesController],
      providers: [
        { provide: InscripcionesService, useValue: mockInscripcionesService },
      ],
    }).compile();

    controller = module.get<InscripcionesController>(InscripcionesController);
  });

  it('se une a través del servicio', async () => {
    const dto = {
      id_estudiante: new Types.ObjectId().toHexString(),
      codigo_invitacion: 'K7M3QX9P',
    };
    mockInscripcionesService.unirse.mockResolvedValue(inscripcion);

    await expect(controller.unirse(dto)).resolves.toBe(inscripcion);
    expect(mockInscripcionesService.unirse).toHaveBeenCalledWith(dto);
  });

  it('lista, consulta y borra a través del servicio', async () => {
    mockInscripcionesService.findAll.mockResolvedValue([inscripcion]);
    mockInscripcionesService.findOne.mockResolvedValue(inscripcion);
    mockInscripcionesService.remove.mockResolvedValue(inscripcion);

    await expect(controller.findAll({})).resolves.toEqual([inscripcion]);
    await expect(controller.findOne(id)).resolves.toBe(inscripcion);
    await expect(controller.remove(id)).resolves.toBe(inscripcion);
  });
});

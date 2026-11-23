import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import {
  InscripcionesPresentacionesController,
  PresentacionesController,
} from './presentaciones.controller.js';
import { PresentacionesService } from './presentaciones.service.js';

describe('Controladores de presentaciones', () => {
  const id = new Types.ObjectId();
  const mockPresentacionesService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    siguienteItem: vi.fn(),
  };
  let controller: PresentacionesController;
  let siguienteController: InscripcionesPresentacionesController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        PresentacionesController,
        InscripcionesPresentacionesController,
      ],
      providers: [
        { provide: PresentacionesService, useValue: mockPresentacionesService },
      ],
    }).compile();

    controller = module.get(PresentacionesController);
    siguienteController = module.get(InscripcionesPresentacionesController);
  });

  it('lista y consulta a través del servicio', async () => {
    mockPresentacionesService.findAll.mockResolvedValue([]);
    mockPresentacionesService.findOne.mockResolvedValue({ _id: id });

    await expect(controller.findAll({})).resolves.toEqual([]);
    await expect(controller.findOne(id)).resolves.toEqual({ _id: id });
  });

  it('pide el siguiente ítem a través del servicio', async () => {
    mockPresentacionesService.siguienteItem.mockResolvedValue({
      terminado: true,
    });

    await expect(siguienteController.siguienteItem(id)).resolves.toEqual({
      terminado: true,
    });
    expect(mockPresentacionesService.siguienteItem).toHaveBeenCalledWith(id);
  });
});

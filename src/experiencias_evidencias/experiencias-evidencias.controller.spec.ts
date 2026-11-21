import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ExperienciasEvidenciasController } from './experiencias-evidencias.controller.js';
import { ExperienciasEvidenciasService } from './experiencias-evidencias.service.js';

describe('ExperienciasEvidenciasController', () => {
  const id = new Types.ObjectId();
  const idSeleccion = new Types.ObjectId();
  const seleccion = { _id: idSeleccion };
  const mockService = {
    seleccionar: vi.fn(),
    listar: vi.fn(),
    cambiarInclusion: vi.fn(),
  };
  let controller: ExperienciasEvidenciasController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExperienciasEvidenciasController],
      providers: [{ provide: ExperienciasEvidenciasService, useValue: mockService }],
    }).compile();

    controller = module.get(ExperienciasEvidenciasController);
  });

  it('delega seleccionar, listar y cambiar inclusión al servicio', async () => {
    const dto = { id_evidencia: new Types.ObjectId().toHexString() };
    mockService.seleccionar.mockResolvedValue(seleccion);
    mockService.listar.mockResolvedValue([seleccion]);
    mockService.cambiarInclusion.mockResolvedValue(seleccion);

    await expect(controller.seleccionar(id, dto)).resolves.toBe(seleccion);
    await expect(controller.listar(id)).resolves.toEqual([seleccion]);
    await expect(
      controller.cambiarInclusion(id, idSeleccion, { incluida: false }),
    ).resolves.toBe(seleccion);

    expect(mockService.seleccionar).toHaveBeenCalledWith(id, dto);
    expect(mockService.cambiarInclusion).toHaveBeenCalledWith(id, idSeleccion, {
      incluida: false,
    });
  });
});

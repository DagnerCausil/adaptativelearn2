import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ExperienciasController } from './experiencias.controller.js';
import { ExperienciasService } from './experiencias.service.js';

describe('ExperienciasController', () => {
  const id = new Types.ObjectId();
  const experiencia = { _id: id, nombre: 'Diagnóstico' };
  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    publicar: vi.fn(),
    remove: vi.fn(),
  };
  let controller: ExperienciasController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExperienciasController],
      providers: [{ provide: ExperienciasService, useValue: mockService }],
    }).compile();

    controller = module.get<ExperienciasController>(ExperienciasController);
  });

  it('crea a través del servicio', async () => {
    const dto = {
      id_docente: new Types.ObjectId().toHexString(),
      id_dba: new Types.ObjectId().toHexString(),
      nombre: 'Diagnóstico',
    };
    mockService.create.mockResolvedValue(experiencia);

    await expect(controller.create(dto)).resolves.toBe(experiencia);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('pasa el filtro al listar', async () => {
    const filtro = { id_docente: new Types.ObjectId().toHexString() };
    mockService.findAll.mockResolvedValue([experiencia]);

    await expect(controller.findAll(filtro)).resolves.toEqual([experiencia]);
    expect(mockService.findAll).toHaveBeenCalledWith(filtro);
  });

  it('consulta, edita, publica y borra por ObjectId', async () => {
    mockService.findOne.mockResolvedValue(experiencia);
    mockService.update.mockResolvedValue(experiencia);
    mockService.publicar.mockResolvedValue(experiencia);
    mockService.remove.mockResolvedValue(experiencia);

    await expect(controller.findOne(id)).resolves.toBe(experiencia);
    await expect(controller.update(id, { nombre: 'X' })).resolves.toBe(experiencia);
    await expect(controller.publicar(id)).resolves.toBe(experiencia);
    await expect(controller.remove(id)).resolves.toBe(experiencia);

    expect(mockService.update).toHaveBeenCalledWith(id, { nombre: 'X' });
    expect(mockService.publicar).toHaveBeenCalledWith(id);
  });
});

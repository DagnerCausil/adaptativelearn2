import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dba } from '../dbas/schemas/dba.schema.js';
import { Docente } from '../docentes/schemas/docente.schema.js';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Inscripcion } from '../inscripciones/schemas/inscripcion.schema.js';
import { ItemsService } from '../items/items.service.js';
import { Item } from '../items/schemas/item.schema.js';
import { generarCodigoInvitacion } from './codigo-invitacion.js';
import { CreateExperienciaDto } from './dto/create-experiencia.dto.js';
import { FiltroExperienciasDto } from './dto/filtro-experiencias.dto.js';
import { UpdateExperienciaDto } from './dto/update-experiencia.dto.js';
import {
  Experiencia,
  ExperienciaDocument,
} from './schemas/experiencia.schema.js';

/** Intentos para generar un código de invitación que no exista todavía. */
const INTENTOS_CODIGO = 5;

function esCodigoDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000 &&
    'keyPattern' in error &&
    typeof error.keyPattern === 'object' &&
    error.keyPattern !== null &&
    'codigo_invitacion' in error.keyPattern
  );
}

@Injectable()
export class ExperienciasService {
  constructor(
    @InjectModel(Experiencia.name)
    private readonly experienciaModel: Model<Experiencia>,
    @InjectModel(Docente.name)
    private readonly docenteModel: Model<Docente>,
    @InjectModel(Dba.name)
    private readonly dbaModel: Model<Dba>,
    @InjectModel(ExperienciaEvidencia.name)
    private readonly experienciaEvidenciaModel: Model<ExperienciaEvidencia>,
    @InjectModel(Inscripcion.name)
    private readonly inscripcionModel: Model<Inscripcion>,
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    private readonly itemsService: ItemsService,
  ) {}

  async create(dto: CreateExperienciaDto): Promise<ExperienciaDocument> {
    const idDocente = new Types.ObjectId(dto.id_docente);
    const idDba = new Types.ObjectId(dto.id_dba);

    if (!(await this.docenteModel.exists({ _id: idDocente }))) {
      throw new NotFoundException('Docente no encontrado.');
    }
    if (!(await this.dbaModel.exists({ _id: idDba }))) {
      throw new NotFoundException('DBA no encontrado.');
    }

    for (let intento = 0; intento < INTENTOS_CODIGO; intento++) {
      try {
        return await this.experienciaModel.create({
          id_docente: idDocente,
          id_dba: idDba,
          nombre: dto.nombre,
          estado: 'borrador',
          fecha_creacion: new Date(),
          codigo_invitacion: generarCodigoInvitacion(),
        });
      } catch (error) {
        if (!esCodigoDuplicado(error)) {
          throw error;
        }
      }
    }

    throw new InternalServerErrorException(
      'No se pudo generar un código de invitación único.',
    );
  }

  findAll(filtro: FiltroExperienciasDto = {}): Promise<ExperienciaDocument[]> {
    const consulta = filtro.id_docente
      ? { id_docente: new Types.ObjectId(filtro.id_docente) }
      : {};
    return this.experienciaModel.find(consulta).exec();
  }

  async findOne(id: Types.ObjectId): Promise<ExperienciaDocument> {
    const experiencia = await this.experienciaModel.findById(id).exec();
    if (!experiencia) {
      throw new NotFoundException('Experiencia no encontrada.');
    }

    return experiencia;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateExperienciaDto,
  ): Promise<ExperienciaDocument> {
    const experiencia = await this.findOne(id);
    if (experiencia.estado !== 'borrador') {
      throw new BadRequestException(
        'Solo se puede editar una experiencia en borrador.',
      );
    }

    if (dto.nombre !== undefined) {
      experiencia.nombre = dto.nombre;
    }
    return experiencia.save();
  }

  async publicar(id: Types.ObjectId): Promise<ExperienciaDocument> {
    const experiencia = await this.findOne(id);
    await this.validarAntesDePublicar(experiencia);

    experiencia.estado = 'publicada';
    experiencia.fecha_publicacion = new Date();
    return experiencia.save();
  }

  /**
   * Reglas que debe cumplir una experiencia para publicarse. Si alguna falla, lanza 400.
   * Incluye la validación del banco de ítems (RI-4) de ItemsService.
   */
  private async validarAntesDePublicar(
    experiencia: ExperienciaDocument,
  ): Promise<void> {
    if (experiencia.estado !== 'borrador') {
      throw new BadRequestException(
        'Solo se puede publicar una experiencia en borrador.',
      );
    }

    // H-4 / participación (1,N): al menos una evidencia incluida.
    const tieneEvidenciaIncluida = await this.experienciaEvidenciaModel.exists({
      id_experiencia: experiencia._id,
      incluida: true,
    });
    if (!tieneEvidenciaIncluida) {
      throw new BadRequestException(
        'La experiencia necesita al menos una evidencia incluida para publicarse.',
      );
    }

    // RI-4 / H-9: cada ítem aprobado y no excluido cumple el mínimo de opciones.
    await this.itemsService.validarBancoDeExperiencia(experiencia._id);
  }

  async remove(id: Types.ObjectId): Promise<ExperienciaDocument> {
    const experiencia = await this.findOne(id);

    if (await this.inscripcionModel.exists({ id_experiencia: id })) {
      throw new ConflictException(
        'No se puede eliminar una experiencia con inscripciones.',
      );
    }

    const selecciones = await this.experienciaEvidenciaModel
      .find({ id_experiencia: id })
      .select('_id')
      .exec();
    const idsSelecciones = selecciones.map((seleccion) => seleccion._id);
    if (
      idsSelecciones.length > 0 &&
      (await this.itemModel.exists({
        id_experiencia_evidencia: { $in: idsSelecciones },
      }))
    ) {
      throw new ConflictException(
        'No se puede eliminar una experiencia con ítems en su banco.',
      );
    }

    await this.experienciaEvidenciaModel
      .deleteMany({ id_experiencia: id })
      .exec();
    await this.experienciaModel.findByIdAndDelete(id).exec();
    return experiencia;
  }
}

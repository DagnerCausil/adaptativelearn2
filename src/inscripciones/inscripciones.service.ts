import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Estudiante } from '../estudiantes/schemas/estudiante.schema.js';
import { Experiencia } from '../experiencias/schemas/experiencia.schema.js';
import { Presentacion } from '../presentaciones/schemas/presentacion.schema.js';
import { Resultado } from '../resultados/schemas/resultado.schema.js';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto.js';
import { FiltroInscripcionesDto } from './dto/filtro-inscripciones.dto.js';
import {
  Inscripcion,
  InscripcionDocument,
} from './schemas/inscripcion.schema.js';

function esIndiceUnicoDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class InscripcionesService {
  constructor(
    @InjectModel(Inscripcion.name)
    private readonly inscripcionModel: Model<Inscripcion>,
    @InjectModel(Estudiante.name)
    private readonly estudianteModel: Model<Estudiante>,
    @InjectModel(Experiencia.name)
    private readonly experienciaModel: Model<Experiencia>,
    @InjectModel(Presentacion.name)
    private readonly presentacionModel: Model<Presentacion>,
    @InjectModel(Resultado.name)
    private readonly resultadoModel: Model<Resultado>,
  ) {}

  async unirse(dto: CreateInscripcionDto): Promise<InscripcionDocument> {
    const idEstudiante = new Types.ObjectId(dto.id_estudiante);
    const estudiante = await this.estudianteModel.exists({ _id: idEstudiante });
    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado.');
    }

    const experiencia = await this.experienciaModel
      .findOne({
        codigo_invitacion: dto.codigo_invitacion.trim().toUpperCase(),
      })
      .exec();
    if (!experiencia) {
      throw new NotFoundException(
        'No existe una experiencia con ese código de invitación.',
      );
    }

    if (experiencia.estado === 'borrador') {
      throw new BadRequestException(
        'La experiencia aún está en borrador; no admite inscripciones.',
      );
    }

    const yaInscrito = await this.inscripcionModel.exists({
      id_estudiante: idEstudiante,
      id_experiencia: experiencia._id,
    });
    if (yaInscrito) {
      throw new ConflictException(
        'El estudiante ya está inscrito en esta experiencia.',
      );
    }

    try {
      return await this.inscripcionModel.create({
        id_estudiante: idEstudiante,
        id_experiencia: experiencia._id,
      });
    } catch (error) {
      if (esIndiceUnicoDuplicado(error)) {
        throw new ConflictException(
          'El estudiante ya está inscrito en esta experiencia.',
        );
      }

      throw error;
    }
  }

  findAll(filtro: FiltroInscripcionesDto = {}): Promise<InscripcionDocument[]> {
    const condicion: Record<string, Types.ObjectId> = {};
    if (filtro.id_estudiante) {
      condicion.id_estudiante = new Types.ObjectId(filtro.id_estudiante);
    }
    if (filtro.id_experiencia) {
      condicion.id_experiencia = new Types.ObjectId(filtro.id_experiencia);
    }

    return this.inscripcionModel.find(condicion).exec();
  }

  async findOne(id: Types.ObjectId): Promise<InscripcionDocument> {
    const inscripcion = await this.inscripcionModel.findById(id).exec();
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada.');
    }

    return inscripcion;
  }

  async remove(id: Types.ObjectId): Promise<InscripcionDocument> {
    const inscripcion = await this.findOne(id);

    const tienePresentaciones = await this.presentacionModel.exists({
      id_inscripcion: id,
    });
    if (tienePresentaciones) {
      throw new ConflictException(
        'No se puede eliminar una inscripción con presentaciones.',
      );
    }

    const tieneResultados = await this.resultadoModel.exists({
      id_inscripcion: id,
    });
    if (tieneResultados) {
      throw new ConflictException(
        'No se puede eliminar una inscripción con resultados calculados.',
      );
    }

    await this.inscripcionModel.findByIdAndDelete(id).exec();
    return inscripcion;
  }
}

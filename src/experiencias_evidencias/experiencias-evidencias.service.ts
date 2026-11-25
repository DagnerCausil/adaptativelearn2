import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Evidencia } from '../evidencias/schemas/evidencia.schema.js';
import {
  Experiencia,
  ExperienciaDocument,
} from '../experiencias/schemas/experiencia.schema.js';
import { CambiarInclusionDto } from './dto/cambiar-inclusion.dto.js';
import { CreateExperienciaEvidenciaDto } from './dto/create-experiencia-evidencia.dto.js';
import {
  ExperienciaEvidencia,
  ExperienciaEvidenciaDocument,
} from './schemas/experiencia-evidencia.schema.js';

function esDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

function numeroDeEvidencia(seleccion: ExperienciaEvidenciaDocument): number {
  const evidencia = seleccion.id_evidencia as unknown;
  if (typeof evidencia === 'object' && evidencia !== null && 'numero' in evidencia) {
    return Number(evidencia.numero);
  }
  return Number.MAX_SAFE_INTEGER;
}

@Injectable()
export class ExperienciasEvidenciasService {
  constructor(
    @InjectModel(ExperienciaEvidencia.name)
    private readonly experienciaEvidenciaModel: Model<ExperienciaEvidencia>,
    @InjectModel(Experiencia.name)
    private readonly experienciaModel: Model<Experiencia>,
    @InjectModel(Evidencia.name)
    private readonly evidenciaModel: Model<Evidencia>,
  ) {}

  private async buscarExperiencia(
    idExperiencia: Types.ObjectId,
  ): Promise<ExperienciaDocument> {
    const experiencia = await this.experienciaModel.findById(idExperiencia).exec();
    if (!experiencia) {
      throw new NotFoundException('Experiencia no encontrada.');
    }
    return experiencia;
  }

  /** Las evidencias solo se cambian mientras la experiencia está en borrador. */
  private exigirBorrador(experiencia: ExperienciaDocument): void {
    if (experiencia.estado !== 'borrador') {
      throw new BadRequestException(
        'Solo se pueden cambiar las evidencias de una experiencia en borrador',
      );
    }
  }

  async seleccionar(
    idExperiencia: Types.ObjectId,
    dto: CreateExperienciaEvidenciaDto,
  ): Promise<ExperienciaEvidenciaDocument> {
    const experiencia = await this.buscarExperiencia(idExperiencia);
    this.exigirBorrador(experiencia);

    const idEvidencia = new Types.ObjectId(dto.id_evidencia);
    const evidencia = await this.evidenciaModel.findById(idEvidencia).exec();
    if (!evidencia) {
      throw new NotFoundException('Evidencia no encontrada.');
    }

    // Coherencia DBA (decisión del profesor): la evidencia es del DBA de la experiencia.
    if (!evidencia.id_dba.equals(experiencia.id_dba)) {
      throw new BadRequestException(
        'La evidencia no pertenece al DBA de la experiencia.',
      );
    }

    try {
      return await this.experienciaEvidenciaModel.create({
        id_experiencia: idExperiencia,
        id_evidencia: idEvidencia,
        incluida: true,
      });
    } catch (error) {
      if (esDuplicado(error)) {
        throw new ConflictException(
          'La evidencia ya está seleccionada en esta experiencia.',
        );
      }
      throw error;
    }
  }

  async listar(
    idExperiencia: Types.ObjectId,
  ): Promise<ExperienciaEvidenciaDocument[]> {
    await this.buscarExperiencia(idExperiencia);

    const selecciones = await this.experienciaEvidenciaModel
      .find({ id_experiencia: idExperiencia })
      .populate('id_evidencia')
      .exec();

    return selecciones.sort(
      (a, b) => numeroDeEvidencia(a) - numeroDeEvidencia(b),
    );
  }

  async cambiarInclusion(
    idExperiencia: Types.ObjectId,
    idSeleccion: Types.ObjectId,
    dto: CambiarInclusionDto,
  ): Promise<ExperienciaEvidenciaDocument> {
    const experiencia = await this.buscarExperiencia(idExperiencia);
    this.exigirBorrador(experiencia);

    const seleccion = await this.experienciaEvidenciaModel
      .findOneAndUpdate(
        { _id: idSeleccion, id_experiencia: idExperiencia },
        { incluida: dto.incluida },
        { new: true, runValidators: true },
      )
      .exec();
    if (!seleccion) {
      throw new NotFoundException(
        'La selección no existe en esta experiencia.',
      );
    }
    return seleccion;
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dba } from '../dbas/schemas/dba.schema.js';
import { DictamenEvidencia } from '../dictamenes_evidencia/schemas/dictamen-evidencia.schema.js';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto.js';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto.js';
import { Evidencia, EvidenciaDocument } from './schemas/evidencia.schema.js';

function esErrorDeDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

const MENSAJE_DUPLICADO =
  'Ya existe una evidencia con ese número en el mismo DBA.';

@Injectable()
export class EvidenciasService {
  constructor(
    @InjectModel(Evidencia.name)
    private readonly evidenciaModel: Model<Evidencia>,
    @InjectModel(Dba.name)
    private readonly dbaModel: Model<Dba>,
    @InjectModel(DictamenEvidencia.name)
    private readonly dictamenModel: Model<DictamenEvidencia>,
    @InjectModel(ExperienciaEvidencia.name)
    private readonly experienciaEvidenciaModel: Model<ExperienciaEvidencia>,
  ) {}

  private async verificarDba(idDba: Types.ObjectId): Promise<void> {
    const existe = await this.dbaModel.exists({ _id: idDba });
    if (!existe) {
      throw new NotFoundException('DBA no encontrado.');
    }
  }

  async create(
    createEvidenciaDto: CreateEvidenciaDto,
  ): Promise<EvidenciaDocument> {
    const idDba = new Types.ObjectId(createEvidenciaDto.id_dba);
    await this.verificarDba(idDba);

    try {
      return await this.evidenciaModel.create({
        ...createEvidenciaDto,
        id_dba: idDba,
      });
    } catch (error) {
      if (esErrorDeDuplicado(error)) {
        throw new ConflictException(MENSAJE_DUPLICADO);
      }

      throw error;
    }
  }

  findAll(): Promise<EvidenciaDocument[]> {
    return this.evidenciaModel.find().sort({ id_dba: 1, numero: 1 }).exec();
  }

  async findOne(id: Types.ObjectId): Promise<EvidenciaDocument> {
    const evidencia = await this.evidenciaModel.findById(id).exec();
    if (!evidencia) {
      throw new NotFoundException('Evidencia no encontrada.');
    }

    return evidencia;
  }

  async update(
    id: Types.ObjectId,
    updateEvidenciaDto: UpdateEvidenciaDto,
  ): Promise<EvidenciaDocument> {
    const { id_dba, ...resto } = updateEvidenciaDto;
    const cambios: Partial<Evidencia> = { ...resto };
    if (id_dba !== undefined) {
      cambios.id_dba = new Types.ObjectId(id_dba);
      await this.verificarDba(cambios.id_dba);
    }

    try {
      const evidencia = await this.evidenciaModel
        .findByIdAndUpdate(id, cambios, {
          new: true,
          runValidators: true,
        })
        .exec();
      if (!evidencia) {
        throw new NotFoundException('Evidencia no encontrada.');
      }

      return evidencia;
    } catch (error) {
      if (esErrorDeDuplicado(error)) {
        throw new ConflictException(MENSAJE_DUPLICADO);
      }

      throw error;
    }
  }

  async remove(id: Types.ObjectId): Promise<EvidenciaDocument> {
    const evidencia = await this.findOne(id);

    const tieneDictamen = await this.dictamenModel.exists({
      id_evidencia: id,
    });
    if (tieneDictamen) {
      throw new ConflictException(
        'No se puede eliminar una evidencia que tiene dictamen.',
      );
    }

    const estaSeleccionada = await this.experienciaEvidenciaModel.exists({
      id_evidencia: id,
    });
    if (estaSeleccionada) {
      throw new ConflictException(
        'No se puede eliminar una evidencia seleccionada en experiencias.',
      );
    }

    await this.evidenciaModel.findByIdAndDelete(id).exec();
    return evidencia;
  }
}

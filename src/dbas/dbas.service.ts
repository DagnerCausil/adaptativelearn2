import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Evidencia,
  EvidenciaDocument,
} from '../evidencias/schemas/evidencia.schema.js';
import { Experiencia } from '../experiencias/schemas/experiencia.schema.js';
import { CreateDbaDto } from './dto/create-dba.dto.js';
import { UpdateDbaDto } from './dto/update-dba.dto.js';
import { Dba, DbaDocument } from './schemas/dba.schema.js';

function esErrorDeDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class DbasService {
  constructor(
    @InjectModel(Dba.name)
    private readonly dbaModel: Model<Dba>,
    @InjectModel(Evidencia.name)
    private readonly evidenciaModel: Model<Evidencia>,
    @InjectModel(Experiencia.name)
    private readonly experienciaModel: Model<Experiencia>,
  ) {}

  async create(createDbaDto: CreateDbaDto): Promise<DbaDocument> {
    try {
      return await this.dbaModel.create(createDbaDto);
    } catch (error) {
      if (esErrorDeDuplicado(error)) {
        throw new ConflictException('El código del DBA ya está registrado.');
      }

      throw error;
    }
  }

  findAll(): Promise<DbaDocument[]> {
    return this.dbaModel.find().sort({ codigo: 1 }).exec();
  }

  async findOne(id: Types.ObjectId): Promise<DbaDocument> {
    const dba = await this.dbaModel.findById(id).exec();
    if (!dba) {
      throw new NotFoundException('DBA no encontrado.');
    }

    return dba;
  }

  async findEvidencias(id: Types.ObjectId): Promise<EvidenciaDocument[]> {
    await this.findOne(id);
    return this.evidenciaModel.find({ id_dba: id }).sort({ numero: 1 }).exec();
  }

  async update(
    id: Types.ObjectId,
    updateDbaDto: UpdateDbaDto,
  ): Promise<DbaDocument> {
    const dba = await this.dbaModel
      .findByIdAndUpdate(id, updateDbaDto, {
        new: true,
        runValidators: true,
      })
      .exec();
    if (!dba) {
      throw new NotFoundException('DBA no encontrado.');
    }

    return dba;
  }

  async remove(id: Types.ObjectId): Promise<DbaDocument> {
    const dba = await this.findOne(id);

    const tieneEvidencias = await this.evidenciaModel.exists({ id_dba: id });
    if (tieneEvidencias) {
      throw new ConflictException(
        'No se puede eliminar un DBA con evidencias asociadas.',
      );
    }

    const tieneExperiencias = await this.experienciaModel.exists({
      id_dba: id,
    });
    if (tieneExperiencias) {
      throw new ConflictException(
        'No se puede eliminar un DBA con experiencias asociadas.',
      );
    }

    await this.dbaModel.findByIdAndDelete(id).exec();
    return dba;
  }
}

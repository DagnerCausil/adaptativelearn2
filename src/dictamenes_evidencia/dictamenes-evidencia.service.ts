import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Evidencia } from '../evidencias/schemas/evidencia.schema.js';
import { CreateDictamenEvidenciaDto } from './dto/create-dictamen-evidencia.dto.js';
import { UpdateDictamenEvidenciaDto } from './dto/update-dictamen-evidencia.dto.js';
import {
  DictamenEvidencia,
  DictamenEvidenciaDocument,
} from './schemas/dictamen-evidencia.schema.js';

function esErrorDeDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class DictamenesEvidenciaService {
  constructor(
    @InjectModel(DictamenEvidencia.name)
    private readonly dictamenModel: Model<DictamenEvidencia>,
    @InjectModel(Evidencia.name)
    private readonly evidenciaModel: Model<Evidencia>,
  ) {}

  async create(
    createDictamenDto: CreateDictamenEvidenciaDto,
  ): Promise<DictamenEvidenciaDocument> {
    const idEvidencia = new Types.ObjectId(createDictamenDto.id_evidencia);
    const existeEvidencia = await this.evidenciaModel.exists({
      _id: idEvidencia,
    });
    if (!existeEvidencia) {
      throw new NotFoundException('Evidencia no encontrada.');
    }

    try {
      return await this.dictamenModel.create({
        ...createDictamenDto,
        id_evidencia: idEvidencia,
        fecha_dictamen: new Date(),
      });
    } catch (error) {
      if (esErrorDeDuplicado(error)) {
        throw new ConflictException('La evidencia ya tiene un dictamen.');
      }

      throw error;
    }
  }

  findAll(): Promise<DictamenEvidenciaDocument[]> {
    return this.dictamenModel.find().exec();
  }

  async findOne(id: Types.ObjectId): Promise<DictamenEvidenciaDocument> {
    const dictamen = await this.dictamenModel.findById(id).exec();
    if (!dictamen) {
      throw new NotFoundException('Dictamen no encontrado.');
    }

    return dictamen;
  }

  async update(
    id: Types.ObjectId,
    updateDictamenDto: UpdateDictamenEvidenciaDto,
  ): Promise<DictamenEvidenciaDocument> {
    // Cambiar el juicio es dictaminar de nuevo: el servidor renueva la fecha.
    const dictamen = await this.dictamenModel
      .findByIdAndUpdate(
        id,
        { ...updateDictamenDto, fecha_dictamen: new Date() },
        { new: true, runValidators: true },
      )
      .exec();
    if (!dictamen) {
      throw new NotFoundException('Dictamen no encontrado.');
    }

    return dictamen;
  }

  async remove(id: Types.ObjectId): Promise<DictamenEvidenciaDocument> {
    const dictamen = await this.dictamenModel.findByIdAndDelete(id).exec();
    if (!dictamen) {
      throw new NotFoundException('Dictamen no encontrado.');
    }

    return dictamen;
  }
}

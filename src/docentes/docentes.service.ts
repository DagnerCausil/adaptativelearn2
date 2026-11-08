import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Experiencia } from '../experiencias/schemas/experiencia.schema.js';
import { CreateDocenteDto } from './dto/create-docente.dto.js';
import { UpdateDocenteDto } from './dto/update-docente.dto.js';
import { Docente, DocenteDocument } from './schemas/docente.schema.js';

function esErrorDeCorreoDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class DocentesService {
  constructor(
    @InjectModel(Docente.name)
    private readonly docenteModel: Model<Docente>,
    @InjectModel(Experiencia.name)
    private readonly experienciaModel: Model<Experiencia>,
  ) {}

  async create(createDocenteDto: CreateDocenteDto): Promise<DocenteDocument> {
    try {
      return await this.docenteModel.create(createDocenteDto);
    } catch (error) {
      if (esErrorDeCorreoDuplicado(error)) {
        throw new ConflictException('El correo ya está registrado.');
      }

      throw error;
    }
  }

  findAll(): Promise<DocenteDocument[]> {
    return this.docenteModel.find().exec();
  }

  async findOne(id: Types.ObjectId): Promise<DocenteDocument> {
    const docente = await this.docenteModel.findById(id).exec();
    if (!docente) {
      throw new NotFoundException('Docente no encontrado.');
    }

    return docente;
  }

  async update(
    id: Types.ObjectId,
    updateDocenteDto: UpdateDocenteDto,
  ): Promise<DocenteDocument> {
    try {
      const docente = await this.docenteModel
        .findByIdAndUpdate(id, updateDocenteDto, {
          new: true,
          runValidators: true,
        })
        .exec();
      if (!docente) {
        throw new NotFoundException('Docente no encontrado.');
      }

      return docente;
    } catch (error) {
      if (esErrorDeCorreoDuplicado(error)) {
        throw new ConflictException('El correo ya está registrado.');
      }

      throw error;
    }
  }

  async remove(id: Types.ObjectId): Promise<DocenteDocument> {
    const docente = await this.docenteModel.findById(id).exec();
    if (!docente) {
      throw new NotFoundException('Docente no encontrado.');
    }

    const tieneExperiencias = await this.experienciaModel.exists({
      id_docente: id,
    });
    if (tieneExperiencias) {
      throw new ConflictException(
        'No se puede eliminar un docente con experiencias asociadas.',
      );
    }

    await this.docenteModel.findByIdAndDelete(id).exec();
    return docente;
  }
}

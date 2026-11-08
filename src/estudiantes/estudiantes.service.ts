import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEstudianteDto } from './dto/create-estudiante.dto.js';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto.js';
import { Estudiante, EstudianteDocument } from './schemas/estudiante.schema.js';
import { Inscripcion } from '../inscripciones/schemas/inscripcion.schema.js';

function esErrorDeCorreoDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class EstudiantesService {
  constructor(
    @InjectModel(Estudiante.name)
    private readonly estudianteModel: Model<Estudiante>,
    @InjectModel(Inscripcion.name)
    private readonly inscripcionModel: Model<Inscripcion>,
  ) {}

  async create(
    createEstudianteDto: CreateEstudianteDto,
  ): Promise<EstudianteDocument> {
    try {
      return await this.estudianteModel.create(createEstudianteDto);
    } catch (error) {
      if (esErrorDeCorreoDuplicado(error)) {
        throw new ConflictException('El correo ya está registrado.');
      }

      throw error;
    }
  }

  findAll(): Promise<EstudianteDocument[]> {
    return this.estudianteModel.find().exec();
  }

  async findOne(id: Types.ObjectId): Promise<EstudianteDocument> {
    const estudiante = await this.estudianteModel.findById(id).exec();
    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado.');
    }

    return estudiante;
  }

  async update(
    id: Types.ObjectId,
    updateEstudianteDto: UpdateEstudianteDto,
  ): Promise<EstudianteDocument> {
    try {
      const estudiante = await this.estudianteModel
        .findByIdAndUpdate(id, updateEstudianteDto, {
          new: true,
          runValidators: true,
        })
        .exec();
      if (!estudiante) {
        throw new NotFoundException('Estudiante no encontrado.');
      }

      return estudiante;
    } catch (error) {
      if (esErrorDeCorreoDuplicado(error)) {
        throw new ConflictException('El correo ya está registrado.');
      }

      throw error;
    }
  }

  async remove(id: Types.ObjectId): Promise<EstudianteDocument> {
    const estudiante = await this.estudianteModel.findById(id).exec();
    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado.');
    }

    const tieneInscripciones = await this.inscripcionModel.exists({
      id_estudiante: id,
    });
    if (tieneInscripciones) {
      throw new ConflictException(
        'No se puede eliminar un estudiante con inscripciones asociadas.',
      );
    }

    await this.estudianteModel.findByIdAndDelete(id).exec();
    return estudiante;
  }
}

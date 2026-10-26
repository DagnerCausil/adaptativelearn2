import { Injectable } from '@nestjs/common';
import { CreateInscripcioneDto } from './dto/create-inscripcione.dto.js';
import { UpdateInscripcioneDto } from './dto/update-inscripcione.dto.js';

@Injectable()
export class InscripcionesService {
  create(createInscripcioneDto: CreateInscripcioneDto) {
    return 'This action adds a new inscripcione';
  }

  findAll() {
    return `This action returns all inscripciones`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inscripcione`;
  }

  update(id: number, updateInscripcioneDto: UpdateInscripcioneDto) {
    return `This action updates a #${id} inscripcione`;
  }

  remove(id: number) {
    return `This action removes a #${id} inscripcione`;
  }
}

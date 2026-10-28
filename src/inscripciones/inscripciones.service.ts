import { Injectable } from '@nestjs/common';
import { CreateInscripcioneDto } from './dto/create-inscripcione.dto.js';
import { UpdateInscripcioneDto } from './dto/update-inscripcione.dto.js';

@Injectable()
export class InscripcionesService {
  create(createInscripcioneDto: CreateInscripcioneDto) {
    return createInscripcioneDto;
  }

  findAll() {
    return [
      {
        id: 1,
        id_estudiante: 1,
        id_experiencia: 101,
        fecha_union: '2026-10-26T10:15:00Z'
      },
      {
        id: 2,
        id_estudiante: 2,
        id_experiencia: 102,
        fecha_union: '2026-10-26T11:30:00Z'
      }
    ];
  }

  findOne(id: number) {
    return {
      id,
      id_estudiante: 1,
      id_experiencia: 101,
      fecha_union: '2026-10-26T10:15:00Z'
    };
  }

  update(id: number, updateInscripcioneDto: UpdateInscripcioneDto) {
    return {
      id,
      updateInscripcioneDto,
    }
  }

  remove(id: number) {
    return {
      id,
    }
  }
}

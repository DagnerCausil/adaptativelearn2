import { Injectable } from '@nestjs/common';
import { CreateResultadoDto } from './dto/create-resultado.dto.js';
import { UpdateResultadoDto } from './dto/update-resultado.dto.js';

@Injectable()
export class ResultadosService {
  create(createResultadoDto: CreateResultadoDto) {
    return createResultadoDto;
  }

    findAll() {
    return [
      {
        id: 1,
        id_inscripcion: 101,
        id_experiencia_evidencia: 201,
        estado: 'aprobado',
        fecha_calculo: '2026-10-26T10:45:00Z'
      },
      {
        id: 2,
        id_inscripcion: 102,
        id_experiencia_evidencia: 202,
        estado: 'reprobado',
        fecha_calculo: '2026-10-26T11:00:00Z'
      }
    ];
  }


  findOne(id: number) {
    return {
      id: 1,
      id_inscripcion: 101,
      id_experiencia_evidencia: 201,
      estado: 'aprobado',
      fecha_calculo: '2026-10-26T10:45:00Z'
    }
  }

  update(id: number, updateResultadoDto: UpdateResultadoDto) {
    return {
      id: id,
      updateResultadoDto,
    }
  }

  remove(id: number) {
    return {
      id: id,
    }
  }
}

import { Injectable } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';

@Injectable()
export class ItemsService {
  create(createItemDto: CreateItemDto) {
    return createItemDto;
  }

    findAll() {
    return [
      {
        id: 1,
        id_experiencia_evidencia: 10,
        enunciado: '¿Cuál es la capital de Colombia?',
        formato: 'opcion_multiple',
        origen: 'banco_preguntas',
        estado_revision: 'aprobado',
        excluido: false
      },
      {
        id: 2,
        id_experiencia_evidencia: 12,
        enunciado: 'Explique el ciclo del agua.',
        formato: 'abierto',
        origen: 'docente_directo',
        estado_revision: 'pendiente',
        excluido: false
      }
    ];
  }


  findOne(id: number) {
    return {
      id,
      id_experiencia_evidencia: 10,
      enunciado: '¿Cuál es la capital de Colombia?',
      formato: 'opcion_multiple',
      origen: 'banco_preguntas',
      estado_revision: 'aprobado',
      excluido: false
    }
  }

  update(id: number, updateItemDto: UpdateItemDto) {
    return {
      id: id,
      updateItemDto,
    }
  }

  remove(id: number) {
    return {
      id: id,
    }
  }
}

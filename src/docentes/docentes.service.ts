import { Injectable } from '@nestjs/common';
import { CreateDocenteDto } from './dto/create-docente.dto.js';
import { UpdateDocenteDto } from './dto/update-docente.dto.js';

@Injectable()
export class DocentesService {
  create(createDocenteDto: CreateDocenteDto) {
    return createDocenteDto;
  }

    findAll() {
    return [
      { 
        id: 1, 
        nombre: 'Dagner Causil', 
        correo: 'dagner@correo.com', 
        avatar_url: 'https://ejemplo.com' 
      },
      { 
        id: 2, 
        nombre: 'Andrés Mendoza', 
        correo: 'andres@correo.com', 
        avatar_url: 'https://ejemplo.com' 
      }
    ];
  }

  findOne(id: number) {
    return { 
        id,
        nombre: 'Dagner Causil', 
        correo: 'dagner@correo.com', 
        avatar_url: 'https://ejemplo.com' 
      }
  }

  update(id: number, updateDocenteDto: UpdateDocenteDto) {
    return {
      id,
      updateDocenteDto,
    }
  }

  remove(id: number) {
    return {
      id,
    }
  }
}

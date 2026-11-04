import { Injectable } from '@nestjs/common';
import { CreateEstudianteDto } from './dto/create-estudiante.dto.js';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto.js';

@Injectable()
export class EstudiantesService {
  create(createEstudianteDto: CreateEstudianteDto) {
    return createEstudianteDto;    
  }

   findAll() {
    return [
      { 
        id: 1, 
        nombre: 'Juan Pérez', 
        correo: 'juan.perez@correo.com', 
        avatar_url: 'https://ejemplo.com' 
      },
      { 
        id: 2, 
        nombre: 'María López', 
        correo: 'maria.lopez@correo.com', 
        avatar_url: 'https://ejemplo.com' 
      }
    ];
  }

  findOne(id: number) {
    return {
      id,
      nombre: 'Juan Pérez',
      correo: 'juan.perez@correo.com',
      avatar_url: 'https://ejemplo.com'
    }
  }

  update(id: number, updateEstudianteDto: UpdateEstudianteDto) {
    return {
      id: id,
      updateEstudianteDto,
    }
  }

  remove(id: number) {
    return {
      id,
    }
  }
}

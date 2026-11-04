import { Module } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service.js';
import { EstudiantesController } from './estudiantes.controller.js';

@Module({
  controllers: [EstudiantesController],
  providers: [EstudiantesService],
})
export class EstudiantesModule {}

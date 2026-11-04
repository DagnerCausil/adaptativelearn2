import { Module } from '@nestjs/common';
import { InscripcionesService } from './inscripciones.service.js';
import { InscripcionesController } from './inscripciones.controller.js';

@Module({
  controllers: [InscripcionesController],
  providers: [InscripcionesService],
})
export class InscripcionesModule {}

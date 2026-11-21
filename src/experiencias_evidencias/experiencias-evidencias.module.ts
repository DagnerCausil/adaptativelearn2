import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Evidencia, EvidenciaSchema } from '../evidencias/schemas/evidencia.schema.js';
import {
  Experiencia,
  ExperienciaSchema,
} from '../experiencias/schemas/experiencia.schema.js';
import { ExperienciasEvidenciasController } from './experiencias-evidencias.controller.js';
import { ExperienciasEvidenciasService } from './experiencias-evidencias.service.js';
import {
  ExperienciaEvidencia,
  ExperienciaEvidenciaSchema,
} from './schemas/experiencia-evidencia.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExperienciaEvidencia.name, schema: ExperienciaEvidenciaSchema },
      { name: Experiencia.name, schema: ExperienciaSchema },
      { name: Evidencia.name, schema: EvidenciaSchema },
    ]),
  ],
  controllers: [ExperienciasEvidenciasController],
  providers: [ExperienciasEvidenciasService],
})
export class ExperienciasEvidenciasModule {}

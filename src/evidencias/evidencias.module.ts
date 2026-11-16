import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dba, DbaSchema } from '../dbas/schemas/dba.schema.js';
import {
  DictamenEvidencia,
  DictamenEvidenciaSchema,
} from '../dictamenes_evidencia/schemas/dictamen-evidencia.schema.js';
import {
  ExperienciaEvidencia,
  ExperienciaEvidenciaSchema,
} from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Evidencia, EvidenciaSchema } from './schemas/evidencia.schema.js';
import { EvidenciasController } from './evidencias.controller.js';
import { EvidenciasService } from './evidencias.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evidencia.name, schema: EvidenciaSchema },
      { name: Dba.name, schema: DbaSchema },
      { name: DictamenEvidencia.name, schema: DictamenEvidenciaSchema },
      { name: ExperienciaEvidencia.name, schema: ExperienciaEvidenciaSchema },
    ]),
  ],
  controllers: [EvidenciasController],
  providers: [EvidenciasService],
})
export class EvidenciasModule {}

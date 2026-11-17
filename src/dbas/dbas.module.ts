import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Evidencia,
  EvidenciaSchema,
} from '../evidencias/schemas/evidencia.schema.js';
import {
  Experiencia,
  ExperienciaSchema,
} from '../experiencias/schemas/experiencia.schema.js';
import { Dba, DbaSchema } from './schemas/dba.schema.js';
import { DbasController } from './dbas.controller.js';
import { DbasService } from './dbas.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dba.name, schema: DbaSchema },
      { name: Evidencia.name, schema: EvidenciaSchema },
      { name: Experiencia.name, schema: ExperienciaSchema },
    ]),
  ],
  controllers: [DbasController],
  providers: [DbasService],
})
export class DbasModule {}

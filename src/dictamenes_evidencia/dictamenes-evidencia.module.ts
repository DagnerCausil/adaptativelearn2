import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Evidencia,
  EvidenciaSchema,
} from '../evidencias/schemas/evidencia.schema.js';
import {
  DictamenEvidencia,
  DictamenEvidenciaSchema,
} from './schemas/dictamen-evidencia.schema.js';
import { DictamenesEvidenciaController } from './dictamenes-evidencia.controller.js';
import { DictamenesEvidenciaService } from './dictamenes-evidencia.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DictamenEvidencia.name, schema: DictamenEvidenciaSchema },
      { name: Evidencia.name, schema: EvidenciaSchema },
    ]),
  ],
  controllers: [DictamenesEvidenciaController],
  providers: [DictamenesEvidenciaService],
})
export class DictamenesEvidenciaModule {}

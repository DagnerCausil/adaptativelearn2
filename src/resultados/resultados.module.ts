import { Module } from '@nestjs/common';
import { ResultadosService } from './resultados.service.js';
import { ResultadosController } from './resultados.controller.js';

@Module({
  controllers: [ResultadosController],
  providers: [ResultadosService],
})
export class ResultadosModule {}

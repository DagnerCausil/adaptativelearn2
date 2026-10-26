import { Module } from '@nestjs/common';
import { DocentesService } from './docentes.service.js';
import { DocentesController } from './docentes.controller.js';

@Module({
  controllers: [DocentesController],
  providers: [DocentesService],
})
export class DocentesModule {}

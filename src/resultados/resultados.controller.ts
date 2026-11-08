import { Controller, Get, Param, Post } from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ResultadosService } from './resultados.service.js';

@ApiTags('resultados')
@Controller('resultados')
export class ResultadosController {
  constructor(private readonly resultadosService: ResultadosService) {}

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del resultado.' })
  @ApiOkResponse({ description: 'Resultado encontrado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Resultado no encontrado.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.resultadosService.findOne(id);
  }
}

@ApiTags('resultados')
@Controller('inscripciones')
export class InscripcionesResultadosController {
  constructor(private readonly resultadosService: ResultadosService) {}

  @Post(':id/calcular-resultados')
  @ApiParam({ name: 'id', description: 'ObjectId de la inscripción.' })
  @ApiCreatedResponse({ description: 'Resultados calculados.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Inscripción no encontrada.' })
  @ApiConflictResponse({
    description: 'Ya hay resultados históricos para esta inscripción.',
  })
  calcular(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.resultadosService.calcularPorInscripcion(id);
  }

  @Get(':id/resultados')
  @ApiParam({ name: 'id', description: 'ObjectId de la inscripción.' })
  @ApiOkResponse({ description: 'Resultados de la inscripción.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  findPorInscripcion(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.resultadosService.findPorInscripcion(id);
  }
}

@ApiTags('reportes')
@Controller('experiencias')
export class ExperienciasReportesController {
  constructor(private readonly resultadosService: ResultadosService) {}

  @Get(':id/reporte')
  @ApiParam({ name: 'id', description: 'ObjectId de la experiencia.' })
  @ApiOkResponse({ description: 'Reporte calculado de la experiencia.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Experiencia no encontrada.' })
  reporte(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.resultadosService.generarReporte(id);
  }
}

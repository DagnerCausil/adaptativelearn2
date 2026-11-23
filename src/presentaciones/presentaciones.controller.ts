import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { FiltroPresentacionesDto } from './dto/filtro-presentaciones.dto.js';
import { PresentacionesService } from './presentaciones.service.js';

@ApiTags('presentaciones')
@Controller('presentaciones')
export class PresentacionesController {
  constructor(private readonly presentacionesService: PresentacionesService) {}

  @Get()
  @ApiOkResponse({
    description: 'Presentaciones ordenadas por orden_presentacion.',
  })
  @ApiBadRequestResponse({ description: 'El filtro no es un ObjectId válido.' })
  findAll(@Query() filtro: FiltroPresentacionesDto) {
    return this.presentacionesService.findAll(filtro);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ObjectId de la presentación.',
  })
  @ApiOkResponse({ description: 'Presentación encontrada.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Presentación no encontrada.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.presentacionesService.findOne(id);
  }
}

@ApiTags('presentaciones')
@Controller('inscripciones')
export class InscripcionesPresentacionesController {
  constructor(private readonly presentacionesService: PresentacionesService) {}

  @Post(':id/siguiente-item')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ObjectId de la inscripción.',
  })
  @ApiOkResponse({
    description:
      '{ terminado: true } si el diagnóstico se detiene (ADR-016); si no, ' +
      '{ terminado: false, presentacion, item: { enunciado, formato }, opciones } ' +
      'con las opciones mezcladas y solo con _id, texto y grupo.',
  })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Inscripción no encontrada.' })
  @ApiConflictResponse({
    description: 'La última presentación todavía no tiene respuesta.',
  })
  siguienteItem(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.presentacionesService.siguienteItem(id);
  }
}

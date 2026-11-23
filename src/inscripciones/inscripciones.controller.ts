import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
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
import { CreateInscripcionDto } from './dto/create-inscripcion.dto.js';
import { FiltroInscripcionesDto } from './dto/filtro-inscripciones.dto.js';
import { InscripcionesService } from './inscripciones.service.js';

@ApiTags('inscripciones')
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post('unirse')
  @ApiCreatedResponse({ description: 'El estudiante quedó inscrito.' })
  @ApiBadRequestResponse({
    description: 'Datos no válidos o la experiencia está en borrador.',
  })
  @ApiNotFoundResponse({
    description: 'El estudiante o el código de invitación no existen.',
  })
  @ApiConflictResponse({ description: 'El estudiante ya estaba inscrito.' })
  unirse(@Body() createInscripcionDto: CreateInscripcionDto) {
    return this.inscripcionesService.unirse(createInscripcionDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de inscripciones.' })
  @ApiBadRequestResponse({
    description: 'Algún filtro no es un ObjectId válido.',
  })
  findAll(@Query() filtro: FiltroInscripcionesDto) {
    return this.inscripcionesService.findAll(filtro);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ObjectId de la inscripción.',
  })
  @ApiOkResponse({ description: 'Inscripción encontrada.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Inscripción no encontrada.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.inscripcionesService.findOne(id);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ObjectId de la inscripción.',
  })
  @ApiOkResponse({ description: 'Inscripción eliminada.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Inscripción no encontrada.' })
  @ApiConflictResponse({ description: 'La inscripción tiene presentaciones.' })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.inscripcionesService.remove(id);
  }
}

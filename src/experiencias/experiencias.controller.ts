import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { CreateExperienciaDto } from './dto/create-experiencia.dto.js';
import { FiltroExperienciasDto } from './dto/filtro-experiencias.dto.js';
import { UpdateExperienciaDto } from './dto/update-experiencia.dto.js';
import { ExperienciasService } from './experiencias.service.js';

@ApiTags('experiencias')
@Controller('experiencias')
export class ExperienciasController {
  constructor(private readonly experienciasService: ExperienciasService) {}

  @Post()
  @ApiCreatedResponse({
    description:
      'Experiencia creada en borrador con su código de invitación generado por el servidor.',
  })
  @ApiBadRequestResponse({ description: 'Los datos no son válidos.' })
  @ApiNotFoundResponse({ description: 'El docente o el DBA no existen.' })
  create(@Body() createExperienciaDto: CreateExperienciaDto) {
    return this.experienciasService.create(createExperienciaDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de experiencias.' })
  @ApiBadRequestResponse({ description: 'id_docente no es un ObjectId válido.' })
  findAll(@Query() filtro: FiltroExperienciasDto) {
    return this.experienciasService.findAll(filtro);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ObjectId de la experiencia.' })
  @ApiOkResponse({ description: 'Experiencia encontrada.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Experiencia no encontrada.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.experienciasService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'ObjectId de la experiencia.' })
  @ApiOkResponse({ description: 'Nombre actualizado.' })
  @ApiBadRequestResponse({
    description: 'Datos no válidos o la experiencia ya no está en borrador.',
  })
  @ApiNotFoundResponse({ description: 'Experiencia no encontrada.' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateExperienciaDto: UpdateExperienciaDto,
  ) {
    return this.experienciasService.update(id, updateExperienciaDto);
  }

  @Post(':id/publicar')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'ObjectId de la experiencia.' })
  @ApiOkResponse({ description: 'Experiencia publicada.' })
  @ApiBadRequestResponse({
    description:
      'No está en borrador o no tiene ninguna evidencia incluida.',
  })
  @ApiNotFoundResponse({ description: 'Experiencia no encontrada.' })
  publicar(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.experienciasService.publicar(id);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'ObjectId de la experiencia.' })
  @ApiOkResponse({ description: 'Experiencia eliminada.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Experiencia no encontrada.' })
  @ApiConflictResponse({
    description: 'La experiencia tiene inscripciones o ítems en su banco.',
  })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.experienciasService.remove(id);
  }
}

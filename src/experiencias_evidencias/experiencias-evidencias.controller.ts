import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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
import { CambiarInclusionDto } from './dto/cambiar-inclusion.dto.js';
import { CreateExperienciaEvidenciaDto } from './dto/create-experiencia-evidencia.dto.js';
import { ExperienciasEvidenciasService } from './experiencias-evidencias.service.js';

@ApiTags('experiencias_evidencias')
@Controller('experiencias')
export class ExperienciasEvidenciasController {
  constructor(private readonly service: ExperienciasEvidenciasService) {}

  @Post(':id/evidencias')
  @ApiParam({ name: 'id', description: 'ObjectId de la experiencia.' })
  @ApiCreatedResponse({ description: 'Evidencia seleccionada (incluida = true).' })
  @ApiBadRequestResponse({
    description: 'Datos no válidos o la evidencia es de otro DBA.',
  })
  @ApiNotFoundResponse({ description: 'La experiencia o la evidencia no existen.' })
  @ApiConflictResponse({ description: 'La evidencia ya estaba seleccionada.' })
  seleccionar(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: CreateExperienciaEvidenciaDto,
  ) {
    return this.service.seleccionar(id, dto);
  }

  @Get(':id/evidencias')
  @ApiParam({ name: 'id', description: 'ObjectId de la experiencia.' })
  @ApiOkResponse({
    description: 'Evidencias seleccionadas, con sus datos, ordenadas por número.',
  })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Experiencia no encontrada.' })
  listar(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.listar(id);
  }

  @Patch(':id/evidencias/:idSeleccion')
  @ApiParam({ name: 'id', description: 'ObjectId de la experiencia.' })
  @ApiParam({
    name: 'idSeleccion',
    description: 'ObjectId de la selección (experiencias_evidencias).',
  })
  @ApiOkResponse({ description: 'Inclusión actualizada.' })
  @ApiBadRequestResponse({ description: 'Los IDs o los datos no son válidos.' })
  @ApiNotFoundResponse({ description: 'La selección no existe en esta experiencia.' })
  cambiarInclusion(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Param('idSeleccion', ParseObjectIdPipe) idSeleccion: Types.ObjectId,
    @Body() dto: CambiarInclusionDto,
  ) {
    return this.service.cambiarInclusion(id, idSeleccion, dto);
  }
}

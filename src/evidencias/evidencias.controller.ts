import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { CreateEvidenciaDto } from './dto/create-evidencia.dto.js';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto.js';
import { EvidenciasService } from './evidencias.service.js';

@ApiTags('evidencias')
@Controller('evidencias')
export class EvidenciasController {
  constructor(private readonly evidenciasService: EvidenciasService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Evidencia creada (uso de administración).',
  })
  @ApiBadRequestResponse({
    description: 'Los datos de la evidencia no son válidos.',
  })
  @ApiNotFoundResponse({ description: 'El DBA no existe.' })
  @ApiConflictResponse({
    description: 'Ya existe una evidencia con ese número en el mismo DBA.',
  })
  create(@Body() createEvidenciaDto: CreateEvidenciaDto) {
    return this.evidenciasService.create(createEvidenciaDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de evidencias.' })
  findAll() {
    return this.evidenciasService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ObjectId de la evidencia.' })
  @ApiOkResponse({ description: 'Evidencia encontrada.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Evidencia no encontrada.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.evidenciasService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'ObjectId de la evidencia.' })
  @ApiOkResponse({ description: 'Evidencia actualizada.' })
  @ApiBadRequestResponse({ description: 'El ID o los datos no son válidos.' })
  @ApiNotFoundResponse({ description: 'La evidencia o el DBA no existen.' })
  @ApiConflictResponse({
    description: 'Ya existe una evidencia con ese número en el mismo DBA.',
  })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateEvidenciaDto: UpdateEvidenciaDto,
  ) {
    return this.evidenciasService.update(id, updateEvidenciaDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'ObjectId de la evidencia.' })
  @ApiOkResponse({ description: 'Evidencia eliminada.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Evidencia no encontrada.' })
  @ApiConflictResponse({
    description:
      'La evidencia tiene dictamen o está seleccionada en experiencias.',
  })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.evidenciasService.remove(id);
  }
}

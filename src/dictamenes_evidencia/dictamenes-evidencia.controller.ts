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
import { CreateDictamenEvidenciaDto } from './dto/create-dictamen-evidencia.dto.js';
import { UpdateDictamenEvidenciaDto } from './dto/update-dictamen-evidencia.dto.js';
import { DictamenesEvidenciaService } from './dictamenes-evidencia.service.js';

@ApiTags('dictamenes_evidencia')
@Controller('dictamenes_evidencia')
export class DictamenesEvidenciaController {
  constructor(private readonly dictamenesService: DictamenesEvidenciaService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Dictamen creado; fecha_dictamen la pone el servidor.',
  })
  @ApiBadRequestResponse({
    description: 'Los datos del dictamen no son válidos.',
  })
  @ApiNotFoundResponse({ description: 'La evidencia no existe.' })
  @ApiConflictResponse({ description: 'La evidencia ya tiene un dictamen.' })
  create(@Body() createDictamenDto: CreateDictamenEvidenciaDto) {
    return this.dictamenesService.create(createDictamenDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de dictámenes.' })
  findAll() {
    return this.dictamenesService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del dictamen.' })
  @ApiOkResponse({ description: 'Dictamen encontrado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Dictamen no encontrado.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.dictamenesService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del dictamen.' })
  @ApiOkResponse({
    description: 'Dictamen actualizado; fecha_dictamen se renueva.',
  })
  @ApiBadRequestResponse({ description: 'El ID o los datos no son válidos.' })
  @ApiNotFoundResponse({ description: 'Dictamen no encontrado.' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateDictamenDto: UpdateDictamenEvidenciaDto,
  ) {
    return this.dictamenesService.update(id, updateDictamenDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del dictamen.' })
  @ApiOkResponse({ description: 'Dictamen eliminado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Dictamen no encontrado.' })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.dictamenesService.remove(id);
  }
}

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
import { CreateDbaDto } from './dto/create-dba.dto.js';
import { UpdateDbaDto } from './dto/update-dba.dto.js';
import { DbasService } from './dbas.service.js';

@ApiTags('dbas')
@Controller('dbas')
export class DbasController {
  constructor(private readonly dbasService: DbasService) {}

  @Post()
  @ApiCreatedResponse({ description: 'DBA creado (uso de administración).' })
  @ApiBadRequestResponse({ description: 'Los datos del DBA no son válidos.' })
  @ApiConflictResponse({ description: 'El código del DBA ya está registrado.' })
  create(@Body() createDbaDto: CreateDbaDto) {
    return this.dbasService.create(createDbaDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de DBA ordenada por código.' })
  findAll() {
    return this.dbasService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del DBA.' })
  @ApiOkResponse({ description: 'DBA encontrado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'DBA no encontrado.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.dbasService.findOne(id);
  }

  @Get(':id/evidencias')
  @ApiParam({ name: 'id', description: 'ObjectId del DBA.' })
  @ApiOkResponse({
    description: 'Evidencias del DBA ordenadas por número.',
  })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'DBA no encontrado.' })
  findEvidencias(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.dbasService.findEvidencias(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del DBA.' })
  @ApiOkResponse({ description: 'DBA actualizado.' })
  @ApiBadRequestResponse({
    description:
      'El ID o los datos no son válidos; codigo no se puede cambiar.',
  })
  @ApiNotFoundResponse({ description: 'DBA no encontrado.' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateDbaDto: UpdateDbaDto,
  ) {
    return this.dbasService.update(id, updateDbaDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del DBA.' })
  @ApiOkResponse({ description: 'DBA eliminado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'DBA no encontrado.' })
  @ApiConflictResponse({
    description: 'El DBA tiene evidencias o experiencias asociadas.',
  })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.dbasService.remove(id);
  }
}

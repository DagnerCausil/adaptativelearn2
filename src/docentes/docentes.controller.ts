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
import { CreateDocenteDto } from './dto/create-docente.dto.js';
import { UpdateDocenteDto } from './dto/update-docente.dto.js';
import { DocentesService } from './docentes.service.js';

@ApiTags('docentes')
@Controller('docentes')
export class DocentesController {
  constructor(private readonly docentesService: DocentesService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Docente creado.' })
  @ApiBadRequestResponse({ description: 'Los datos del docente no son válidos.' })
  @ApiConflictResponse({ description: 'El correo ya está registrado.' })
  create(@Body() createDocenteDto: CreateDocenteDto) {
    return this.docentesService.create(createDocenteDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de docentes.' })
  findAll() {
    return this.docentesService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del docente.' })
  @ApiOkResponse({ description: 'Docente encontrado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Docente no encontrado.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.docentesService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del docente.' })
  @ApiOkResponse({ description: 'Docente actualizado.' })
  @ApiBadRequestResponse({ description: 'El ID o los datos no son válidos.' })
  @ApiNotFoundResponse({ description: 'Docente no encontrado.' })
  @ApiConflictResponse({ description: 'El correo ya está registrado.' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateDocenteDto: UpdateDocenteDto,
  ) {
    return this.docentesService.update(id, updateDocenteDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del docente.' })
  @ApiOkResponse({ description: 'Docente eliminado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Docente no encontrado.' })
  @ApiConflictResponse({
    description: 'El docente tiene experiencias asociadas.',
  })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.docentesService.remove(id);
  }
}

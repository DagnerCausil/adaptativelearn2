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
import { CreateEstudianteDto } from './dto/create-estudiante.dto.js';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto.js';
import { EstudiantesService } from './estudiantes.service.js';

@ApiTags('estudiantes')
@Controller('estudiantes')
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Estudiante creado.' })
  @ApiBadRequestResponse({
    description: 'Los datos del estudiante no son válidos.',
  })
  @ApiConflictResponse({ description: 'El correo ya está registrado.' })
  create(@Body() createEstudianteDto: CreateEstudianteDto) {
    return this.estudiantesService.create(createEstudianteDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de estudiantes.' })
  findAll() {
    return this.estudiantesService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del estudiante.' })
  @ApiOkResponse({ description: 'Estudiante encontrado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Estudiante no encontrado.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.estudiantesService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del estudiante.' })
  @ApiOkResponse({ description: 'Estudiante actualizado.' })
  @ApiBadRequestResponse({ description: 'El ID o los datos no son válidos.' })
  @ApiNotFoundResponse({ description: 'Estudiante no encontrado.' })
  @ApiConflictResponse({ description: 'El correo ya está registrado.' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateEstudianteDto: UpdateEstudianteDto,
  ) {
    return this.estudiantesService.update(id, updateEstudianteDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'ObjectId del estudiante.' })
  @ApiOkResponse({ description: 'Estudiante eliminado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Estudiante no encontrado.' })
  @ApiConflictResponse({
    description: 'El estudiante tiene inscripciones asociadas.',
  })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.estudiantesService.remove(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InscripcionesService } from './inscripciones.service.js';
import { CreateInscripcioneDto } from './dto/create-inscripcione.dto.js';
import { UpdateInscripcioneDto } from './dto/update-inscripcione.dto.js';

@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post()
  create(@Body() createInscripcioneDto: CreateInscripcioneDto) {
    return this.inscripcionesService.create(createInscripcioneDto);
  }

  @Get()
  findAll() {
    return this.inscripcionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inscripcionesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInscripcioneDto: UpdateInscripcioneDto) {
    return this.inscripcionesService.update(+id, updateInscripcioneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inscripcionesService.remove(+id);
  }
}

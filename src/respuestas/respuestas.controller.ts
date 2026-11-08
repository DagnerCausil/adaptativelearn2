import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreateRespuestaDto } from './dto/create-respuesta.dto.js';
import { RespuestasService } from './respuestas.service.js';

@ApiTags('respuestas')
@Controller('respuestas')
export class RespuestasController {
  constructor(private readonly respuestasService: RespuestasService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Respuesta creada.' })
  @ApiBadRequestResponse({
    description: 'Los datos o las opciones no son válidos.',
  })
  @ApiNotFoundResponse({ description: 'La presentación o el ítem no existe.' })
  @ApiConflictResponse({
    description: 'La presentación ya tiene una respuesta.',
  })
  create(@Body() dto: CreateRespuestaDto) {
    return this.respuestasService.create(dto);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ObjectId de la respuesta.' })
  @ApiOkResponse({ description: 'Respuesta y opciones seleccionadas.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Respuesta no encontrada.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.respuestasService.findOne(id);
  }
}

@ApiTags('respuestas')
@Controller('presentaciones')
export class RespuestaPresentacionesController {
  constructor(private readonly respuestasService: RespuestasService) {}

  @Get(':id/respuesta')
  @ApiParam({ name: 'id', description: 'ObjectId de la presentación.' })
  @ApiOkResponse({ description: 'Respuesta y opciones seleccionadas.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({
    description: 'La presentación o su respuesta no existe.',
  })
  findByPresentacion(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.respuestasService.findByPresentacion(id);
  }
}

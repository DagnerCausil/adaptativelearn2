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
import { CreateOpcionDto } from './dto/create-opcion.dto.js';
import { UpdateOpcionDto } from './dto/update-opcion.dto.js';
import { OpcionesService } from './opciones.service.js';

@ApiTags('opciones')
@Controller('items')
export class ItemOpcionesController {
  constructor(private readonly opcionesService: OpcionesService) {}

  @Post(':id/opciones')
  @ApiParam({ name: 'id', type: String, description: 'ObjectId del ítem.' })
  @ApiCreatedResponse({ description: 'Opción creada.' })
  @ApiBadRequestResponse({
    description:
      'Los datos no son válidos o hay grupo en un ítem que no es matching.',
  })
  @ApiNotFoundResponse({ description: 'Ítem no encontrado.' })
  create(
    @Param('id', ParseObjectIdPipe) idItem: Types.ObjectId,
    @Body() createOpcionDto: CreateOpcionDto,
  ) {
    return this.opcionesService.create(idItem, createOpcionDto);
  }

  @Get(':id/opciones')
  @ApiParam({ name: 'id', type: String, description: 'ObjectId del ítem.' })
  @ApiOkResponse({ description: 'Opciones del ítem ordenadas por orden.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Ítem no encontrado.' })
  findByItem(@Param('id', ParseObjectIdPipe) idItem: Types.ObjectId) {
    return this.opcionesService.findByItem(idItem);
  }
}

@ApiTags('opciones')
@Controller('opciones')
export class OpcionesController {
  constructor(private readonly opcionesService: OpcionesService) {}

  @Get(':id')
  @ApiParam({ name: 'id', type: String, description: 'ObjectId de la opción.' })
  @ApiOkResponse({ description: 'Opción encontrada.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Opción no encontrada.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.opcionesService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String, description: 'ObjectId de la opción.' })
  @ApiOkResponse({ description: 'Opción actualizada.' })
  @ApiBadRequestResponse({
    description:
      'Los datos no son válidos o hay grupo en un ítem que no es matching.',
  })
  @ApiNotFoundResponse({ description: 'Opción no encontrada.' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateOpcionDto: UpdateOpcionDto,
  ) {
    return this.opcionesService.update(id, updateOpcionDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String, description: 'ObjectId de la opción.' })
  @ApiOkResponse({ description: 'Opción eliminada.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Opción no encontrada.' })
  @ApiConflictResponse({ description: 'Un estudiante ya eligió la opción.' })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.opcionesService.remove(id);
  }
}

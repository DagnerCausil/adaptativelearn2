import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreateItemDto } from './dto/create-item.dto.js';
import { FiltroItemsDto } from './dto/filtro-items.dto.js';
import { RevisionItemDto } from './dto/revision-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { ItemsService } from './items.service.js';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Ítem creado en borrador.' })
  @ApiBadRequestResponse({ description: 'Los datos del ítem no son válidos.' })
  @ApiNotFoundResponse({
    description: 'La evidencia seleccionada en la experiencia no existe.',
  })
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de ítems.' })
  @ApiBadRequestResponse({ description: 'El filtro no es un ObjectId válido.' })
  findAll(@Query() filtro: FiltroItemsDto) {
    return this.itemsService.findAll(filtro);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, description: 'ObjectId del ítem.' })
  @ApiOkResponse({ description: 'Ítem encontrado.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Ítem no encontrado.' })
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String, description: 'ObjectId del ítem.' })
  @ApiOkResponse({ description: 'Ítem actualizado.' })
  @ApiBadRequestResponse({ description: 'El ID o los datos no son válidos.' })
  @ApiNotFoundResponse({ description: 'Ítem no encontrado.' })
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.itemsService.update(id, updateItemDto);
  }

  @Patch(':id/revision')
  @ApiParam({ name: 'id', type: String, description: 'ObjectId del ítem.' })
  @ApiOkResponse({ description: 'El docente aprobó o rechazó el ítem.' })
  @ApiBadRequestResponse({ description: 'El ID o la decisión no son válidos.' })
  @ApiNotFoundResponse({ description: 'Ítem no encontrado.' })
  revisar(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() revisionItemDto: RevisionItemDto,
  ) {
    return this.itemsService.revisar(id, revisionItemDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String, description: 'ObjectId del ítem.' })
  @ApiOkResponse({ description: 'Ítem eliminado junto con sus opciones.' })
  @ApiBadRequestResponse({ description: 'El ID no es un ObjectId válido.' })
  @ApiNotFoundResponse({ description: 'Ítem no encontrado.' })
  @ApiConflictResponse({
    description: 'El ítem ya se presentó a estudiantes.',
  })
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.itemsService.remove(id);
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Opcion } from '../opciones/schemas/opcion.schema.js';
import { Presentacion } from '../presentaciones/schemas/presentacion.schema.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { FiltroItemsDto } from './dto/filtro-items.dto.js';
import { RevisionItemDto } from './dto/revision-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { faltantesRI4 } from './regla-opciones.js';
import { Item, ItemDocument } from './schemas/item.schema.js';

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    @InjectModel(Opcion.name)
    private readonly opcionModel: Model<Opcion>,
    @InjectModel(ExperienciaEvidencia.name)
    private readonly experienciaEvidenciaModel: Model<ExperienciaEvidencia>,
    @InjectModel(Presentacion.name)
    private readonly presentacionModel: Model<Presentacion>,
  ) {}

  async create(dto: CreateItemDto): Promise<ItemDocument> {
    const idSeleccion = new Types.ObjectId(dto.id_experiencia_evidencia);
    const seleccion = await this.experienciaEvidenciaModel
      .findById(idSeleccion)
      .exec();
    if (!seleccion) {
      throw new NotFoundException(
        'La evidencia seleccionada en la experiencia no existe.',
      );
    }

    // estado_revision y excluido los pone el servidor (control docente).
    return this.itemModel.create({
      id_experiencia_evidencia: idSeleccion,
      enunciado: dto.enunciado,
      formato: dto.formato,
      origen: dto.origen,
      estado_revision: 'borrador',
      excluido: false,
    });
  }

  findAll(filtro: FiltroItemsDto = {}): Promise<ItemDocument[]> {
    const condicion = filtro.id_experiencia_evidencia
      ? {
          id_experiencia_evidencia: new Types.ObjectId(
            filtro.id_experiencia_evidencia,
          ),
        }
      : {};
    return this.itemModel.find(condicion).exec();
  }

  async findOne(id: Types.ObjectId): Promise<ItemDocument> {
    const item = await this.itemModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException('Ítem no encontrado.');
    }

    return item;
  }

  async update(id: Types.ObjectId, dto: UpdateItemDto): Promise<ItemDocument> {
    await this.findOne(id);

    if (dto.formato && dto.formato !== 'matching') {
      const tieneGrupo = await this.opcionModel.exists({
        id_item: id,
        grupo: { $exists: true, $ne: null },
      });
      if (tieneGrupo) {
        throw new BadRequestException(
          'El ítem tiene opciones con grupo; grupo solo se permite en ítems matching.',
        );
      }
    }

    const item = await this.itemModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!item) {
      throw new NotFoundException('Ítem no encontrado.');
    }

    return item;
  }

  async revisar(
    id: Types.ObjectId,
    dto: RevisionItemDto,
  ): Promise<ItemDocument> {
    const item = await this.itemModel
      .findByIdAndUpdate(
        id,
        { estado_revision: dto.estado_revision },
        { new: true, runValidators: true },
      )
      .exec();
    if (!item) {
      throw new NotFoundException('Ítem no encontrado.');
    }

    return item;
  }

  async remove(id: Types.ObjectId): Promise<ItemDocument> {
    const item = await this.findOne(id);

    const tienePresentaciones = await this.presentacionModel.exists({
      id_item: id,
    });
    if (tienePresentaciones) {
      throw new ConflictException(
        'No se puede eliminar un ítem que ya se presentó a estudiantes.',
      );
    }

    // Sin presentaciones no hay respuestas, así que sus opciones se borran con él.
    await this.opcionModel.deleteMany({ id_item: id }).exec();
    await this.itemModel.findByIdAndDelete(id).exec();
    return item;
  }

  /** RI-4 / H-9: lanza 400 si el ítem no cumple el mínimo de opciones de su formato. */
  async validarOpciones(idItem: Types.ObjectId): Promise<void> {
    const item = await this.findOne(idItem);
    const opciones = await this.opcionModel.find({ id_item: idItem }).exec();
    const faltantes = faltantesRI4(item.formato, opciones);
    if (faltantes.length > 0) {
      throw new BadRequestException(
        `El ítem "${item.enunciado}" (${item._id.toString()}) no cumple RI-4: ${faltantes.join('; ')}.`,
      );
    }
  }

  /**
   * Aplica RI-4 a los ítems aprobados y no excluidos de la experiencia (control docente).
   * Se llama al publicar la experiencia; lanza 400 con todos los ítems que fallan.
   */
  async validarBancoDeExperiencia(
    idExperiencia: Types.ObjectId,
  ): Promise<void> {
    const selecciones = await this.experienciaEvidenciaModel
      .find({ id_experiencia: idExperiencia })
      .exec();
    if (selecciones.length === 0) {
      return;
    }

    const items = await this.itemModel
      .find({
        id_experiencia_evidencia: {
          $in: selecciones.map((seleccion) => seleccion._id),
        },
        estado_revision: 'aprobado',
        excluido: false,
      })
      .exec();

    const errores: string[] = [];
    for (const item of items) {
      const opciones = await this.opcionModel
        .find({ id_item: item._id })
        .exec();
      const faltantes = faltantesRI4(item.formato, opciones);
      if (faltantes.length > 0) {
        errores.push(
          `"${item.enunciado}" (${item._id.toString()}): ${faltantes.join('; ')}`,
        );
      }
    }

    if (errores.length > 0) {
      throw new BadRequestException(
        `No se puede publicar: hay ítems aprobados que no cumplen RI-4. ${errores.join(' | ')}.`,
      );
    }
  }
}

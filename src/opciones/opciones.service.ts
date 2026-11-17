import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Item, ItemDocument } from '../items/schemas/item.schema.js';
import { RespuestaOpcion } from '../respuestas_opciones/schemas/respuesta-opcion.schema.js';
import { CreateOpcionDto } from './dto/create-opcion.dto.js';
import { UpdateOpcionDto } from './dto/update-opcion.dto.js';
import { Opcion, OpcionDocument } from './schemas/opcion.schema.js';

const MENSAJE_GRUPO = 'grupo solo se permite en ítems matching.';

@Injectable()
export class OpcionesService {
  constructor(
    @InjectModel(Opcion.name)
    private readonly opcionModel: Model<Opcion>,
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    @InjectModel(RespuestaOpcion.name)
    private readonly respuestaOpcionModel: Model<RespuestaOpcion>,
  ) {}

  private async buscarItem(idItem: Types.ObjectId): Promise<ItemDocument> {
    const item = await this.itemModel.findById(idItem).exec();
    if (!item) {
      throw new NotFoundException('Ítem no encontrado.');
    }

    return item;
  }

  async create(
    idItem: Types.ObjectId,
    dto: CreateOpcionDto,
  ): Promise<OpcionDocument> {
    const item = await this.buscarItem(idItem);
    if (dto.grupo && item.formato !== 'matching') {
      throw new BadRequestException(MENSAJE_GRUPO);
    }

    return this.opcionModel.create({ ...dto, id_item: idItem });
  }

  async findByItem(idItem: Types.ObjectId): Promise<OpcionDocument[]> {
    await this.buscarItem(idItem);
    return this.opcionModel.find({ id_item: idItem }).sort({ orden: 1 }).exec();
  }

  async findOne(id: Types.ObjectId): Promise<OpcionDocument> {
    const opcion = await this.opcionModel.findById(id).exec();
    if (!opcion) {
      throw new NotFoundException('Opción no encontrada.');
    }

    return opcion;
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateOpcionDto,
  ): Promise<OpcionDocument> {
    const actual = await this.findOne(id);
    if (dto.grupo) {
      const item = await this.buscarItem(actual.id_item);
      if (item.formato !== 'matching') {
        throw new BadRequestException(MENSAJE_GRUPO);
      }
    }

    const opcion = await this.opcionModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!opcion) {
      throw new NotFoundException('Opción no encontrada.');
    }

    return opcion;
  }

  async remove(id: Types.ObjectId): Promise<OpcionDocument> {
    const opcion = await this.findOne(id);

    const fueElegida = await this.respuestaOpcionModel.exists({
      id_opcion: id,
    });
    if (fueElegida) {
      throw new ConflictException(
        'No se puede eliminar una opción que ya eligió un estudiante.',
      );
    }

    await this.opcionModel.findByIdAndDelete(id).exec();
    return opcion;
  }
}

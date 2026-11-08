import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { FORMATO_ITEM } from '../common/enums.js';
import { Item } from '../items/schemas/item.schema.js';
import { Opcion } from '../opciones/schemas/opcion.schema.js';
import { Presentacion } from '../presentaciones/schemas/presentacion.schema.js';
import { CreateRespuestaDto } from './dto/create-respuesta.dto.js';
import { calcularCorrecta } from './regla-correccion.js';
import { Respuesta, RespuestaDocument } from './schemas/respuesta.schema.js';
import { RespuestaOpcion } from '../respuestas_opciones/schemas/respuesta-opcion.schema.js';

function esIndiceUnicoDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class RespuestasService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(Respuesta.name)
    private readonly respuestaModel: Model<Respuesta>,
    @InjectModel(RespuestaOpcion.name)
    private readonly respuestaOpcionModel: Model<RespuestaOpcion>,
    @InjectModel(Presentacion.name)
    private readonly presentacionModel: Model<Presentacion>,
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    @InjectModel(Opcion.name)
    private readonly opcionModel: Model<Opcion>,
  ) {}

  async create(dto: CreateRespuestaDto) {
    if (!Number.isInteger(dto.certeza) || dto.certeza < 0 || dto.certeza > 5) {
      throw new BadRequestException('La certeza debe ser un entero de 0 a 5.');
    }

    const idPresentacion = new Types.ObjectId(dto.id_presentacion);
    const presentacion = await this.presentacionModel
      .findById(idPresentacion)
      .exec();
    if (!presentacion) {
      throw new NotFoundException('Presentación no encontrada.');
    }

    const respuestaExistente = await this.respuestaModel
      .findOne({ id_presentacion: idPresentacion })
      .exec();
    if (respuestaExistente) {
      throw new ConflictException('La presentación ya tiene una respuesta.');
    }

    const item = await this.itemModel.findById(presentacion.id_item).exec();
    if (!item) {
      throw new NotFoundException('El ítem de la presentación no existe.');
    }
    if (!FORMATO_ITEM.includes(item.formato)) {
      throw new BadRequestException('El formato del ítem no es válido.');
    }

    this.validarValoresSegunFormato(item.formato, dto.opciones);

    const idsOpcion = dto.opciones.map(
      (opcion) => new Types.ObjectId(opcion.id_opcion),
    );
    if (new Set(idsOpcion.map((id) => id.toString())).size !== idsOpcion.length) {
      throw new BadRequestException('No se puede seleccionar una opción más de una vez.');
    }

    const opcionesPorId = new Map(
      (
        await this.opcionModel.find({ id_item: presentacion.id_item }).exec()
      ).map((opcion) => [opcion._id.toString(), opcion]),
    );
    const opcionesSeleccionadas = dto.opciones.map((seleccion) => {
      const idOpcion = new Types.ObjectId(seleccion.id_opcion).toString();
      const opcion = opcionesPorId.get(idOpcion);
      if (!opcion || opcion.id_item.toString() !== presentacion.id_item.toString()) {
        throw new BadRequestException(
          'Todas las opciones deben pertenecer al ítem de la presentación.',
        );
      }

      return {
        opcion,
        valor_dado: seleccion.valor_dado,
      };
    });

    const seleccionPorId = new Map(
      opcionesSeleccionadas.map(({ opcion, valor_dado }) => [
        opcion._id.toString(),
        valor_dado,
      ]),
    );
    const opcionesParaCorreccion =
      item.formato === 'single_choice'
        ? opcionesSeleccionadas
        : [...opcionesPorId.values()].map((opcion) => ({
            opcion,
            valor_dado: seleccionPorId.get(opcion._id.toString()),
          }));
    const correcta = calcularCorrecta(
      item.formato,
      opcionesParaCorreccion.map(({ opcion, valor_dado }) => ({
        valor_dado,
        orden: opcion.orden,
        es_correcta: opcion.es_correcta,
        grupo: opcion.grupo,
      })),
    );

    const session = await this.connection.startSession();
    try {
      let resultado:
        | (Record<string, unknown> & { opciones: RespuestaOpcion[] })
        | undefined;
      await session.withTransaction(async () => {
        const [respuesta] = await this.respuestaModel.create(
          [
            {
              id_presentacion: idPresentacion,
              certeza: dto.certeza,
              correcta,
            },
          ],
          { session },
        );
        const respuestasOpciones = await this.respuestaOpcionModel.insertMany(
          opcionesSeleccionadas.map(({ opcion, valor_dado }) => ({
            id_respuesta: respuesta._id,
            id_opcion: opcion._id,
            ...(valor_dado === undefined ? {} : { valor_dado }),
          })),
          { session },
        );

        resultado = {
          ...respuesta.toObject(),
          opciones: respuestasOpciones,
        };
      });

      if (!resultado) {
        throw new Error('La transacción no produjo una respuesta.');
      }

      return resultado;
    } catch (error) {
      if (esIndiceUnicoDuplicado(error)) {
        throw new ConflictException('La presentación ya tiene una respuesta.');
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findOne(id: Types.ObjectId) {
    const respuesta = await this.respuestaModel.findById(id).exec();
    if (!respuesta) {
      throw new NotFoundException('Respuesta no encontrada.');
    }

    return this.incluirOpciones(respuesta);
  }

  async findByPresentacion(idPresentacion: Types.ObjectId) {
    const presentacion = await this.presentacionModel
      .findById(idPresentacion)
      .exec();
    if (!presentacion) {
      throw new NotFoundException('Presentación no encontrada.');
    }

    const respuesta = await this.respuestaModel
      .findOne({ id_presentacion: idPresentacion })
      .exec();
    if (!respuesta) {
      throw new NotFoundException('La presentación todavía no tiene respuesta.');
    }

    return this.incluirOpciones(respuesta);
  }

  private validarValoresSegunFormato(
    formato: (typeof FORMATO_ITEM)[number],
    opciones: CreateRespuestaDto['opciones'],
  ): void {
    const valorDadoEsObligatorio =
      formato === 'ordering' || formato === 'matching';

    for (const opcion of opciones) {
      if (valorDadoEsObligatorio && opcion.valor_dado === undefined) {
        throw new BadRequestException(
          'valor_dado es obligatorio en formatos ordering y matching.',
        );
      }

      if (formato === 'single_choice' && opcion.valor_dado !== undefined) {
        throw new BadRequestException(
          'valor_dado no se envía en el formato single_choice.',
        );
      }
    }
  }

  private async incluirOpciones(respuesta: RespuestaDocument) {
    const opciones = await this.respuestaOpcionModel
      .find({ id_respuesta: respuesta._id })
      .exec();

    return {
      ...respuesta.toObject(),
      opciones,
    };
  }
}

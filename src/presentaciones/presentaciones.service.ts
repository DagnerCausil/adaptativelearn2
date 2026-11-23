import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Inscripcion } from '../inscripciones/schemas/inscripcion.schema.js';
import { Item } from '../items/schemas/item.schema.js';
import { Opcion } from '../opciones/schemas/opcion.schema.js';
import { Respuesta } from '../respuestas/schemas/respuesta.schema.js';
import { FiltroPresentacionesDto } from './dto/filtro-presentaciones.dto.js';
import { debeTerminar } from './regla-parada.js';
import { elegirItem } from './reparto-evidencias.js';
import {
  Presentacion,
  PresentacionDocument,
} from './schemas/presentacion.schema.js';

/** Lo único que el estudiante ve de una opción: nunca es_correcta, orden ni hipotesis_error. */
export interface OpcionParaEstudiante {
  _id: Types.ObjectId;
  texto: string;
  grupo?: string;
}

export type SiguienteItem =
  | { terminado: true }
  | {
      terminado: false;
      presentacion: PresentacionDocument;
      item: { enunciado: string; formato: string };
      opciones: OpcionParaEstudiante[];
    };

function esIndiceUnicoDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

@Injectable()
export class PresentacionesService {
  constructor(
    @InjectModel(Presentacion.name)
    private readonly presentacionModel: Model<Presentacion>,
    @InjectModel(Inscripcion.name)
    private readonly inscripcionModel: Model<Inscripcion>,
    @InjectModel(Respuesta.name)
    private readonly respuestaModel: Model<Respuesta>,
    @InjectModel(ExperienciaEvidencia.name)
    private readonly experienciaEvidenciaModel: Model<ExperienciaEvidencia>,
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    @InjectModel(Opcion.name)
    private readonly opcionModel: Model<Opcion>,
  ) {}

  findAll(
    filtro: FiltroPresentacionesDto = {},
  ): Promise<PresentacionDocument[]> {
    const condicion = filtro.id_inscripcion
      ? { id_inscripcion: new Types.ObjectId(filtro.id_inscripcion) }
      : {};
    return this.presentacionModel
      .find(condicion)
      .sort({ orden_presentacion: 1 })
      .exec();
  }

  async findOne(id: Types.ObjectId): Promise<PresentacionDocument> {
    const presentacion = await this.presentacionModel.findById(id).exec();
    if (!presentacion) {
      throw new NotFoundException('Presentación no encontrada.');
    }

    return presentacion;
  }

  async siguienteItem(idInscripcion: Types.ObjectId): Promise<SiguienteItem> {
    const inscripcion = await this.inscripcionModel
      .findById(idInscripcion)
      .exec();
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada.');
    }

    const presentaciones = await this.presentacionModel
      .find({ id_inscripcion: idInscripcion })
      .sort({ orden_presentacion: 1 })
      .exec();
    const respuestas = presentaciones.length
      ? await this.respuestaModel
          .find({
            id_presentacion: { $in: presentaciones.map((p) => p._id) },
          })
          .exec()
      : [];
    const respondidas = new Set(
      respuestas.map((respuesta) => respuesta.id_presentacion.toString()),
    );

    const ultima = presentaciones.at(-1);
    if (ultima && !respondidas.has(ultima._id.toString())) {
      throw new ConflictException(
        'Primero debe responder el ítem que se le presentó.',
      );
    }

    const evidencias = await this.experienciaEvidenciaModel
      .find({ id_experiencia: inscripcion.id_experiencia, incluida: true })
      .sort({ _id: 1 })
      .exec();
    const ordenEvidencias = evidencias.map((evidencia) =>
      evidencia._id.toString(),
    );
    const items = ordenEvidencias.length
      ? await this.itemModel
          .find({
            id_experiencia_evidencia: { $in: evidencias.map((e) => e._id) },
            estado_revision: 'aprobado',
            excluido: false,
          })
          .sort({ _id: 1 })
          .exec()
      : [];

    const idsPresentados = presentaciones.map((p) => p.id_item);
    const presentados = new Set(idsPresentados.map((id) => id.toString()));
    const disponibles = items.filter(
      (item) => !presentados.has(item._id.toString()),
    );

    const terminado = debeTerminar({
      presentadas: presentaciones.length,
      respuestas,
      quedanItems: disponibles.length > 0,
    });
    if (terminado) {
      return { terminado: true };
    }

    const itemsPresentados = idsPresentados.length
      ? await this.itemModel.find({ _id: { $in: idsPresentados } }).exec()
      : [];
    const evidenciaDeItem = new Map(
      itemsPresentados.map((item) => [
        item._id.toString(),
        item.id_experiencia_evidencia.toString(),
      ]),
    );
    const conteoPorEvidencia = new Map<string, number>();
    for (const id of presentados) {
      const evidencia = evidenciaDeItem.get(id);
      if (evidencia) {
        conteoPorEvidencia.set(
          evidencia,
          (conteoPorEvidencia.get(evidencia) ?? 0) + 1,
        );
      }
    }
    const ultimaEvidencia = ultima
      ? evidenciaDeItem.get(ultima.id_item.toString())
      : undefined;

    const item = elegirItem(
      disponibles,
      ordenEvidencias,
      conteoPorEvidencia,
      ultimaEvidencia,
    );
    if (!item) {
      return { terminado: true };
    }

    let presentacion: PresentacionDocument;
    try {
      presentacion = await this.presentacionModel.create({
        id_inscripcion: idInscripcion,
        id_item: item._id,
        orden_presentacion: presentaciones.length + 1,
      });
    } catch (error) {
      if (esIndiceUnicoDuplicado(error)) {
        throw new ConflictException(
          'El ítem ya se presentó en esta inscripción; vuelva a pedir el siguiente.',
        );
      }

      throw error;
    }

    const opciones = await this.opcionModel.find({ id_item: item._id }).exec();
    const opcionesParaEstudiante = opciones.map((opcion) => {
      const visible: OpcionParaEstudiante = {
        _id: opcion._id,
        texto: opcion.texto,
      };
      if (opcion.grupo) {
        visible.grupo = opcion.grupo;
      }
      return visible;
    });

    return {
      terminado: false,
      presentacion,
      item: { enunciado: item.enunciado, formato: item.formato },
      opciones: mezclar(opcionesParaEstudiante),
    };
  }
}

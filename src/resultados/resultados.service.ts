import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Experiencia } from '../experiencias/schemas/experiencia.schema.js';
import { ExperienciaEvidencia } from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Inscripcion } from '../inscripciones/schemas/inscripcion.schema.js';
import { Item } from '../items/schemas/item.schema.js';
import { Presentacion } from '../presentaciones/schemas/presentacion.schema.js';
import { Respuesta } from '../respuestas/schemas/respuesta.schema.js';
import { calcularEstadoResultado } from './regla-resultado.js';
import { calcularEstadoGeneral } from './regla-reporte.js';
import { Resultado, ResultadoDocument } from './schemas/resultado.schema.js';

function esIndiceUnicoDuplicado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class ResultadosService {
  constructor(
    @InjectModel(Resultado.name)
    private readonly resultadoModel: Model<Resultado>,
    @InjectModel(Inscripcion.name)
    private readonly inscripcionModel: Model<Inscripcion>,
    @InjectModel(ExperienciaEvidencia.name)
    private readonly experienciaEvidenciaModel: Model<ExperienciaEvidencia>,
    @InjectModel(Presentacion.name)
    private readonly presentacionModel: Model<Presentacion>,
    @InjectModel(Respuesta.name)
    private readonly respuestaModel: Model<Respuesta>,
    @InjectModel(Item.name)
    private readonly itemModel: Model<Item>,
    @InjectModel(Experiencia.name)
    private readonly experienciaModel: Model<Experiencia>,
  ) {}

  async calcularPorInscripcion(idInscripcion: Types.ObjectId) {
    const inscripcion = await this.inscripcionModel
      .findById(idInscripcion)
      .exec();
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada.');
    }

    const resultadoExistente = await this.resultadoModel
      .exists({ id_inscripcion: idInscripcion });
    if (resultadoExistente) {
      throw new ConflictException(
        'Ya existen resultados para esta inscripción; los resultados históricos no se modifican.',
      );
    }

    const evidenciasIncluidas = await this.experienciaEvidenciaModel
      .find({
        id_experiencia: inscripcion.id_experiencia,
        incluida: true,
      })
      .exec();

    const presentaciones = await this.presentacionModel
      .find({ id_inscripcion: idInscripcion })
      .exec();
    const presentacionIds = presentaciones.map(
      (presentacion) => presentacion._id,
    );
    const respuestas = presentacionIds.length
      ? await this.respuestaModel
          .find({ id_presentacion: { $in: presentacionIds } })
          .exec()
      : [];
    const respuestasPorPresentacion = new Map(
      respuestas.map((respuesta) => [
        respuesta.id_presentacion.toString(),
        respuesta,
      ]),
    );

    const items = presentaciones.length
      ? await this.itemModel
          .find({
            _id: {
              $in: presentaciones.map((presentacion) => presentacion.id_item),
            },
          })
          .exec()
      : [];
    const itemsPorId = new Map(items.map((item) => [item._id.toString(), item]));
    const presentacionesPorEvidencia = new Map<
      string,
      { respuesta: Respuesta | null }[]
    >();

    for (const presentacion of presentaciones) {
      const item = itemsPorId.get(presentacion.id_item.toString());
      if (!item) {
        continue;
      }

      const idEvidenciaExperiencia =
        item.id_experiencia_evidencia.toString();
      const presentacionesEvidencia =
        presentacionesPorEvidencia.get(idEvidenciaExperiencia) ?? [];
      presentacionesEvidencia.push({
        respuesta:
          respuestasPorPresentacion.get(presentacion._id.toString()) ?? null,
      });
      presentacionesPorEvidencia.set(
        idEvidenciaExperiencia,
        presentacionesEvidencia,
      );
    }

    const documentos = evidenciasIncluidas.map((evidencia) => ({
      id_inscripcion: idInscripcion,
      id_experiencia_evidencia: evidencia._id,
      estado: calcularEstadoResultado(
        presentacionesPorEvidencia.get(evidencia._id.toString()) ?? [],
      ),
      fecha_calculo: new Date(),
    }));

    if (documentos.length === 0) {
      return [];
    }

    try {
      return await this.resultadoModel.insertMany(documentos);
    } catch (error) {
      if (esIndiceUnicoDuplicado(error)) {
        throw new ConflictException(
          'Ya existen resultados para esta inscripción; los resultados históricos no se modifican.',
        );
      }

      throw error;
    }
  }

  async findOne(id: Types.ObjectId): Promise<ResultadoDocument> {
    const resultado = await this.resultadoModel.findById(id).exec();
    if (!resultado) {
      throw new NotFoundException('Resultado no encontrado.');
    }

    return resultado;
  }

  findPorInscripcion(
    idInscripcion: Types.ObjectId,
  ): Promise<ResultadoDocument[]> {
    return this.inscripcionModel
      .findById(idInscripcion)
      .exec()
      .then((inscripcion) => {
        if (!inscripcion) {
          throw new NotFoundException('Inscripción no encontrada.');
        }

        return this.resultadoModel
          .find({ id_inscripcion: idInscripcion })
          .exec();
      });
  }

  async generarReporte(idExperiencia: Types.ObjectId) {
    const experiencia = await this.experienciaModel
      .findById(idExperiencia)
      .exec();
    if (!experiencia) {
      throw new NotFoundException('Experiencia no encontrada.');
    }

    const evidencias = await this.experienciaEvidenciaModel
      .find({ id_experiencia: idExperiencia, incluida: true })
      .exec();
    const resultados = evidencias.length
      ? await this.resultadoModel
          .find({
            id_experiencia_evidencia: {
              $in: evidencias.map((evidencia) => evidencia._id),
            },
          })
          .exec()
      : [];
    const resultadosPorEvidencia = new Map<string, Resultado[]>();

    for (const resultado of resultados) {
      const idEvidencia = resultado.id_experiencia_evidencia.toString();
      const resultadosEvidencia =
        resultadosPorEvidencia.get(idEvidencia) ?? [];
      resultadosEvidencia.push(resultado);
      resultadosPorEvidencia.set(idEvidencia, resultadosEvidencia);
    }

    return {
      estado_por_evidencia: evidencias.map((evidencia) => {
        const estados = resultadosPorEvidencia.get(evidencia._id.toString()) ?? [];
        return {
          id_experiencia_evidencia: evidencia._id,
          muestra: estados.filter((resultado) => resultado.estado === 'muestra')
            .length,
          no_muestra: estados.filter(
            (resultado) => resultado.estado === 'no_muestra',
          ).length,
          no_concluyente: estados.filter(
            (resultado) => resultado.estado === 'no_concluyente',
          ).length,
        };
      }),
      estado_general: calcularEstadoGeneral(
        resultados.map((resultado) => resultado.estado),
      ),
    };
  }
}

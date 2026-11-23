import 'reflect-metadata';
import { connect, disconnect, model, Types } from 'mongoose';
import { Dba, DbaSchema } from '../dbas/schemas/dba.schema.js';
import { Docente, DocenteSchema } from '../docentes/schemas/docente.schema.js';
import {
  Estudiante,
  EstudianteSchema,
} from '../estudiantes/schemas/estudiante.schema.js';
import {
  Evidencia,
  EvidenciaSchema,
} from '../evidencias/schemas/evidencia.schema.js';
import {
  Experiencia,
  ExperienciaSchema,
} from '../experiencias/schemas/experiencia.schema.js';
import { generarCodigoInvitacion } from '../experiencias/codigo-invitacion.js';
import {
  ExperienciaEvidencia,
  ExperienciaEvidenciaSchema,
} from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Item, ItemSchema } from '../items/schemas/item.schema.js';
import { Opcion, OpcionSchema } from '../opciones/schemas/opcion.schema.js';

type FormatoDemo = 'single_choice' | 'ordering' | 'matching';
type GrupoDemo = 'izquierda' | 'derecha';

interface OpcionDemo {
  texto: string;
  orden: number;
  es_correcta: boolean;
  grupo?: GrupoDemo;
  hipotesis_error?: string;
}

function opcionesPara(
  formato: FormatoDemo,
  numeroEvidencia: number,
): OpcionDemo[] {
  const referencia = `la evidencia ${numeroEvidencia}`;
  switch (formato) {
    case 'single_choice':
      return [
        {
          texto: `Respuesta correcta sobre ${referencia}`,
          orden: 1,
          es_correcta: true,
        },
        {
          texto: `Respuesta distractora sobre ${referencia}`,
          orden: 2,
          es_correcta: false,
          hipotesis_error: 'Confunde el concepto evaluado.',
        },
      ];
    case 'ordering':
      return [
        { texto: `Primer paso de ${referencia}`, orden: 1, es_correcta: true },
        { texto: `Segundo paso de ${referencia}`, orden: 2, es_correcta: true },
      ];
    case 'matching':
      return [
        {
          texto: `Concepto A de ${referencia}`,
          orden: 1,
          es_correcta: true,
          grupo: 'izquierda',
        },
        {
          texto: `Concepto B de ${referencia}`,
          orden: 2,
          es_correcta: true,
          grupo: 'izquierda',
        },
        {
          texto: `Definición A de ${referencia}`,
          orden: 1,
          es_correcta: true,
          grupo: 'derecha',
        },
        {
          texto: `Definición B de ${referencia}`,
          orden: 2,
          es_correcta: true,
          grupo: 'derecha',
        },
      ];
  }
}

async function ejecutarDemo(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta MONGODB_URI en el archivo .env.');
  }

  await connect(uri);
  try {
    const DocenteModel = model(Docente.name, DocenteSchema);
    const EstudianteModel = model(Estudiante.name, EstudianteSchema);
    const DbaModel = model(Dba.name, DbaSchema);
    const EvidenciaModel = model(Evidencia.name, EvidenciaSchema);
    const ExperienciaModel = model(Experiencia.name, ExperienciaSchema);
    const ExperienciaEvidenciaModel = model(
      ExperienciaEvidencia.name,
      ExperienciaEvidenciaSchema,
    );
    const ItemModel = model(Item.name, ItemSchema);
    const OpcionModel = model(Opcion.name, OpcionSchema);

    await Promise.all([
      DocenteModel.init(),
      EstudianteModel.init(),
      DbaModel.init(),
      EvidenciaModel.init(),
      ExperienciaModel.init(),
      ExperienciaEvidenciaModel.init(),
    ]);

    const docente = await DocenteModel.findOneAndUpdate(
      { correo: 'demo.docente@adaptivelearn.local' },
      {
        $setOnInsert: {
          nombre: 'Docente de demostración',
          correo: 'demo.docente@adaptivelearn.local',
        },
      },
      { upsert: true, new: true, runValidators: true },
    ).exec();
    const estudiante = await EstudianteModel.findOneAndUpdate(
      { correo: 'demo.estudiante@adaptivelearn.local' },
      {
        $setOnInsert: {
          nombre: 'Estudiante de demostración',
          correo: 'demo.estudiante@adaptivelearn.local',
        },
      },
      { upsert: true, new: true, runValidators: true },
    ).exec();

    let dbaSeleccionado:
      | {
          _id: Types.ObjectId;
          evidencias: Awaited<ReturnType<typeof EvidenciaModel.find>>;
        }
      | undefined;
    const dbas = await DbaModel.find().sort({ codigo: 1 }).exec();
    for (const dba of dbas) {
      const evidencias = await EvidenciaModel.find({ id_dba: dba._id })
        .sort({ numero: 1 })
        .limit(2)
        .exec();
      if (evidencias.length >= 2) {
        dbaSeleccionado = { _id: dba._id, evidencias };
        break;
      }
    }

    if (!dbaSeleccionado) {
      throw new Error(
        'No hay un DBA cargado por el seed con al menos dos evidencias.',
      );
    }

    const nombreExperiencia = 'Diagnóstico demostrativo AdaptiveLearn';
    let experiencia = await ExperienciaModel.findOne({
      id_docente: docente._id,
      id_dba: dbaSeleccionado._id,
      nombre: nombreExperiencia,
    }).exec();
    if (!experiencia) {
      experiencia = await ExperienciaModel.create({
        id_docente: docente._id,
        id_dba: dbaSeleccionado._id,
        nombre: nombreExperiencia,
        estado: 'borrador',
        codigo_invitacion: generarCodigoInvitacion(),
      });
    }

    const selecciones = [];
    const idsItems = [];
    const idsOpciones = [];
    for (const evidencia of dbaSeleccionado.evidencias) {
      const seleccion = await ExperienciaEvidenciaModel.findOneAndUpdate(
        {
          id_experiencia: experiencia._id,
          id_evidencia: evidencia._id,
        },
        { $set: { incluida: true } },
        { upsert: true, new: true, runValidators: true },
      ).exec();
      selecciones.push(seleccion);

      for (const formato of [
        'single_choice',
        'ordering',
        'matching',
      ] as const) {
        const enunciado = `Ítem demostrativo ${formato} - evidencia ${evidencia.numero}`;
        const item = await ItemModel.findOneAndUpdate(
          {
            id_experiencia_evidencia: seleccion._id,
            enunciado,
          },
          {
            $set: {
              formato,
              origen: 'docente',
              estado_revision: 'aprobado',
              excluido: false,
            },
          },
          { upsert: true, new: true, runValidators: true },
        ).exec();
        idsItems.push(item._id.toString());

        for (const opcion of opcionesPara(formato, evidencia.numero)) {
          const filtro = { id_item: item._id, texto: opcion.texto };
          const { grupo, hipotesis_error, ...campos } = opcion;
          const actualizacion = {
            $set: {
              ...campos,
              ...(grupo === undefined ? {} : { grupo }),
              ...(hipotesis_error === undefined ? {} : { hipotesis_error }),
            },
            $unset: {
              ...(grupo === undefined ? { grupo: 1 } : {}),
              ...(hipotesis_error === undefined ? { hipotesis_error: 1 } : {}),
            },
          };
          const opcionGuardada = await OpcionModel.findOneAndUpdate(
            filtro,
            actualizacion,
            { upsert: true, new: true, runValidators: true },
          ).exec();
          idsOpciones.push(opcionGuardada._id.toString());
        }
      }
    }

    if (experiencia.estado !== 'publicada') {
      experiencia.estado = 'publicada';
      experiencia.fecha_publicacion = new Date();
      await experiencia.save();
    }

    console.log('Demo listo.');
    console.log(`Código de invitación: ${experiencia.codigo_invitacion}`);
    console.log(
      JSON.stringify(
        {
          _id: {
            docente: docente._id,
            estudiante: estudiante._id,
            dba: dbaSeleccionado._id,
            evidencias: dbaSeleccionado.evidencias.map((evidencia) =>
              evidencia._id.toString(),
            ),
            experiencia: experiencia._id,
            experiencias_evidencias: selecciones.map((seleccion) =>
              seleccion._id.toString(),
            ),
            items: idsItems,
            opciones: idsOpciones,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await disconnect();
  }
}

try {
  await ejecutarDemo();
} catch (error) {
  console.error(
    'La demo falló:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}

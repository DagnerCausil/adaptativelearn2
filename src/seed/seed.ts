// Carga inicial de DBA y evidencias del MEN desde src/seed/data/dbas.json.
// Uso: npm run seed (compila y ejecuta con la MONGODB_URI del .env).
// Es idempotente: si se corre dos veces no duplica; actualiza los DBA por
// codigo y las evidencias por { id_dba, numero }.
import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { connect, disconnect, model } from 'mongoose';
import { Dba, DbaSchema } from '../dbas/schemas/dba.schema.js';
import {
  Evidencia,
  EvidenciaSchema,
} from '../evidencias/schemas/evidencia.schema.js';
import { validarDatosSeed } from './seed-datos.js';

// Se lee desde la raíz del proyecto (donde se ejecuta npm run seed).
const RUTA_DATOS = resolve(process.cwd(), 'src/seed/data/dbas.json');

async function ejecutarSeed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta MONGODB_URI en el archivo .env.');
  }

  const datos = validarDatosSeed(
    JSON.parse(await readFile(RUTA_DATOS, 'utf8')) as unknown,
  );

  await connect(uri);
  try {
    const DbaModel = model(Dba.name, DbaSchema);
    const EvidenciaModel = model(Evidencia.name, EvidenciaSchema);
    // Garantiza los índices únicos antes de escribir.
    await DbaModel.init();
    await EvidenciaModel.init();

    const conteo = {
      dbasCreados: 0,
      dbasActualizados: 0,
      evidenciasCreadas: 0,
      evidenciasActualizadas: 0,
    };

    for (const dato of datos) {
      const codigo = dato.codigo.trim();
      const camposDba = {
        area: dato.area,
        grado: dato.grado,
        enunciado: dato.enunciado,
      };

      let dba = await DbaModel.findOne({ codigo }).exec();
      if (dba) {
        await DbaModel.updateOne(
          { _id: dba._id },
          dato.ejemplo === undefined
            ? { $set: camposDba, $unset: { ejemplo: 1 } }
            : { $set: { ...camposDba, ejemplo: dato.ejemplo } },
          { runValidators: true },
        ).exec();
        conteo.dbasActualizados++;
      } else {
        dba = await DbaModel.create({
          codigo,
          ...camposDba,
          ...(dato.ejemplo === undefined ? {} : { ejemplo: dato.ejemplo }),
        });
        conteo.dbasCreados++;
      }

      for (const evidencia of dato.evidencias) {
        const filtro = { id_dba: dba._id, numero: evidencia.numero };
        const existente = await EvidenciaModel.exists(filtro);
        if (existente) {
          await EvidenciaModel.updateOne(
            filtro,
            { $set: { enunciado: evidencia.enunciado } },
            { runValidators: true },
          ).exec();
          conteo.evidenciasActualizadas++;
        } else {
          await EvidenciaModel.create({
            ...filtro,
            enunciado: evidencia.enunciado,
          });
          conteo.evidenciasCreadas++;
        }
      }
    }

    console.log('Seed terminado.');
    console.log(
      `DBA: ${conteo.dbasCreados} creados, ${conteo.dbasActualizados} actualizados.`,
    );
    console.log(
      `Evidencias: ${conteo.evidenciasCreadas} creadas, ${conteo.evidenciasActualizadas} actualizadas.`,
    );
  } finally {
    await disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}

try {
  await ejecutarSeed();
} catch (error) {
  console.error(
    'El seed falló:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}

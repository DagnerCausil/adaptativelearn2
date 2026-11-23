import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import type { Connection } from 'mongoose';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { CERTEZA_ALTA_PARADA, ITEMS_MINIMOS } from '../src/common/umbrales.js';

interface ApiDocument {
  _id?: unknown;
  [key: string]: unknown;
}

interface OpcionVisible {
  _id: string;
  texto: string;
  grupo?: 'izquierda' | 'derecha';
}

interface ItemParaResponder {
  formato: 'single_choice' | 'ordering' | 'matching';
  opcionCorrecta?: string;
  valorPorOpcion: Map<string, number>;
}

const coleccionesAlBorrar = [
  'respuestas_opciones',
  'resultados',
  'respuestas',
  'presentaciones',
  'inscripciones',
  'opciones',
  'items',
  'experiencias_evidencias',
  'experiencias',
  'evidencias',
  'estudiantes',
  'docentes',
  'dbas',
];

let app: INestApplication;
let conexion: Connection;
const idsCreados = new Map<string, string[]>();

function registrarId(coleccion: string, id: string): string {
  const ids = idsCreados.get(coleccion) ?? [];
  ids.push(id);
  idsCreados.set(coleccion, ids);
  return id;
}

function idDe(documento: ApiDocument): string {
  if (typeof documento._id !== 'string') {
    throw new Error('La API no devolvió un _id de texto.');
  }
  return documento._id;
}

async function postJson(
  ruta: string,
  datos: Record<string, unknown>,
  estado = 201,
): Promise<ApiDocument> {
  const respuesta = await request(app.getHttpServer())
    .post(ruta)
    .send(datos)
    .expect(estado);
  return respuesta.body as ApiDocument;
}

function llavesAnidadas(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor.flatMap(llavesAnidadas);
  }
  if (typeof valor !== 'object' || valor === null) {
    return [];
  }
  return Object.entries(valor).flatMap(([llave, hijo]) => [
    llave,
    ...llavesAnidadas(hijo),
  ]);
}

function comprobarSinClaves(valor: unknown, prohibidas: string[]): void {
  const llaves = llavesAnidadas(valor);
  for (const prohibida of prohibidas) {
    expect(llaves).not.toContain(prohibida);
  }
}

// new URL() no acepta conexiones con varios servidores separados por comas
// (mongodb://usuario:clave@host1,host2,host3/base?...), así que se separa a mano.
function identidadBase(uri: string): string {
  const sinEsquema = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const sinCredenciales = sinEsquema.slice(sinEsquema.lastIndexOf('@') + 1);
  const [hosts, resto = ''] = sinCredenciales.split('/', 2);
  const base = resto.split('?')[0];
  return `${hosts}/${base}`;
}

beforeAll(async () => {
  await ConfigModule.envVariablesLoaded;
  const uriPruebas = process.env.MONGODB_URI_TEST;
  const uriPrincipal = process.env.MONGODB_URI;
  if (!uriPruebas) {
    throw new Error('Configura MONGODB_URI_TEST en el archivo .env.');
  }
  if (
    uriPrincipal &&
    identidadBase(uriPruebas) === identidadBase(uriPrincipal)
  ) {
    throw new Error(
      'MONGODB_URI_TEST debe apuntar a una base distinta de MONGODB_URI.',
    );
  }
  process.env.MONGODB_URI = uriPruebas;

  const modulo = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = modulo.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  conexion = app.get<Connection>(getConnectionToken());
}, 30_000);

afterAll(async () => {
  try {
    if (conexion) {
      for (const coleccion of coleccionesAlBorrar) {
        const ids = idsCreados.get(coleccion);
        if (ids?.length) {
          await conexion.collection(coleccion).deleteMany({
            _id: {
              $in: ids.map((id) => new Types.ObjectId(id)),
            },
          });
        }
      }
    }
  } finally {
    if (app) {
      await app.close();
    }
  }
});

describe('Flujo completo del diagnóstico', () => {
  it('publica, entrega cuatro ítems correctos, calcula resultados y genera el reporte', async () => {
    const token = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    const dba = await postJson('/dbas', {
      codigo: `E2E${token}`,
      area: 'Matemáticas',
      grado: 6,
      enunciado: 'DBA temporal para prueba de flujo completo.',
    });
    const idDba = registrarId('dbas', idDe(dba));

    const evidencias = [];
    for (const numero of [1, 2]) {
      const evidencia = await postJson('/evidencias', {
        id_dba: idDba,
        numero,
        enunciado: `Evidencia temporal ${numero} para prueba ${token}.`,
      });
      evidencias.push(registrarId('evidencias', idDe(evidencia)));
    }

    const docente = await postJson('/docentes', {
      nombre: 'Docente e2e',
      correo: `docente.${token.toLowerCase()}@example.test`,
    });
    registrarId('docentes', idDe(docente));
    const estudiante = await postJson('/estudiantes', {
      nombre: 'Estudiante e2e',
      correo: `estudiante.${token.toLowerCase()}@example.test`,
    });
    const idEstudiante = registrarId('estudiantes', idDe(estudiante));

    const experiencia = await postJson('/experiencias', {
      id_docente: idDe(docente),
      id_dba: idDba,
      nombre: `Experiencia e2e ${token}`,
    });
    const idExperiencia = registrarId('experiencias', idDe(experiencia));
    const selecciones: string[] = [];
    for (const idEvidencia of evidencias) {
      const seleccion = await postJson(
        `/experiencias/${idExperiencia}/evidencias`,
        { id_evidencia: idEvidencia },
      );
      selecciones.push(registrarId('experiencias_evidencias', idDe(seleccion)));
    }

    const items = new Map<string, ItemParaResponder>();
    for (const [indice, idSeleccion] of selecciones.entries()) {
      const formatos = [
        {
          formato: 'single_choice' as const,
          opciones: [
            {
              texto: `Correcta ${token} ${indice}`,
              orden: 1,
              es_correcta: true,
            },
            {
              texto: `Distractora ${token} ${indice}`,
              orden: 2,
              es_correcta: false,
              hipotesis_error: 'Confunde los conceptos.',
            },
          ],
        },
        {
          formato: 'ordering' as const,
          opciones: [
            { texto: `Paso A ${token} ${indice}`, orden: 1, es_correcta: true },
            { texto: `Paso B ${token} ${indice}`, orden: 2, es_correcta: true },
          ],
        },
        {
          formato: 'matching' as const,
          opciones: [
            {
              texto: `Izquierda A ${token} ${indice}`,
              orden: 1,
              es_correcta: true,
              grupo: 'izquierda',
            },
            {
              texto: `Izquierda B ${token} ${indice}`,
              orden: 2,
              es_correcta: true,
              grupo: 'izquierda',
            },
            {
              texto: `Derecha A ${token} ${indice}`,
              orden: 1,
              es_correcta: true,
              grupo: 'derecha',
            },
            {
              texto: `Derecha B ${token} ${indice}`,
              orden: 2,
              es_correcta: true,
              grupo: 'derecha',
            },
          ],
        },
      ];

      for (const definicion of formatos) {
        const item = await postJson('/items', {
          id_experiencia_evidencia: idSeleccion,
          enunciado: `Ítem ${definicion.formato} ${token} ${indice}`,
          formato: definicion.formato,
          origen: 'docente',
        });
        const idItem = registrarId('items', idDe(item));
        const esperado: ItemParaResponder = {
          formato: definicion.formato,
          valorPorOpcion: new Map(),
        };

        for (const opcion of definicion.opciones) {
          const creada = await postJson(`/items/${idItem}/opciones`, opcion);
          const idOpcion = registrarId('opciones', idDe(creada));
          esperado.valorPorOpcion.set(idOpcion, opcion.orden);
          if (definicion.formato === 'single_choice' && opcion.es_correcta) {
            esperado.opcionCorrecta = idOpcion;
          }
        }

        await request(app.getHttpServer())
          .patch(`/items/${idItem}/revision`)
          .send({ estado_revision: 'aprobado' })
          .expect(200);
        items.set(idItem, esperado);
      }
    }

    const publicada = await postJson(
      `/experiencias/${idExperiencia}/publicar`,
      {},
      200,
    );
    const codigoInvitacion = publicada.codigo_invitacion;
    expect(typeof codigoInvitacion).toBe('string');

    const inscripcion = await postJson('/inscripciones/unirse', {
      id_estudiante: idEstudiante,
      codigo_invitacion: codigoInvitacion,
    });
    const idInscripcion = registrarId('inscripciones', idDe(inscripcion));

    let totalPresentadas = 0;
    while (true) {
      const siguiente = await postJson(
        `/inscripciones/${idInscripcion}/siguiente-item`,
        {},
        200,
      );
      comprobarSinClaves(siguiente, [
        'es_correcta',
        'orden',
        'hipotesis_error',
      ]);
      if (siguiente.terminado === true) {
        break;
      }

      expect(siguiente.terminado).toBe(false);
      const presentacion = siguiente.presentacion as ApiDocument;
      const idPresentacion = registrarId('presentaciones', idDe(presentacion));
      const idItem = String(presentacion.id_item);
      const esperado = items.get(idItem);
      expect(esperado).toBeDefined();
      const opciones = siguiente.opciones as OpcionVisible[];
      const respuestas =
        esperado?.formato === 'single_choice'
          ? [{ id_opcion: esperado.opcionCorrecta }]
          : opciones.map((opcion) => ({
              id_opcion: opcion._id,
              valor_dado: esperado?.valorPorOpcion.get(opcion._id),
            }));

      const respuesta = await postJson('/respuestas', {
        id_presentacion: idPresentacion,
        certeza: CERTEZA_ALTA_PARADA,
        opciones: respuestas,
      });
      registrarId('respuestas', idDe(respuesta));
      const opcionesRespuesta = respuesta.opciones;
      if (Array.isArray(opcionesRespuesta)) {
        for (const opcion of opcionesRespuesta) {
          if (
            typeof opcion === 'object' &&
            opcion !== null &&
            '_id' in opcion &&
            typeof opcion._id === 'string'
          ) {
            registrarId('respuestas_opciones', opcion._id);
          }
        }
      }
      totalPresentadas++;
    }

    expect(totalPresentadas).toBe(ITEMS_MINIMOS);
    const calculados = await request(app.getHttpServer())
      .post(`/inscripciones/${idInscripcion}/calcular-resultados`)
      .expect(201);
    expect(Array.isArray(calculados.body)).toBe(true);
    expect(calculados.body).toHaveLength(evidencias.length);
    for (const resultado of calculados.body as ApiDocument[]) {
      registrarId('resultados', idDe(resultado));
      expect(resultado.estado).toBe('muestra');
    }

    const reporteResponse = await request(app.getHttpServer())
      .get(`/experiencias/${idExperiencia}/reporte`)
      .expect(200);
    comprobarSinClaves(reporteResponse.body, ['puntaje', 'nota', 'score']);
    expect(reporteResponse.body.estado_general).toBe('logrado');
    expect(reporteResponse.body.estado_por_evidencia).toHaveLength(
      evidencias.length,
    );
  }, 60_000);
});

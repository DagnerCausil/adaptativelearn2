// Importa los DBA y evidencias oficiales del MEN a src/seed/data/dbas.json.
//
// Origen (versión fija, para que los textos no cambien):
//   alearja325-code/adaptivelearn @ 8ac21f8686192be9a4aa204063a3f40afea1ee1e
//   data/curriculo-men/catalogo/catalogo_dba.json
// Ese catálogo se extrajo por programa de los PDF oficiales del MEN y se
// verificó contra ellos. Aquí NO se modifica ni una letra de los textos:
// solo se cambia la forma al formato de dbas.json que lee npm run seed.
//
// Uso:
//   node src/seed/importar-dbas-men.mjs                 todos los DBA
//   node src/seed/importar-dbas-men.mjs --area MAT,LEN  solo esas áreas
//   node src/seed/importar-dbas-men.mjs --grado 3,4,5   solo esos grados
//   node src/seed/importar-dbas-men.mjs --codigos MAT-08-01,LEN-05-03
//   node src/seed/importar-dbas-men.mjs --origen ruta/catalogo_dba.json
//                                       (lee un archivo local, sin red)
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const URL_CATALOGO =
  'https://raw.githubusercontent.com/alearja325-code/adaptivelearn/8ac21f8686192be9a4aa204063a3f40afea1ee1e/data/curriculo-men/catalogo/catalogo_dba.json';
const RUTA_DESTINO = resolve(process.cwd(), 'src/seed/data/dbas.json');

// Límites de los esquemas dba/evidencia (docs/modelo-v2.md §3, Vista 1).
const MAX_CODIGO = 20;
const MAX_AREA = 60;

function leerArgumentos(argv) {
  const opciones = {};
  for (let i = 0; i < argv.length; i += 2) {
    const nombre = argv[i];
    const valor = argv[i + 1];
    if (!nombre?.startsWith('--') || valor === undefined) {
      throw new Error(`Argumento no válido: ${nombre ?? ''}`);
    }
    opciones[nombre.slice(2)] = valor;
  }
  const lista = (texto) =>
    texto === undefined
      ? undefined
      : texto
          .split(',')
          .map((parte) => parte.trim())
          .filter((parte) => parte.length > 0);
  return {
    origen: opciones.origen,
    areas: lista(opciones.area),
    grados: lista(opciones.grado)?.map(Number),
    codigos: lista(opciones.codigos),
  };
}

async function leerCatalogo(origen) {
  if (origen) {
    return JSON.parse(await readFile(resolve(origen), 'utf8'));
  }
  const respuesta = await fetch(URL_CATALOGO);
  if (!respuesta.ok) {
    throw new Error(
      `No se pudo descargar el catálogo (HTTP ${respuesta.status}).`,
    );
  }
  return JSON.parse(await respuesta.text());
}

function convertir(dba) {
  const errores = [];
  if (typeof dba.codigo_dba !== 'string' || dba.codigo_dba.length > MAX_CODIGO) {
    errores.push(`codigo_dba no cabe en ${MAX_CODIGO} caracteres`);
  }
  if (typeof dba.area !== 'string' || dba.area.length > MAX_AREA) {
    errores.push(`area no cabe en ${MAX_AREA} caracteres`);
  }
  if (!Number.isInteger(dba.grado)) {
    errores.push('grado no es entero');
  }
  if (typeof dba.enunciado !== 'string' || dba.enunciado.length === 0) {
    errores.push('enunciado vacío');
  }
  if (!Array.isArray(dba.evidencias) || dba.evidencias.length === 0) {
    errores.push('no trae evidencias');
  } else if (dba.evidencias.some((texto) => typeof texto !== 'string')) {
    errores.push('hay evidencias que no son texto');
  }
  if (errores.length > 0) {
    throw new Error(`${dba.codigo_dba}: ${errores.join('; ')}.`);
  }

  // El número de la evidencia es su posición oficial en el PDF (1, 2, 3...).
  return {
    codigo: dba.codigo_dba,
    area: dba.area,
    grado: dba.grado,
    enunciado: dba.enunciado,
    ...(dba.ejemplo === null || dba.ejemplo === undefined
      ? {}
      : { ejemplo: dba.ejemplo }),
    evidencias: dba.evidencias.map((texto, i) => ({
      numero: i + 1,
      enunciado: texto,
    })),
  };
}

async function importar() {
  const filtros = leerArgumentos(process.argv.slice(2));
  const catalogo = await leerCatalogo(filtros.origen);
  if (!Array.isArray(catalogo?.dba)) {
    throw new Error('El catálogo no tiene la lista "dba".');
  }

  const elegidos = catalogo.dba.filter(
    (dba) =>
      (!filtros.areas || filtros.areas.includes(dba.codigo_area)) &&
      (!filtros.grados || filtros.grados.includes(dba.grado)) &&
      (!filtros.codigos || filtros.codigos.includes(dba.codigo_dba)),
  );
  if (elegidos.length === 0) {
    throw new Error('Ningún DBA cumple los filtros; no se escribió nada.');
  }

  const codigos = new Set();
  for (const dba of elegidos) {
    if (codigos.has(dba.codigo_dba)) {
      throw new Error(`Código repetido en el catálogo: ${dba.codigo_dba}.`);
    }
    codigos.add(dba.codigo_dba);
  }

  const dbas = elegidos.map(convertir);
  await writeFile(RUTA_DESTINO, `${JSON.stringify(dbas, null, 2)}\n`, 'utf8');

  const porArea = {};
  for (const dba of elegidos) {
    porArea[dba.codigo_area] = (porArea[dba.codigo_area] ?? 0) + 1;
  }
  const totalEvidencias = dbas.reduce((n, dba) => n + dba.evidencias.length, 0);
  const conImagen = elegidos.filter((dba) => dba.ejemplo_tiene_imagen);
  const dudosos = elegidos.filter(
    (dba) => Array.isArray(dba.dudoso) && dba.dudoso.length > 0,
  );

  console.log(`Escrito: ${RUTA_DESTINO}`);
  console.log(`DBA: ${dbas.length}. Evidencias: ${totalEvidencias}.`);
  console.log(
    `Por área: ${Object.entries(porArea)
      .map(([area, n]) => `${area} ${n}`)
      .join(', ')}.`,
  );
  console.log(
    `DBA cuyo ejemplo en el PDF tiene una figura que el texto no trae: ${conImagen.length}.`,
  );
  console.log(`DBA con avisos "dudoso" (textos copiados tal cual): ${dudosos.length}.`);
  for (const dba of dudosos) {
    console.log(`  - ${dba.codigo_dba}: ${JSON.stringify(dba.dudoso)}`);
  }
}

try {
  await importar();
} catch (error) {
  console.error(
    'La importación falló:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}

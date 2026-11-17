// Estructura y validación de src/seed/data/dbas.json.
// Se valida ANTES de conectarse a MongoDB para no dejar cargas a medias.

export interface EvidenciaSeed {
  numero: number;
  enunciado: string;
}

export interface DbaSeed {
  codigo: string;
  area: string;
  grado: number;
  enunciado: string;
  ejemplo?: string;
  evidencias: EvidenciaSeed[];
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTexto(valor: unknown, maximo?: number): valor is string {
  return (
    typeof valor === 'string' &&
    valor.trim().length > 0 &&
    (maximo === undefined || valor.trim().length <= maximo)
  );
}

// Mismas reglas que docs/modelo-v2.md §3 (Vista 1) y los esquemas dba/evidencia.
export function validarDatosSeed(datos: unknown): DbaSeed[] {
  if (!Array.isArray(datos)) {
    throw new Error('dbas.json debe ser una lista de DBA.');
  }

  const errores: string[] = [];
  const codigos = new Set<string>();

  datos.forEach((dba: unknown, i) => {
    const ruta = `dbas[${i}]`;
    if (!esObjeto(dba)) {
      errores.push(`${ruta} debe ser un objeto.`);
      return;
    }

    if (!esTexto(dba.codigo, 20)) {
      errores.push(`${ruta}.codigo es obligatorio (máximo 20 caracteres).`);
    } else if (codigos.has(dba.codigo.trim())) {
      errores.push(
        `${ruta}.codigo "${dba.codigo}" está repetido en el archivo.`,
      );
    } else {
      codigos.add(dba.codigo.trim());
    }
    if (!esTexto(dba.area, 60)) {
      errores.push(`${ruta}.area es obligatoria (máximo 60 caracteres).`);
    }
    if (!Number.isInteger(dba.grado)) {
      errores.push(`${ruta}.grado debe ser un número entero.`);
    }
    if (!esTexto(dba.enunciado)) {
      errores.push(`${ruta}.enunciado es obligatorio.`);
    }
    if (dba.ejemplo !== undefined && typeof dba.ejemplo !== 'string') {
      errores.push(`${ruta}.ejemplo debe ser texto si se incluye.`);
    }
    if (!Array.isArray(dba.evidencias)) {
      errores.push(`${ruta}.evidencias debe ser una lista.`);
      return;
    }

    const numeros = new Set<number>();
    dba.evidencias.forEach((evidencia: unknown, j) => {
      const rutaEvidencia = `${ruta}.evidencias[${j}]`;
      if (!esObjeto(evidencia)) {
        errores.push(`${rutaEvidencia} debe ser un objeto.`);
        return;
      }
      const numero = evidencia.numero;
      if (
        typeof numero !== 'number' ||
        !Number.isInteger(numero) ||
        numero < 1
      ) {
        errores.push(
          `${rutaEvidencia}.numero debe ser un entero mayor o igual a 1.`,
        );
      } else if (numeros.has(numero)) {
        errores.push(
          `${rutaEvidencia}.numero ${numero} está repetido en el DBA.`,
        );
      } else {
        numeros.add(numero);
      }
      if (!esTexto(evidencia.enunciado)) {
        errores.push(`${rutaEvidencia}.enunciado es obligatorio.`);
      }
    });
  });

  if (errores.length > 0) {
    throw new Error(
      `dbas.json tiene ${errores.length} error(es):\n- ${errores.join('\n- ')}`,
    );
  }

  return datos as DbaSeed[];
}

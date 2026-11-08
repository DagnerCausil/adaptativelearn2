import { FORMATO_ITEM } from '../common/enums.js';

export interface OpcionSeleccionada {
  valor_dado?: number;
  orden: number;
  es_correcta: boolean;
  grupo?: string;
}

// Las reglas de ordering y matching fueron confirmadas por el profesor el 8 de noviembre de 2026.
export function esCorrectaSingleChoice(opciones: OpcionSeleccionada[]): boolean {
  return opciones.length === 1 && opciones[0].es_correcta;
}

export function esCorrectaOrdering(opciones: OpcionSeleccionada[]): boolean {
  return (
    opciones.length > 0 &&
    opciones.every(
      (opcion) =>
        opcion.valor_dado !== undefined &&
        opcion.valor_dado === opcion.orden,
    )
  );
}

export function esCorrectaMatching(opciones: OpcionSeleccionada[]): boolean {
  if (opciones.length === 0) {
    return false;
  }

  const parejas = new Map<number, OpcionSeleccionada[]>();
  for (const opcion of opciones) {
    if (opcion.valor_dado === undefined) {
      return false;
    }

    const pareja = parejas.get(opcion.valor_dado) ?? [];
    pareja.push(opcion);
    parejas.set(opcion.valor_dado, pareja);
  }

  return [...parejas.values()].every((pareja) => {
    if (pareja.length !== 2) {
      return false;
    }

    const izquierda = pareja.find((opcion) => opcion.grupo === 'izquierda');
    const derecha = pareja.find((opcion) => opcion.grupo === 'derecha');
    return izquierda !== undefined && derecha !== undefined && izquierda.orden === derecha.orden;
  });
}

export function calcularCorrecta(
  formato: (typeof FORMATO_ITEM)[number],
  opciones: OpcionSeleccionada[],
): boolean {
  switch (formato) {
    case 'single_choice':
      return esCorrectaSingleChoice(opciones);
    case 'ordering':
      return esCorrectaOrdering(opciones);
    case 'matching':
      return esCorrectaMatching(opciones);
  }
}

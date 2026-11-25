import { FORMATO_ITEM, GRUPO_OPCION } from '../common/enums.js';

/** Mínimos de RI-4 / H-9 (docs/modelo-v2.md §4). */
export const MIN_OPCIONES_SINGLE_CHOICE = 2;
export const CORRECTAS_SINGLE_CHOICE = 1;
export const MIN_OPCIONES_ORDERING = 2;
export const MIN_OPCIONES_MATCHING = 4;
export const MIN_OPCIONES_POR_LADO_MATCHING = 2;

export type FormatoItem = (typeof FORMATO_ITEM)[number];

export interface OpcionParaValidar {
  es_correcta: boolean;
  grupo?: (typeof GRUPO_OPCION)[number] | null;
}

/**
 * RI-4 / H-9 (docs/modelo-v2.md §4): mínimo de opciones por formato.
 * Devuelve la lista de lo que le falta al ítem; vacía si cumple.
 */
export function faltantesRI4(
  formato: FormatoItem,
  opciones: OpcionParaValidar[],
): string[] {
  const faltantes: string[] = [];
  const total = opciones.length;

  if (formato !== 'matching' && opciones.some((opcion) => opcion.grupo)) {
    faltantes.push('grupo solo se permite en ítems matching');
  }

  if (formato === 'single_choice') {
    if (total < MIN_OPCIONES_SINGLE_CHOICE) {
      faltantes.push(
        `single_choice necesita al menos ${MIN_OPCIONES_SINGLE_CHOICE} opciones (tiene ${total})`,
      );
    }
    const correctas = opciones.filter((opcion) => opcion.es_correcta).length;
    if (correctas !== CORRECTAS_SINGLE_CHOICE) {
      faltantes.push(
        `single_choice necesita exactamente ${CORRECTAS_SINGLE_CHOICE} opción correcta (tiene ${correctas})`,
      );
    }
  }

  if (formato === 'ordering' && total < MIN_OPCIONES_ORDERING) {
    faltantes.push(
      `ordering necesita al menos ${MIN_OPCIONES_ORDERING} opciones (tiene ${total})`,
    );
  }

  if (formato === 'matching') {
    if (total < MIN_OPCIONES_MATCHING) {
      faltantes.push(
        `matching necesita al menos ${MIN_OPCIONES_MATCHING} opciones (tiene ${total})`,
      );
    }
    const izquierda = opciones.filter((o) => o.grupo === 'izquierda').length;
    const derecha = opciones.filter((o) => o.grupo === 'derecha').length;
    if (izquierda < MIN_OPCIONES_POR_LADO_MATCHING) {
      faltantes.push(
        `matching necesita al menos ${MIN_OPCIONES_POR_LADO_MATCHING} opciones en "izquierda" (tiene ${izquierda})`,
      );
    }
    if (derecha < MIN_OPCIONES_POR_LADO_MATCHING) {
      faltantes.push(
        `matching necesita al menos ${MIN_OPCIONES_POR_LADO_MATCHING} opciones en "derecha" (tiene ${derecha})`,
      );
    }
  }

  return faltantes;
}

import { FORMATO_ITEM, GRUPO_OPCION } from '../common/enums.js';

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
    if (total < 2) {
      faltantes.push(
        `single_choice necesita al menos 2 opciones (tiene ${total})`,
      );
    }
    const correctas = opciones.filter((opcion) => opcion.es_correcta).length;
    if (correctas !== 1) {
      faltantes.push(
        `single_choice necesita exactamente 1 opción correcta (tiene ${correctas})`,
      );
    }
  }

  if (formato === 'ordering' && total < 2) {
    faltantes.push(`ordering necesita al menos 2 opciones (tiene ${total})`);
  }

  if (formato === 'matching') {
    if (total < 4) {
      faltantes.push(`matching necesita al menos 4 opciones (tiene ${total})`);
    }
    const izquierda = opciones.filter((o) => o.grupo === 'izquierda').length;
    const derecha = opciones.filter((o) => o.grupo === 'derecha').length;
    if (izquierda < 2) {
      faltantes.push(
        `matching necesita al menos 2 opciones en "izquierda" (tiene ${izquierda})`,
      );
    }
    if (derecha < 2) {
      faltantes.push(
        `matching necesita al menos 2 opciones en "derecha" (tiene ${derecha})`,
      );
    }
  }

  return faltantes;
}

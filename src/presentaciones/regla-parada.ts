import {
  CERTEZA_ALTA_PARADA,
  ITEMS_MAXIMOS,
  ITEMS_MINIMOS,
} from '../common/umbrales.js';

export interface RespuestaParaParada {
  correcta: boolean;
  certeza: number;
}

export interface EstadoDiagnostico {
  /** Cantidad de presentaciones que ya tiene la inscripción. */
  presentadas: number;
  /** Respuestas de esas presentaciones. */
  respuestas: RespuestaParaParada[];
  /** Si queda al menos un ítem aprobado, no excluido y sin presentar. */
  quedanItems: boolean;
}

/**
 * ADR-016 (docs/modelo-v2.md §7). El diagnóstico termina si:
 * - ya se presentaron ITEMS_MAXIMOS ítems, o
 * - hay exactamente ITEMS_MINIMOS presentados y respondidos, todos correctos y con
 *   certeza >= CERTEZA_ALTA_PARADA (dominio suficiente), o
 * - no quedan ítems disponibles.
 */
export function debeTerminar(estado: EstadoDiagnostico): boolean {
  if (estado.presentadas >= ITEMS_MAXIMOS) {
    return true;
  }

  const dominioSuficiente =
    estado.presentadas === ITEMS_MINIMOS &&
    estado.respuestas.length === ITEMS_MINIMOS &&
    estado.respuestas.every(
      (respuesta) =>
        respuesta.correcta && respuesta.certeza >= CERTEZA_ALTA_PARADA,
    );
  if (dominioSuficiente) {
    return true;
  }

  return !estado.quedanItems;
}

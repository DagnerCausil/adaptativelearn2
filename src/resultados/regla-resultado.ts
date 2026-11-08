import { ESTADO_RESULTADO } from '../common/enums.js';
import { Respuesta } from '../respuestas/schemas/respuesta.schema.js';
import { CERTEZA_ADECUADA } from '../common/umbrales.js';

export interface PresentacionConRespuesta {
  respuesta: Pick<Respuesta, 'correcta' | 'certeza'> | null;
}

export function calcularEstadoResultado(
  presentaciones: PresentacionConRespuesta[],
): (typeof ESTADO_RESULTADO)[number] {
  if (
    presentaciones.length === 0 ||
    presentaciones.some((presentacion) => presentacion.respuesta === null)
  ) {
    return 'no_concluyente';
  }

  const respuestas = presentaciones.map(
    (presentacion) => presentacion.respuesta!,
  );
  if (
    respuestas.every(
      (respuesta) =>
        respuesta.correcta && respuesta.certeza >= CERTEZA_ADECUADA,
    )
  ) {
    return 'muestra';
  }

  if (respuestas.every((respuesta) => !respuesta.correcta)) {
    return 'no_muestra';
  }

  return 'no_concluyente';
}

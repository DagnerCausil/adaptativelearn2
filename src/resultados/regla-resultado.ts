import { ESTADO_RESULTADO } from '../common/enums.js';
import { Respuesta } from '../respuestas/schemas/respuesta.schema.js';

export function calcularEstadoResultado(
  _respuestas: Pick<Respuesta, 'correcta' | 'certeza'>[],
): (typeof ESTADO_RESULTADO)[number] {
  // TODO(ADR-021): el equipo definirá la regla de cálculo con el profesor.
  return 'no_concluyente';
}

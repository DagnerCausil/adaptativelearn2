import { ESTADO_RESULTADO } from '../common/enums.js';
import { UMBRAL_LOGRADO } from '../common/umbrales.js';

export type EstadoGeneralReporte =
  | 'logrado'
  | 'requiere_refuerzo'
  | 'en_proceso';

export function calcularEstadoGeneral(
  estados: (typeof ESTADO_RESULTADO)[number][],
): EstadoGeneralReporte {
  if (estados.length === 0) {
    return 'en_proceso';
  }

  const conteos = estados.reduce(
    (total, estado) => {
      total[estado] += 1;
      return total;
    },
    { muestra: 0, no_muestra: 0, no_concluyente: 0 },
  );

  if (conteos.muestra / estados.length >= UMBRAL_LOGRADO) {
    return 'logrado';
  }

  if (
    conteos.no_muestra > conteos.muestra &&
    conteos.no_muestra > conteos.no_concluyente
  ) {
    return 'requiere_refuerzo';
  }

  return 'en_proceso';
}

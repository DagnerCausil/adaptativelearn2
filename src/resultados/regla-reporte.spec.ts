import { calcularEstadoGeneral } from './regla-reporte.js';

describe('calcularEstadoGeneral', () => {
  it('returns logrado when at least the threshold is muestra', () => {
    expect(
      calcularEstadoGeneral([
        'muestra',
        'muestra',
        'muestra',
        'muestra',
        'no_muestra',
      ]),
    ).toBe('logrado');
  });

  it('returns requiere_refuerzo when no_muestra is the largest group', () => {
    expect(
      calcularEstadoGeneral([
        'no_muestra',
        'no_muestra',
        'no_muestra',
        'muestra',
        'no_concluyente',
      ]),
    ).toBe('requiere_refuerzo');
  });

  it('returns en_proceso for ties and other distributions', () => {
    expect(
      calcularEstadoGeneral([
        'muestra',
        'no_muestra',
        'no_concluyente',
      ]),
    ).toBe('en_proceso');
  });

  it('returns en_proceso when there are no results', () => {
    expect(calcularEstadoGeneral([])).toBe('en_proceso');
  });
});

import { calcularEstadoResultado } from './regla-resultado.js';

describe('calcularEstadoResultado', () => {
  it('returns no_concluyente for incomplete presentations', () => {
    expect(
      calcularEstadoResultado([
        { respuesta: { correcta: true, certeza: 4 } },
        { respuesta: null },
      ]),
    ).toBe('no_concluyente');
  });

  it('returns muestra when every answer is correct with adequate certainty', () => {
    expect(
      calcularEstadoResultado([
        { respuesta: { correcta: true, certeza: 3 } },
        { respuesta: { correcta: true, certeza: 5 } },
      ]),
    ).toBe('muestra');
  });

  it('returns no_muestra when every answer is incorrect', () => {
    expect(
      calcularEstadoResultado([
        { respuesta: { correcta: false, certeza: 1 } },
        { respuesta: { correcta: false, certeza: 5 } },
      ]),
    ).toBe('no_muestra');
  });

  it('returns no_concluyente for mixed answer outcomes', () => {
    expect(
      calcularEstadoResultado([
        { respuesta: { correcta: true, certeza: 4 } },
        { respuesta: { correcta: false, certeza: 4 } },
      ]),
    ).toBe('no_concluyente');
  });
});

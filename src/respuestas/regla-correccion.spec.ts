import {
  esCorrectaMatching,
  esCorrectaOrdering,
  esCorrectaSingleChoice,
  OpcionSeleccionada,
} from './regla-correccion.js';

describe('regla de corrección', () => {
  describe('single_choice', () => {
    it('marks a single correct selected option as correct', () => {
      const opciones: OpcionSeleccionada[] = [
        { orden: 1, es_correcta: true },
      ];

      expect(esCorrectaSingleChoice(opciones)).toBe(true);
    });

    it('marks an incorrect or multiple selection as incorrect', () => {
      expect(
        esCorrectaSingleChoice([{ orden: 1, es_correcta: false }]),
      ).toBe(false);
      expect(
        esCorrectaSingleChoice([
          { orden: 1, es_correcta: true },
          { orden: 2, es_correcta: false },
        ]),
      ).toBe(false);
    });
  });

  describe('ordering', () => {
    it('marks selections with matching assigned positions as correct', () => {
      const opciones: OpcionSeleccionada[] = [
        { valor_dado: 1, orden: 1, es_correcta: false },
        { valor_dado: 2, orden: 2, es_correcta: false },
      ];

      expect(esCorrectaOrdering(opciones)).toBe(true);
    });

    it('marks a mismatched assigned position as incorrect', () => {
      const opciones: OpcionSeleccionada[] = [
        { valor_dado: 2, orden: 1, es_correcta: false },
        { valor_dado: 1, orden: 2, es_correcta: false },
      ];

      expect(esCorrectaOrdering(opciones)).toBe(false);
    });
  });

  describe('matching', () => {
    it('marks pairs with matching side and order as correct', () => {
      const opciones: OpcionSeleccionada[] = [
        {
          valor_dado: 1,
          orden: 3,
          es_correcta: false,
          grupo: 'izquierda',
        },
        {
          valor_dado: 1,
          orden: 3,
          es_correcta: false,
          grupo: 'derecha',
        },
        {
          valor_dado: 2,
          orden: 5,
          es_correcta: false,
          grupo: 'izquierda',
        },
        {
          valor_dado: 2,
          orden: 5,
          es_correcta: false,
          grupo: 'derecha',
        },
      ];

      expect(esCorrectaMatching(opciones)).toBe(true);
    });

    it('marks a pair with different option order as incorrect', () => {
      const opciones: OpcionSeleccionada[] = [
        {
          valor_dado: 1,
          orden: 3,
          es_correcta: false,
          grupo: 'izquierda',
        },
        {
          valor_dado: 1,
          orden: 4,
          es_correcta: false,
          grupo: 'derecha',
        },
      ];

      expect(esCorrectaMatching(opciones)).toBe(false);
    });
  });
});

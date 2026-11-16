import { faltantesRI4, OpcionParaValidar } from './regla-opciones.js';

const correcta: OpcionParaValidar = { es_correcta: true };
const distractor: OpcionParaValidar = { es_correcta: false };
const izquierda: OpcionParaValidar = { es_correcta: true, grupo: 'izquierda' };
const derecha: OpcionParaValidar = { es_correcta: true, grupo: 'derecha' };

describe('RI-4: mínimo de opciones por formato', () => {
  describe('single_choice', () => {
    it('acepta 2 opciones con exactamente 1 correcta', () => {
      expect(faltantesRI4('single_choice', [correcta, distractor])).toEqual([]);
    });

    it('rechaza menos de 2 opciones', () => {
      const faltantes = faltantesRI4('single_choice', [correcta]);
      expect(faltantes).toHaveLength(1);
      expect(faltantes[0]).toContain('al menos 2 opciones');
    });

    it('rechaza cero correctas', () => {
      expect(
        faltantesRI4('single_choice', [distractor, distractor])[0],
      ).toContain('exactamente 1 opción correcta (tiene 0)');
    });

    it('rechaza más de una correcta', () => {
      expect(faltantesRI4('single_choice', [correcta, correcta])[0]).toContain(
        'exactamente 1 opción correcta (tiene 2)',
      );
    });

    it('rechaza opciones con grupo', () => {
      expect(
        faltantesRI4('single_choice', [
          { ...correcta, grupo: 'izquierda' },
          distractor,
        ]),
      ).toContain('grupo solo se permite en ítems matching');
    });
  });

  describe('ordering', () => {
    it('acepta 2 opciones', () => {
      expect(faltantesRI4('ordering', [correcta, correcta])).toEqual([]);
    });

    it('rechaza menos de 2 opciones', () => {
      expect(faltantesRI4('ordering', [correcta])[0]).toContain(
        'ordering necesita al menos 2 opciones (tiene 1)',
      );
    });

    it('rechaza opciones con grupo', () => {
      expect(faltantesRI4('ordering', [correcta, derecha])).toContain(
        'grupo solo se permite en ítems matching',
      );
    });
  });

  describe('matching', () => {
    it('acepta 2 izquierda y 2 derecha', () => {
      expect(
        faltantesRI4('matching', [izquierda, izquierda, derecha, derecha]),
      ).toEqual([]);
    });

    it('rechaza 3 opciones', () => {
      const faltantes = faltantesRI4('matching', [
        izquierda,
        izquierda,
        derecha,
      ]);
      expect(faltantes).toContain(
        'matching necesita al menos 4 opciones (tiene 3)',
      );
      expect(faltantes).toContain(
        'matching necesita al menos 2 opciones en "derecha" (tiene 1)',
      );
    });

    it('rechaza 4 opciones mal repartidas entre grupos', () => {
      expect(
        faltantesRI4('matching', [izquierda, izquierda, izquierda, derecha]),
      ).toEqual([
        'matching necesita al menos 2 opciones en "derecha" (tiene 1)',
      ]);
    });

    it('rechaza opciones sin grupo que no completan los lados', () => {
      expect(
        faltantesRI4('matching', [correcta, correcta, izquierda, derecha]),
      ).toEqual([
        'matching necesita al menos 2 opciones en "izquierda" (tiene 1)',
        'matching necesita al menos 2 opciones en "derecha" (tiene 1)',
      ]);
    });
  });
});

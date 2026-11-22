import { elegirItem } from './reparto-evidencias.js';

describe('elegirItem (reparto por evidencia)', () => {
  const item = (id: string, evidencia: string) => ({
    id,
    id_experiencia_evidencia: evidencia,
  });
  const disponibles = [
    item('a1', 'A'),
    item('a2', 'A'),
    item('b1', 'B'),
    item('c1', 'C'),
  ];

  it('en el primer turno toma la primera evidencia', () => {
    expect(elegirItem(disponibles, ['A', 'B', 'C'], new Map())?.id).toBe('a1');
  });

  it('cambia de evidencia en cada turno', () => {
    const conteo = new Map([['A', 1]]);

    expect(
      elegirItem(disponibles.slice(1), ['A', 'B', 'C'], conteo, 'A')?.id,
    ).toBe('b1');
  });

  it('prefiere la evidencia con menos presentaciones', () => {
    const conteo = new Map([
      ['A', 1],
      ['B', 1],
    ]);

    expect(
      elegirItem(
        [item('a2', 'A'), item('c1', 'C')],
        ['A', 'B', 'C'],
        conteo,
        'B',
      )?.id,
    ).toBe('c1');
  });

  it('si empatan, evita repetir la evidencia del turno anterior', () => {
    const conteo = new Map([
      ['A', 1],
      ['B', 1],
    ]);

    expect(
      elegirItem([item('a2', 'A'), item('b2', 'B')], ['A', 'B'], conteo, 'A')
        ?.id,
    ).toBe('b2');
  });

  it('repite evidencia solo si es la única con ítems', () => {
    expect(
      elegirItem([item('a2', 'A')], ['A', 'B'], new Map([['A', 1]]), 'A')?.id,
    ).toBe('a2');
  });

  it('devuelve undefined si no hay ítems', () => {
    expect(elegirItem([], ['A'], new Map())).toBeUndefined();
  });
});

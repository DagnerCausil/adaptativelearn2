import {
  CERTEZA_ALTA_PARADA,
  ITEMS_MAXIMOS,
  ITEMS_MINIMOS,
} from '../common/umbrales.js';
import { debeTerminar } from './regla-parada.js';

const respuestas = (cantidad: number, correcta: boolean, certeza: number) =>
  Array.from({ length: cantidad }, () => ({ correcta, certeza }));

describe('debeTerminar (ADR-016)', () => {
  it('termina en el 4.º ítem con 4 correctas y certeza alta (4)', () => {
    expect(
      debeTerminar({
        presentadas: ITEMS_MINIMOS,
        respuestas: respuestas(ITEMS_MINIMOS, true, CERTEZA_ALTA_PARADA),
        quedanItems: true,
      }),
    ).toBe(true);
  });

  it('termina en el 4.º ítem con 4 correctas y certeza 5', () => {
    expect(
      debeTerminar({
        presentadas: ITEMS_MINIMOS,
        respuestas: respuestas(ITEMS_MINIMOS, true, 5),
        quedanItems: true,
      }),
    ).toBe(true);
  });

  it('sigue si alguna de las 4 tiene certeza baja', () => {
    const lista = respuestas(ITEMS_MINIMOS, true, CERTEZA_ALTA_PARADA);
    lista[2] = { correcta: true, certeza: CERTEZA_ALTA_PARADA - 1 };

    expect(
      debeTerminar({
        presentadas: ITEMS_MINIMOS,
        respuestas: lista,
        quedanItems: true,
      }),
    ).toBe(false);
  });

  it('sigue si alguna de las 4 es incorrecta', () => {
    const lista = respuestas(ITEMS_MINIMOS, true, 5);
    lista[0] = { correcta: false, certeza: 5 };

    expect(
      debeTerminar({
        presentadas: ITEMS_MINIMOS,
        respuestas: lista,
        quedanItems: true,
      }),
    ).toBe(false);
  });

  it('no se detiene antes del mínimo aunque todo sea correcto', () => {
    expect(
      debeTerminar({
        presentadas: ITEMS_MINIMOS - 1,
        respuestas: respuestas(ITEMS_MINIMOS - 1, true, 5),
        quedanItems: true,
      }),
    ).toBe(false);
  });

  it('sigue en el 5.º ítem y termina al llegar a 6', () => {
    expect(
      debeTerminar({
        presentadas: ITEMS_MAXIMOS - 1,
        respuestas: respuestas(ITEMS_MAXIMOS - 1, true, 5),
        quedanItems: true,
      }),
    ).toBe(false);
    expect(
      debeTerminar({
        presentadas: ITEMS_MAXIMOS,
        respuestas: respuestas(ITEMS_MAXIMOS, false, 2),
        quedanItems: true,
      }),
    ).toBe(true);
  });

  it('termina si no quedan ítems disponibles', () => {
    expect(
      debeTerminar({ presentadas: 0, respuestas: [], quedanItems: false }),
    ).toBe(true);
  });
});

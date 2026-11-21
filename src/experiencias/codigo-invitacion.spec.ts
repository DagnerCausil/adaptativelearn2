import {
  ALFABETO_CODIGO,
  generarCodigoInvitacion,
  LONGITUD_CODIGO,
} from './codigo-invitacion.js';

describe('generarCodigoInvitacion', () => {
  it('genera 8 caracteres con mayúsculas y números, sin 0/O ni 1/I', () => {
    for (let i = 0; i < 200; i++) {
      const codigo = generarCodigoInvitacion();
      expect(codigo).toHaveLength(LONGITUD_CODIGO);
      expect(codigo).toMatch(/^[A-Z2-9]{8}$/);
      expect(codigo).not.toMatch(/[0O1I]/);
    }
  });

  it('el alfabeto no contiene caracteres confusos', () => {
    expect(ALFABETO_CODIGO).not.toMatch(/[0O1I]/);
  });

  it('no repite siempre el mismo código', () => {
    const codigos = new Set(
      Array.from({ length: 50 }, () => generarCodigoInvitacion()),
    );
    expect(codigos.size).toBeGreaterThan(1);
  });
});

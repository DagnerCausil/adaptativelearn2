import { validarDatosSeed } from './seed-datos.js';

describe('validarDatosSeed', () => {
  const dbaValido = {
    codigo: 'PENDIENTE-01',
    area: 'PENDIENTE',
    grado: 1,
    enunciado: 'PENDIENTE',
    evidencias: [
      { numero: 1, enunciado: 'PENDIENTE' },
      { numero: 2, enunciado: 'PENDIENTE' },
    ],
  };

  it('accepts a valid list of DBA with evidencias', () => {
    expect(validarDatosSeed([dbaValido])).toEqual([dbaValido]);
  });

  it('accepts an optional ejemplo', () => {
    const conEjemplo = { ...dbaValido, ejemplo: 'PENDIENTE' };

    expect(validarDatosSeed([conEjemplo])).toEqual([conEjemplo]);
  });

  it('rejects a file that is not a list', () => {
    expect(() => validarDatosSeed({ dbas: [] })).toThrow(/lista/);
  });

  it('rejects a repeated codigo in the file', () => {
    expect(() => validarDatosSeed([dbaValido, dbaValido])).toThrow(
      /codigo "PENDIENTE-01" está repetido/,
    );
  });

  it('rejects a codigo longer than 20 characters', () => {
    expect(() =>
      validarDatosSeed([{ ...dbaValido, codigo: 'X'.repeat(21) }]),
    ).toThrow(/codigo/);
  });

  it('rejects a non integer grado', () => {
    expect(() => validarDatosSeed([{ ...dbaValido, grado: 3.5 }])).toThrow(
      /grado/,
    );
  });

  it('rejects a repeated numero inside the same DBA', () => {
    const repetida = {
      ...dbaValido,
      evidencias: [
        { numero: 1, enunciado: 'A' },
        { numero: 1, enunciado: 'B' },
      ],
    };

    expect(() => validarDatosSeed([repetida])).toThrow(
      /numero 1 está repetido/,
    );
  });

  it('rejects numero lower than 1 and an empty enunciado', () => {
    const invalida = {
      ...dbaValido,
      evidencias: [{ numero: 0, enunciado: ' ' }],
    };

    expect(() => validarDatosSeed([invalida])).toThrow(/2 error/);
  });

  it('allows the same numero in different DBA', () => {
    const otro = { ...dbaValido, codigo: 'PENDIENTE-02' };

    expect(validarDatosSeed([dbaValido, otro])).toHaveLength(2);
  });
});

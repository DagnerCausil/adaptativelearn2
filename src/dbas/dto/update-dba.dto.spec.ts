import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateDbaDto } from './update-dba.dto.js';

// Mismas opciones que el ValidationPipe global de src/main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

function validar(cuerpo: Record<string, unknown>) {
  return pipe.transform(cuerpo, { type: 'body', metatype: UpdateDbaDto });
}

describe('UpdateDbaDto', () => {
  it('rejects codigo in a PATCH with 400', async () => {
    const error = await validar({ codigo: 'MAT-99-99', area: 'Otra' }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(BadRequestException);
    expect(
      JSON.stringify((error as BadRequestException).getResponse()),
    ).toContain('codigo');
  });

  it('still accepts the other fields', async () => {
    await expect(
      validar({ area: 'Otra', grado: 5, enunciado: 'E', ejemplo: 'Ej' }),
    ).resolves.toEqual({
      area: 'Otra',
      grado: 5,
      enunciado: 'E',
      ejemplo: 'Ej',
    });
  });
});

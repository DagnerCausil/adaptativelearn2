import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateEvidenciaDto } from './update-evidencia.dto.js';

// Mismas opciones que el ValidationPipe global de src/main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

function validar(cuerpo: Record<string, unknown>) {
  return pipe.transform(cuerpo, {
    type: 'body',
    metatype: UpdateEvidenciaDto,
  });
}

describe('UpdateEvidenciaDto', () => {
  it('rejects id_dba in a PATCH with 400', async () => {
    const error = await validar({
      id_dba: '507f1f77bcf86cd799439011',
      enunciado: 'Nuevo',
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(
      JSON.stringify((error as BadRequestException).getResponse()),
    ).toContain('id_dba');
  });

  it('still accepts numero and enunciado', async () => {
    await expect(validar({ numero: 2, enunciado: 'Nuevo' })).resolves.toEqual({
      numero: 2,
      enunciado: 'Nuevo',
    });
  });
});

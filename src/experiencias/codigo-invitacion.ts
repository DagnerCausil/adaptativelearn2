import { randomInt } from 'node:crypto';

/** Letras mayúsculas y números sin los que se confunden: 0/O y 1/I. */
export const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const LONGITUD_CODIGO = 8;

/** Genera un código de invitación aleatorio de 8 caracteres. */
export function generarCodigoInvitacion(): string {
  let codigo = '';
  for (let i = 0; i < LONGITUD_CODIGO; i++) {
    codigo += ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)];
  }
  return codigo;
}

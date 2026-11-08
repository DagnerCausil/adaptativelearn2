# AGENTS.md — Instrucciones para la IA del proyecto AdaptiveLearn

Lee este archivo completo antes de escribir código. Luego lee `docs/modelo-v2.md` antes de tocar
cualquier esquema, DTO o servicio. El plan de trabajo por fases está en `docs/plan-vibe-coding.md`.

## Qué es el proyecto

AdaptiveLearn es una plataforma educativa basada en competencias (marco MODESEC) que aplica un
**diagnóstico adaptativo** sobre los DBA del MEN y le entrega al docente el estado de cada estudiante
por evidencia. El docente conserva siempre la decisión pedagógica final.

Este repositorio es **solo el backend (API REST)**.

## Stack (no cambiarlo sin que el equipo lo pida)

- NestJS 12, TypeScript 6, **ES Modules** (`"type": "module"`)
- MongoDB Atlas con Mongoose (`@nestjs/mongoose`)
- Swagger / OpenAPI en `/api` (`@nestjs/swagger`)
- Validación con `class-validator` + `class-transformer`
- Configuración con `@nestjs/config` y archivo `.env`
- Pruebas con **Vitest** (no Jest), lint con **oxlint**, formato con Prettier (comillas simples, coma final)

## Reglas obligatorias

1. **El modelo v2 manda.** Hay exactamente 14 colecciones, con los nombres y campos de
   `docs/modelo-v2.md`. No agregar colecciones, campos ni valores de enum que no estén ahí.
   Si algo falta o es ambiguo, **pregunta** en vez de inventar.
2. **Imports con extensión `.js`.** Por ser ESM, todo import relativo termina en `.js`
   (`import { X } from './x.service.js';`) aunque el archivo sea `.ts`.
3. **Nombres en español y snake_case en los datos**, exactamente como en el modelo
   (`id_experiencia_evidencia`, `fecha_union`). Clases en PascalCase en español
   (`ExperienciaEvidencia`, `CreateInscripcionDto`).
4. **IDs de Mongo.** Los parámetros `:id` son `ObjectId` en texto. Nunca usar `+id` ni `Number(id)`.
   Validar con `ParseObjectIdPipe` de `@nestjs/mongoose` (o un pipe propio con `isValidObjectId`).
5. **Nada de datos quemados.** Los servicios leen y escriben en MongoDB mediante `@InjectModel`.
   Los datos de ejemplo van en un script de *seed*, no en los servicios.
6. **DTOs completos.** Cada campo con su decorador de `class-validator` y `@ApiProperty`.
   `UpdateXDto` usa `PartialType` de `@nestjs/swagger`. Los campos derivados
   (`respuestas.correcta`, `resultados.estado`, `codigo_invitacion`, fechas automáticas)
   **no** se aceptan desde el cliente.
7. **Errores HTTP correctos:** `404` si no existe, `409` si viola un índice único o hay referencias
   vivas al borrar, `400` si falla una validación o una regla de negocio.
8. **Secretos fuera del código.** La cadena de MongoDB va en `MONGODB_URI` dentro de `.env`.
   Nunca escribir usuarios, contraseñas ni claves en archivos `.ts`, ni en este archivo.
9. **Reglas pendientes:** la parada de la secuencia adaptativa (ADR-016), el cálculo de
   `resultados.estado` (ADR-021) y el `estado_general` del reporte **no están definidos**.
   Deja un `TODO(ADR-016)` / `TODO(ADR-021)` / `TODO(REPORTE)` y no inventes la fórmula.
10. **Cambios pequeños.** Un módulo o una regla por tarea. No reescribir módulos que no se pidieron.
11. **Ramas.** Nunca hacer commit en `main`. Cada integrante trabaja en `feature/<parte>` y solo
    modifica las carpetas de su parte (más su línea en `app.module.ts`). Si una tarea exige tocar
    el módulo de otra rama, avisa en vez de editarlo. Reparto en `docs/plan-vibe-coding.md`.

## Estructura de un módulo

```
src/<coleccion>/
  <coleccion>.module.ts        MongooseModule.forFeature([{ name: X.name, schema: XSchema }])
  <coleccion>.controller.ts    rutas REST + decoradores de Swagger (@ApiTags, @ApiOkResponse...)
  <coleccion>.service.ts       lógica y acceso a datos con Model<X>
  schemas/<singular>.schema.ts @Schema({ collection: '<coleccion>', versionKey: false })
  dto/create-<singular>.dto.ts
  dto/update-<singular>.dto.ts
  <coleccion>.controller.spec.ts / <coleccion>.service.spec.ts
```

- Usa `schemas/` (no `entities/`). Si el módulo trae `entities/` del generador, elimínalo.
- Enums compartidos en `src/common/enums.ts`.
- Los módulos que necesitan otro modelo lo importan con `MongooseModule.forFeature` o importando
  el módulo que lo exporta; no dupliques esquemas.

## Pruebas

- Los tests unitarios **no se conectan a Mongo**: mockea el modelo con
  `{ provide: getModelToken(X.name), useValue: mockModel }`.
- Cada regla de negocio de `docs/modelo-v2.md` §4 que implementes lleva al menos un test.
- Antes de dar una tarea por terminada, deben pasar: `npm run build`, `npm test` y `npm run lint`.

## Comandos

```bash
npm run start:dev   # API en http://localhost:3000 y Swagger en http://localhost:3000/api
npm run build
npm test
npm run lint
npm run format
npm run seed        # carga DBA y evidencias (cuando exista el script)
```

## Qué no hacer

- No cambiar a Prisma, TypeORM, Jest ni CommonJS.
- No crear colección ni esquema para REPORTES (se calcula).
- No embeber opciones dentro de ítems ni respuestas dentro de presentaciones.
- No devolver puntajes ni notas: los resultados son `muestra` / `no_muestra` / `no_concluyente`.
- No subir `.env` ni pegar la cadena de conexión en el chat.

# Instrucciones para GitHub Copilot

Las reglas del proyecto están en `AGENTS.md` (raíz del repositorio) y la especificación de datos en
`docs/modelo-v2.md`. Léelos antes de generar código y síguelos al pie de la letra.

Resumen de lo más importante:

- NestJS 12 + Mongoose + ES Modules: todo import relativo termina en `.js`.
- El modelo v2 tiene 14 colecciones; no inventes colecciones, campos ni valores de enum.
- Los `:id` son ObjectId (texto). Nunca `+id`.
- Nada de datos quemados en los servicios; todo va a MongoDB.
- Secretos solo en `.env` (`MONGODB_URI`).
- Pruebas con Vitest (no Jest), mockeando el modelo con `getModelToken`.
- Las reglas del diagnóstico están en docs/modelo-v2.md sección 7; usa las constantes de src/common/umbrales.ts

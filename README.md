# AdaptiveLearn — Backend

API REST de **AdaptiveLearn**, una plataforma educativa que aplica un **diagnóstico adaptativo** sobre los Derechos Básicos de Aprendizaje (DBA) del MEN y le entrega al docente el estado de cada estudiante por evidencia de aprendizaje, en el marco metodológico **MODESEC**. El docente conserva siempre la decisión pedagógica final: el sistema no pone notas ni puntajes.

Proyecto del curso *Diseño y Desarrollo de Software Educativo*, desarrollado por Dagner, Natalia, Selenis, Carmen y Marinelly.

## Tecnologías

| Componente | Uso |
| --- | --- |
| [NestJS 12](https://nestjs.com) + TypeScript (ES Modules) | Framework de la API |
| MongoDB Atlas + Mongoose | Base de datos: una colección por tabla del modelo v2 |
| Swagger / OpenAPI | Documentación y pruebas de la API en `/api` |
| class-validator + class-transformer | Validación de los datos de entrada |
| Vitest | Pruebas unitarias y de flujo completo (e2e) |
| oxlint + Prettier | Calidad y formato del código |

## Requisitos

- Node.js 22 o superior (los scripts usan `node --env-file`).
- npm.
- Acceso al clúster de MongoDB Atlas del proyecto (usuario y contraseña se piden por privado al equipo).

## Instalación

```bash
git clone https://github.com/DagnerCausil/adaptativelearn2.git
cd adaptativelearn2
npm install
```

Copia `.env.example` como `.env` y reemplaza `USUARIO` y `CONTRASENA` por los datos reales:

| Variable | Para qué sirve |
| --- | --- |
| `MONGODB_URI` | Conexión a la base de datos de trabajo |
| `MONGODB_URI_TEST` | Conexión a una base **distinta** para la prueba de flujo completo (`adaptivelearn2_e2e`) |
| `PORT` | Puerto de la API (por defecto `3000`) |

> La conexión usa el formato directo `mongodb://host1,host2,host3/...` en lugar de `mongodb+srv://`, porque algunas redes no resuelven los registros SRV de Atlas (error `queryTxt ETIMEOUT`).
>
> El archivo `.env` nunca se sube a GitHub (está en `.gitignore`).

Carga los DBA y evidencias del MEN, y arranca la API:

```bash
npm run seed
npm run start:dev
```

La API queda en `http://localhost:3000` y la documentación interactiva en **`http://localhost:3000/api`**.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run start:dev` | Arranca la API y la reinicia con cada cambio |
| `npm run build` | Compila el proyecto en `dist/` |
| `npm test` | Corre las pruebas unitarias |
| `npm run test:e2e` | Corre la prueba del flujo completo contra `MONGODB_URI_TEST` |
| `npm run lint` | Revisa el código con oxlint |
| `npm run format` | Da formato al código con Prettier |
| `npm run seed` | Carga o actualiza los DBA y evidencias de `src/seed/data/dbas.json` (no duplica) |
| `npm run demo` | Crea datos de demostración: docente, estudiante y una experiencia publicada con 6 ítems; imprime el código de invitación |
| `npm run importar:dbas` | Regenera `src/seed/data/dbas.json` desde el catálogo de DBA (ver `src/seed/importar-dbas-men.mjs`) |

## Cómo funciona el diagnóstico

1. **El docente arma la experiencia.** Elige un DBA, selecciona sus evidencias, crea ítems (`single_choice`, `ordering` o `matching`) con sus opciones y los aprueba.
2. **La publica.** El sistema exige al menos una evidencia incluida y genera un **código de invitación** de 8 caracteres.
3. **El estudiante se une** con ese código.
4. **Recibe los ítems uno a uno.** Responde cada ítem con su nivel de certeza (CRI de 0 a 5). El servidor decide si la respuesta es correcta; nunca le muestra al estudiante cuál es la opción correcta.
5. **El diagnóstico se detiene** según la regla adaptativa (entre 4 y 6 ítems).
6. **Se calculan los resultados por evidencia**: `muestra`, `no_muestra` o `no_concluyente`.
7. **El docente consulta el reporte** de la experiencia, que se calcula al momento y no se guarda.

### Reglas del diagnóstico

Las definió el profesor el 8 de noviembre de 2026. Los umbrales están en `src/common/umbrales.ts` y el detalle en [`docs/modelo-v2.md`](docs/modelo-v2.md), sección 7.

| Regla | Criterio |
| --- | --- |
| Parada (ADR-016) | Si los 4 primeros ítems son correctos con certeza ≥ 4, termina; si no, sigue hasta 6 |
| Estado por evidencia (ADR-021) | Todas correctas con certeza ≥ 3 → `muestra`; todas incorrectas → `no_muestra`; mixtas o incompletas → `no_concluyente` |
| Estado general del reporte | ≥ 80 % en `muestra` → `logrado`; predomina `no_muestra` → `requiere_refuerzo`; resto → `en_proceso` |
| Corrección de `ordering` y `matching` | Por el campo `orden` de las opciones |
| Opciones por formato (RI-4) | `single_choice` ≥ 2 con 1 correcta; `ordering` ≥ 2; `matching` ≥ 4 con 2 por lado |

## Endpoints

Todos los `:id` son ObjectId de MongoDB. Errores comunes: **400** datos o reglas inválidos, **404** no existe, **409** duplicado o registro en uso.

| Módulo | Método y ruta | Descripción |
| --- | --- | --- |
| Docentes | `POST /docentes` · `GET /docentes` · `GET/PATCH/DELETE /docentes/:id` | CRUD de docentes (correo único) |
| Estudiantes | `POST /estudiantes` · `GET /estudiantes` · `GET/PATCH/DELETE /estudiantes/:id` | CRUD de estudiantes (correo único) |
| DBA | `POST /dbas` · `GET /dbas` · `GET/PATCH/DELETE /dbas/:id` | DBA del MEN (código único) |
| DBA | `GET /dbas/:id/evidencias` | Evidencias de un DBA, en orden |
| Evidencias | `POST /evidencias` · `GET /evidencias` · `GET/PATCH/DELETE /evidencias/:id` | Evidencias de aprendizaje del MEN |
| Dictámenes | `POST /dictamenes_evidencia` · `GET /dictamenes_evidencia` · `GET/PATCH/DELETE /dictamenes_evidencia/:id` | Juicio del equipo sobre si una evidencia admite pregunta cerrada |
| Experiencias | `POST /experiencias` · `GET /experiencias?id_docente=` · `GET/PATCH/DELETE /experiencias/:id` | Diagnóstico del docente sobre un DBA |
| Experiencias | `POST /experiencias/:id/publicar` | Publica la experiencia |
| Experiencias | `POST /experiencias/:id/evidencias` · `GET /experiencias/:id/evidencias` | Evidencias seleccionadas (del mismo DBA) |
| Experiencias | `PATCH /experiencias/:id/evidencias/:idSeleccion` | Incluir o excluir una evidencia seleccionada |
| Experiencias | `GET /experiencias/:id/reporte` | Reporte calculado de la experiencia |
| Ítems | `POST /items` · `GET /items?id_experiencia_evidencia=` · `GET/PATCH/DELETE /items/:id` | Banco de ítems por evidencia seleccionada |
| Ítems | `PATCH /items/:id/revision` | El docente aprueba o rechaza el ítem |
| Opciones | `POST /items/:id/opciones` · `GET /items/:id/opciones` | Opciones de un ítem |
| Opciones | `GET/PATCH/DELETE /opciones/:id` | Una opción |
| Inscripciones | `POST /inscripciones/unirse` | El estudiante se une con el código de invitación |
| Inscripciones | `GET /inscripciones?id_estudiante=&id_experiencia=` · `GET/DELETE /inscripciones/:id` | Consulta de inscripciones |
| Inscripciones | `POST /inscripciones/:id/siguiente-item` | Siguiente ítem del diagnóstico, o `{ terminado: true }` |
| Presentaciones | `GET /presentaciones?id_inscripcion=` · `GET /presentaciones/:id` | Ítems mostrados al estudiante |
| Respuestas | `POST /respuestas` · `GET /respuestas/:id` | Respuesta del estudiante con certeza |
| Respuestas | `GET /presentaciones/:id/respuesta` | Respuesta de una presentación |
| Resultados | `POST /inscripciones/:id/calcular-resultados` | Calcula el estado por evidencia |
| Resultados | `GET /inscripciones/:id/resultados` · `GET /resultados/:id` | Consulta de resultados |

Los cuerpos de cada petición, con ejemplos, están en Swagger (`/api`).

## Pruebas

- **Unitarias:** `npm test`. Cada módulo prueba sus reglas sin conectarse a MongoDB.
- **Flujo completo:** `npm run test:e2e`. Recorre todo el diagnóstico por la API contra la base de `MONGODB_URI_TEST`. Se niega a correr si esa base es la misma de `MONGODB_URI`, y al final borra los datos que creó.
- **Prueba manual:** `npm run demo`, y con el código de invitación que imprime, sigue el flujo del estudiante en Swagger.

## Estructura

```
src/
  common/        enums del modelo y umbrales del diagnóstico
  <coleccion>/   un módulo por colección: schemas/, dto/, servicio, controlador y pruebas
  seed/          carga de DBA y evidencias del MEN
  demo/          datos de demostración
test/            prueba de flujo completo (e2e)
docs/            modelo de datos y plan de trabajo
```

## Documentación del proyecto

- [`docs/modelo-v2.md`](docs/modelo-v2.md): las 14 colecciones, sus campos, índices y reglas de negocio.
- [`docs/plan-vibe-coding.md`](docs/plan-vibe-coding.md): plan por fases y reparto del equipo.
- [`AGENTS.md`](AGENTS.md): reglas para trabajar con asistentes de IA en el proyecto.
- `src/docs-context/`: documento maestro, modelo entidad-relación y guías del curso.

## Cómo trabajamos

- `main` es la rama estable: todo entra por **Pull Request** revisado por otra integrante.
- Cada cambio va en su propia rama (`feature/...` o `fix/...`).
- Antes de abrir un PR: `npm run build`, `npm test` y `npm run lint` deben pasar, y el `.env` nunca se sube.

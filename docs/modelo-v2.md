# Modelo de datos v2 — especificación para MongoDB / Mongoose

Fuente de verdad: **Modelo relacional v2** (`adaptivelearn_mr_v2.dbml`, 14 tablas, 17 referencias)
y **MER v4** (notación Chen, entidades en plural). Este archivo traduce ese modelo a colecciones
de MongoDB. Si algo aquí contradice el modelo v2, gana el modelo v2 y este archivo se corrige.

## 1. Cómo se traduce el modelo relacional a MongoDB

| Relacional (v2)                  | MongoDB / Mongoose (este proyecto)                                   |
|----------------------------------|-----------------------------------------------------------------------|
| Tabla                            | Colección con el **mismo nombre en plural y snake_case**              |
| `id integer` (PK)                | `_id: ObjectId` (lo genera Mongo; no se crea un campo `id` aparte)    |
| `id_x integer` (FK)              | `id_x: Types.ObjectId` con `ref` al modelo de la colección destino    |
| `NN` (not null)                  | `required: true`                                                      |
| `UQ` (único)                     | `unique: true` (índice único)                                         |
| PK compuesta del MER (entidad débil) | Índice **único compuesto** sobre los campos que la forman         |
| `varchar(n)`                     | `String` con `maxlength: n` y `trim: true`                            |
| `smallint`                       | `Number` con validación de entero (`Number.isInteger`)                |
| `timestamp`                      | `Date`                                                                |
| `enum`                           | `String` con `enum: [...]`                                            |

Reglas fijas:

- **Una colección por tabla. No se embeben documentos** (ni opciones dentro de ítems, ni respuestas
  dentro de presentaciones). El profesor evalúa la fidelidad al modelo v2.
- Los nombres de campos se escriben **exactamente** como en el modelo (`id_experiencia_evidencia`,
  `fecha_union`, `valor_dado`...). No traducir al inglés ni pasar a camelCase.
- `versionKey: false` y **sin** `timestamps` automáticos: las fechas del modelo son campos propios.
- REPORTES **no es colección**: es un endpoint calculado (ver §5).

## 2. Enums

```ts
export const ESTADO_EXPERIENCIA = ['borrador', 'publicada'] as const;
export const FORMATO_ITEM       = ['single_choice', 'matching', 'ordering'] as const;
export const GRUPO_OPCION       = ['izquierda', 'derecha'] as const;
export const ESTADO_RESULTADO   = ['muestra', 'no_muestra', 'no_concluyente'] as const;
```

Ubicación sugerida: `src/common/enums.ts`. No inventar otros valores (por ejemplo, `aprobado` /
`reprobado` u `opcion_multiple` **no existen** en el modelo).

## 3. Colecciones (14)

Las colecciones están agrupadas por las seis vistas del MER.

### Vista 1 · Currículo oficial (dato del MEN)

**`dbas`** — Derecho Básico de Aprendizaje. Dato oficial: se carga por *seed*, no lo crea el docente.

| Campo      | Tipo   | Reglas                         |
|------------|--------|--------------------------------|
| codigo     | String | required, unique, maxlength 20 |
| area       | String | required, maxlength 60         |
| grado      | Number | required, entero               |
| enunciado  | String | required                       |
| ejemplo    | String | opcional                       |

**`evidencias`** — Evidencia de aprendizaje del MEN. Entidad débil de `dbas`.

| Campo     | Tipo     | Reglas                     |
|-----------|----------|----------------------------|
| id_dba    | ObjectId | required, ref `Dba`        |
| numero    | Number   | required, entero ≥ 1       |
| enunciado | String   | required                   |

Índice único compuesto: `{ id_dba: 1, numero: 1 }`.

**`dictamenes_evidencia`** — Juicio **propio del equipo** (no del MEN) sobre si una evidencia admite
pregunta cerrada (ADR-006, pendiente del censo QA-014). Relación 1:1 opcional con evidencia.

| Campo                  | Tipo     | Reglas                            |
|------------------------|----------|-----------------------------------|
| id_evidencia           | ObjectId | required, **unique**, ref `Evidencia` |
| aplica_formato_cerrado | Boolean  | required                          |
| justificacion          | String   | opcional                          |
| fecha_dictamen         | Date     | required                          |

### Vista 2 · Autoría de la experiencia

**`docentes`** y **`estudiantes`** (misma forma)

| Campo      | Tipo   | Reglas                                   |
|------------|--------|------------------------------------------|
| nombre     | String | required, maxlength 120                  |
| correo     | String | required, **unique**, maxlength 160, minúsculas, formato email |
| avatar_url | String | opcional, maxlength 255, URL             |

**`experiencias`** — Diagnóstico armado por un docente sobre un DBA.

| Campo             | Tipo     | Reglas                                                       |
|-------------------|----------|--------------------------------------------------------------|
| id_docente        | ObjectId | required, ref `Docente`                                      |
| id_dba            | ObjectId | required, ref `Dba`                                          |
| nombre            | String   | required, maxlength 150                                      |
| estado            | String   | required, enum `ESTADO_EXPERIENCIA`, default `borrador`      |
| fecha_creacion    | Date     | required, default `Date.now`                                 |
| fecha_publicacion | Date     | opcional; se llena al publicar                               |
| codigo_invitacion | String   | required, **unique**, maxlength 12; lo genera el servidor    |

**`experiencias_evidencias`** — Evidencias que el docente seleccionó para la experiencia
(hallazgo H-4). Un ítem y un resultado cuelgan de aquí, no de experiencia y evidencia por separado.

| Campo          | Tipo     | Reglas                       |
|----------------|----------|------------------------------|
| id_experiencia | ObjectId | required, ref `Experiencia`  |
| id_evidencia   | ObjectId | required, ref `Evidencia`    |
| incluida       | Boolean  | required, default `true`     |

Índice único compuesto: `{ id_experiencia: 1, id_evidencia: 1 }`.

### Vista 3 · Banco de diagnóstico

**`items`**

| Campo                    | Tipo     | Reglas                                   |
|--------------------------|----------|------------------------------------------|
| id_experiencia_evidencia | ObjectId | required, ref `ExperienciaEvidencia`     |
| enunciado                | String   | required                                 |
| formato                  | String   | required, enum `FORMATO_ITEM`            |
| origen                   | String   | required, maxlength 30                   |
| estado_revision          | String   | required, maxlength 30                   |
| excluido                 | Boolean  | required, default `false`                |

> `origen` y `estado_revision` son texto libre en el modelo (varchar 30). El equipo debe fijar la
> lista de valores permitidos antes de implementarlos; mientras tanto no se convierten en enum.

**`opciones`**

| Campo           | Tipo     | Reglas                                                |
|-----------------|----------|-------------------------------------------------------|
| id_item         | ObjectId | required, ref `Item`                                  |
| texto           | String   | required                                              |
| orden           | Number   | required, entero                                      |
| es_correcta     | Boolean  | required                                              |
| grupo           | String   | opcional, enum `GRUPO_OPCION` (solo en `matching`)    |
| hipotesis_error | String   | opcional (ADR-020: cada distractor tiene la suya)     |

### Vista 4 · Inscripción y entrega

**`inscripciones`**

| Campo          | Tipo     | Reglas                       |
|----------------|----------|------------------------------|
| id_estudiante  | ObjectId | required, ref `Estudiante`   |
| id_experiencia | ObjectId | required, ref `Experiencia`  |
| fecha_union    | Date     | required, default `Date.now` |

Índice único recomendado: `{ id_estudiante: 1, id_experiencia: 1 }` (un estudiante no se inscribe
dos veces a la misma experiencia; confirmar con el profesor).

**`presentaciones`** — El hecho de **mostrar** un ítem (distinto de responderlo; hallazgos H-2 y H-3).

| Campo              | Tipo     | Reglas                        |
|--------------------|----------|-------------------------------|
| id_inscripcion     | ObjectId | required, ref `Inscripcion`   |
| id_item            | ObjectId | required, ref `Item`          |
| orden_presentacion | Number   | required, entero ≥ 1          |
| fecha_presentacion | Date     | required, default `Date.now`  |

Índice único compuesto: `{ id_inscripcion: 1, id_item: 1 }`.

### Vista 5 · Captura de la respuesta

**`respuestas`**

| Campo           | Tipo     | Reglas                                                    |
|-----------------|----------|-----------------------------------------------------------|
| id_presentacion | ObjectId | required, **unique**, ref `Presentacion`                  |
| certeza         | Number   | required, entero **0 a 5** (CRI, Hasan et al., 1999)      |
| correcta        | Boolean  | required, **derivado**: lo calcula el servidor            |
| fecha_respuesta | Date     | required, default `Date.now`                              |

**`respuestas_opciones`** — Relación n:m `selecciona` hecha entidad (ADR-019).

| Campo        | Tipo     | Reglas                                                                |
|--------------|----------|-----------------------------------------------------------------------|
| id_respuesta | ObjectId | required, ref `Respuesta`                                             |
| id_opcion    | ObjectId | required, ref `Opcion`                                                |
| valor_dado   | Number   | opcional, entero: posición en `ordering` o número de pareja en `matching`; vacío en `single_choice` |

Índice único compuesto: `{ id_respuesta: 1, id_opcion: 1 }`.

### Vista 6 · Conclusión

**`resultados`** — Fotografía del estado del estudiante por evidencia (ADR-021).

| Campo                    | Tipo     | Reglas                                |
|--------------------------|----------|---------------------------------------|
| id_inscripcion           | ObjectId | required, ref `Inscripcion`           |
| id_experiencia_evidencia | ObjectId | required, ref `ExperienciaEvidencia`  |
| estado                   | String   | required, enum `ESTADO_RESULTADO`     |
| fecha_calculo            | Date     | required, default `Date.now`          |

Índice único compuesto: `{ id_inscripcion: 1, id_experiencia_evidencia: 1 }`.

## 4. Reglas de negocio que el código debe hacer cumplir

| Código   | Regla | Dónde se valida |
|----------|-------|-----------------|
| ADR-005  | El banco de ítems es **por experiencia**: un ítem nunca se comparte entre experiencias, aunque usen el mismo DBA. | `items` (crear) |
| H-4 / participación (1,N) | Una experiencia **no se puede publicar** si no tiene al menos una `experiencias_evidencias` con `incluida = true`. | `experiencias` (publicar) |
| Coherencia DBA | Al seleccionar una evidencia para una experiencia, la evidencia debería pertenecer al mismo DBA de la experiencia. *Validación recomendada; confirmar con el profesor.* | `experiencias_evidencias` (crear) |
| RI-4 / H-9 | Mínimo de opciones por formato: `single_choice` ≥ 2 con exactamente 1 correcta; `ordering` ≥ 2; `matching` ≥ 4 con al menos 2 en `izquierda` y 2 en `derecha`. `grupo` solo se usa en `matching`. | `items` (al publicar la experiencia o al cerrar el ítem) |
| ADR-020 | `hipotesis_error` vive en la opción, no en el ítem. | `opciones` |
| ADR-016 | Secuencia adaptativa del diagnóstico: **mínimo 4 ítems, tope 6**; sigue o para según la certeza de lo que va respondiendo. **La regla exacta de parada aún no está escrita: no inventarla**, dejar un `TODO(ADR-016)` y pedírsela al equipo. | `presentaciones` (siguiente ítem) |
| H-2/H-3 | Una presentación sin respuesta es válida y significa "se le mostró y no respondió". | `presentaciones` / `respuestas` |
| registra 1:1 | Una presentación tiene **a lo sumo una** respuesta (`id_presentacion` único). | `respuestas` |
| derivado | `respuestas.correcta` **nunca** viene del cliente: se calcula comparando las opciones seleccionadas y su `valor_dado` con las opciones del ítem. | `respuestas` (crear) |
| ADR-019 | `valor_dado` = posición asignada (`ordering`) o número de pareja (`matching`). | `respuestas_opciones` |
| ADR-021 | `resultados.estado` se calcula a partir de las respuestas y **se guarda** con su `fecha_calculo`. Un resultado histórico **no se modifica**: si se recalcula, se crea uno nuevo o se reemplaza explícitamente, nunca con `PATCH`. Valores: `muestra` / `no_muestra` / `no_concluyente`. **Nunca un puntaje ni una nota.** La regla de cálculo es versionable y aún debe definirse: `TODO(ADR-021)`. | `resultados` |
| ADR-006 | `dictamenes_evidencia` es criterio propio, separado del dato oficial del MEN. No mezclar sus campos dentro de `evidencias`. | `dictamenes_evidencia` |
| Dato oficial | `dbas` y `evidencias` se cargan por *seed* desde los documentos del MEN; los endpoints de escritura de estas colecciones son solo para administración. | `dbas`, `evidencias` |

## 5. REPORTES (derivado, no se almacena)

Endpoint: `GET /experiencias/:id/reporte`. Se calcula al consultarlo a partir de `resultados`:

- `estado_por_evidencia`: para cada `experiencias_evidencias` incluida, conteo de inscripciones
  en `muestra`, `no_muestra` y `no_concluyente`.
- `estado_general`: resumen de la experiencia. La fórmula aún no está definida: `TODO(REPORTE)`.

No crear colección, esquema ni módulo CRUD para reportes.

## 6. Borrados

- No se permite borrar un documento que tenga referencias vivas (por ejemplo, un docente con
  experiencias, una experiencia con inscripciones, un ítem con presentaciones). Responder `409 Conflict`.
- `resultados` y `respuestas` no tienen `PATCH` ni `DELETE` públicos.

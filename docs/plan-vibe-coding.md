# Plan de vibe coding — AdaptiveLearn backend

Cómo construir el backend del modelo v2 desde VS Code con un asistente de IA en modo agente
(GitHub Copilot, Claude Code, Cursor u otro). Cada fase trae un **prompt listo para pegar** y una
**lista de verificación**. No se pasa a la siguiente fase hasta cumplir la lista.

## Antes de empezar

1. Abrir la carpeta `adaptativelearn2_app` en VS Code (la raíz debe contener `AGENTS.md`).
2. Usar el chat en **modo agente** (que pueda leer y editar archivos y ejecutar la terminal).
   - Copilot lee `AGENTS.md` y `.github/copilot-instructions.md` automáticamente.
   - Claude Code lee `CLAUDE.md`, que importa `AGENTS.md` y `docs/modelo-v2.md`.
   - Si usan otra herramienta, empiecen cada conversación con: *"Lee AGENTS.md y docs/modelo-v2.md"*.
3. Cada integrante trabaja en **su propia rama** y abre un Pull Request (ver "Trabajo en equipo").

## Trabajo en equipo: ramas y reparto

**Reglas de ramas**

- `main` es la rama estable. **Nadie hace commit directo en `main`**: todo entra por Pull Request.
- Cada integrante crea una rama para su parte, siempre desde `main` actualizado:
  `feature/<parte>` (por ejemplo `feature/docentes-estudiantes`).
- Una rama = una parte del modelo. Cuando se une a `main`, la rama se puede borrar.
- Antes de empezar el día: `git checkout main`, `git pull`, vuelves a tu rama y `git merge main`.

**Orden y reparto (5 integrantes, 14 colecciones)**

| Paso | Rama | Colecciones | Quién |
|------|------|-------------|-------|
| 1 | `feature/configuracion-base` | Fase 0 y Fase 0B (esquemas de las 14 colecciones) | 1 integrante, **antes que todos** |
| 2 | `feature/actores` | docentes, estudiantes | Integrante 1 |
| 2 | `feature/curriculo` | dbas, evidencias, dictamenes_evidencia + seed | Integrante 2 |
| 2 | `feature/experiencias` | experiencias, experiencias_evidencias | Integrante 3 |
| 2 | `feature/banco` | items, opciones | Integrante 4 |
| 2 | `feature/inscripciones` | inscripciones, presentaciones | Integrante 5 |
| 3 | `feature/respuestas` | respuestas, respuestas_opciones | El primero que termine el paso 2 |
| 3 | `feature/resultados` | resultados y reporte | El segundo que termine el paso 2 |
| 4 | `feature/cierre` | Fase 8: test e2e y README | Todo el equipo |

El paso 1 deja creados los **esquemas** de las 14 colecciones. Así, en el paso 2 cada uno trabaja
solo dentro de sus carpetas y puede referenciar los modelos de los demás sin esperarlos.
El único archivo que todos tocan es `src/app.module.ts` (una línea para registrar su módulo):
si GitHub marca conflicto ahí, se dejan las dos líneas.

**Comandos de cada integrante**

```
git checkout main
git pull
git checkout -b feature/actores        # tu rama
# ... trabajas con la IA, pruebas, y haces commits pequeños ...
git add .
git commit -m "actores: CRUD de docentes con Mongo"
git push -u origin feature/actores     # la primera vez; luego solo git push
```

Luego en GitHub: **Compare & pull request** → base `main` ← tu rama → otro integrante revisa →
**Merge**. Después todos actualizan su `main` con `git pull`.

## Ciclo de trabajo en cada prompt

1. Pega el prompt de la fase (uno a la vez, no todos juntos).
2. **Lee el diff** antes de aceptarlo. Si el asistente cambió algo que no se le pidió, recházalo.
3. Corre `npm run build`, `npm test` y `npm run lint`. Si algo falla, pégale el error al asistente.
4. Prueba los endpoints en Swagger (`http://localhost:3000/api`).
5. Haz commit con un mensaje claro: `git commit -m "fase 1: CRUD de docentes con Mongo"`.

Si el asistente se confunde después de muchos mensajes, abre un chat nuevo: el contexto del
proyecto está en los archivos, no en la conversación.

---

## Fase 0 · Seguridad y configuración base

> **Hacer primero, a mano:** la contraseña de MongoDB Atlas quedó escrita en `src/app.module.ts`.
> Entren a Atlas → *Database Access*, cambien la contraseña del usuario y usen la nueva solo en `.env`.
> Si el repositorio ya se subió a GitHub, la contraseña vieja debe considerarse pública.

Prompt:

```
Lee AGENTS.md. Vamos a dejar lista la configuración base:
1. Instala @nestjs/config, class-validator y class-transformer.
2. Crea .env a partir de .env.example (yo pongo los valores) y verifica que .env esté en .gitignore.
3. En app.module.ts usa ConfigModule.forRoot({ isGlobal: true }) y
   MongooseModule.forRootAsync leyendo MONGODB_URI. Quita la cadena de conexión quemada.
4. Quita ObserveModule y ObserveInstrument (no tenemos claves) de app.module.ts y main.ts.
5. En main.ts agrega ValidationPipe global con whitelist, forbidNonWhitelisted y transform,
   y cambia Swagger: título "AdaptiveLearn API", descripción "Backend del diagnóstico
   adaptativo (modelo v2)", versión "2.0".
6. Crea src/common/enums.ts con los 4 enums de docs/modelo-v2.md §2.
No toques los módulos de docentes, estudiantes, etc. todavía.
```

Verificación:
- [ ] `src/app.module.ts` ya no contiene usuario ni contraseña
- [ ] La API arranca con `npm run start:dev` y Swagger muestra "AdaptiveLearn API"
- [ ] `.env` no aparece en `git status`

## Fase 0B · Esquemas compartidos (misma rama que la Fase 0)

```
Lee AGENTS.md y docs/modelo-v2.md. Crea SOLO los esquemas de Mongoose de las 14 colecciones,
cada uno en src/<coleccion>/schemas/<singular>.schema.ts, con exactamente los campos, tipos,
required, unique, enums, refs e índices compuestos de docs/modelo-v2.md §3.
No crees módulos, servicios, controladores ni DTOs nuevos, y no modifiques los servicios
existentes. Corre npm run build al terminar.
```

Verificación:
- [ ] Hay 14 archivos `*.schema.ts` y ninguno tiene campos que no estén en el modelo v2
- [ ] `npm run build` pasa

## Fase 1 · Actores: docentes y estudiantes (módulo plantilla)

Este primer módulo sirve de **plantilla** para todos los demás; revísenlo con calma.

```
Lee AGENTS.md y docs/modelo-v2.md. Reescribe el módulo src/docentes para que use MongoDB:
- Usa el esquema schemas/docente.schema.ts creado en la Fase 0B (no lo dupliques).
- DTOs con class-validator y @ApiProperty; UpdateDocenteDto con PartialType de @nestjs/swagger.
- Servicio con @InjectModel: create, findAll, findOne, update, remove.
  404 si no existe, 409 si el correo ya existe.
- Controlador con ParseObjectIdPipe en :id y decoradores de Swagger.
- Borra la carpeta entities/ y los datos quemados.
- Actualiza los tests (Vitest) mockeando el modelo con getModelToken.
Cuando termine, corre npm run build, npm test y npm run lint.
```

Luego:

```
Haz lo mismo para src/estudiantes, siguiendo exactamente el patrón de src/docentes.
```

Verificación:
- [ ] Crear, listar, consultar, editar y borrar docentes desde Swagger guarda en Atlas
- [ ] Un correo repetido devuelve 409; un id inválido devuelve 400; uno inexistente, 404

## Fase 2 · Currículo oficial: dbas, evidencias, dictamenes_evidencia

```
Siguiendo el patrón de src/docentes, crea los módulos dbas, evidencias y dictamenes_evidencia
según docs/modelo-v2.md §3 Vista 1:
- evidencias: índice único compuesto { id_dba, numero }; validar que el DBA exista.
- dictamenes_evidencia: id_evidencia único; validar que la evidencia exista.
- Agrega GET /dbas/:id/evidencias.
Crea además un script src/seed/seed.ts y el comando "npm run seed" que cargue DBA y evidencias
desde src/seed/data/dbas.json. Deja ese JSON con UN ejemplo de estructura y valores
"PENDIENTE"; nosotros pondremos los DBA reales del MEN.
```

Verificación:
- [ ] `npm run seed` carga los datos sin duplicarlos si se corre dos veces
- [ ] No se puede crear una evidencia con un número repetido dentro del mismo DBA

## Fase 3 · Autoría: experiencias y experiencias_evidencias

```
Crea los módulos experiencias y experiencias_evidencias (docs/modelo-v2.md Vista 2 y §4):
- Al crear una experiencia: estado "borrador", fecha_creacion automática y codigo_invitacion
  único de 8 caracteres generado por el servidor (no viene del cliente).
- POST /experiencias/:id/publicar: solo si tiene al menos una experiencias_evidencias con
  incluida = true; pone estado "publicada" y fecha_publicacion. Si no cumple, 400.
- experiencias_evidencias: índice único { id_experiencia, id_evidencia }; validar que la
  evidencia pertenezca al mismo DBA de la experiencia.
- GET /experiencias/:id/evidencias lista las evidencias seleccionadas con populate.
Agrega tests para la regla de publicación.
```

Verificación:
- [ ] Publicar sin evidencias da 400; con una evidencia incluida, publica
- [ ] El código de invitación nunca se repite

## Fase 4 · Banco de diagnóstico: items y opciones

```
Reescribe src/items y crea src/opciones según docs/modelo-v2.md Vista 3 y §4:
- items cuelga de id_experiencia_evidencia (no de experiencia y evidencia por separado).
- formato usa el enum FORMATO_ITEM. origen y estado_revision quedan como texto (máx. 30).
- GET /items/:id/opciones devuelve las opciones ordenadas por "orden".
- Implementa la validación RI-4 en un método validarOpciones(idItem) del servicio de items:
  single_choice ≥ 2 opciones y exactamente 1 correcta; ordering ≥ 2;
  matching ≥ 4 con al menos 2 "izquierda" y 2 "derecha". grupo solo en matching.
- Llama esa validación al publicar la experiencia (fase 3) para todos sus ítems no excluidos.
Tests para cada caso de RI-4.
```

Verificación:
- [ ] Un `matching` con 3 opciones impide publicar la experiencia
- [ ] Los valores viejos (`opcion_multiple`, `abierto`) ya no existen en el código

## Fase 5 · Inscripción y entrega: inscripciones y presentaciones

```
Reescribe src/inscripciones y crea src/presentaciones (docs/modelo-v2.md Vista 4 y §4):
- POST /inscripciones/unirse con { id_estudiante, codigo_invitacion }: busca la experiencia
  publicada por código y crea la inscripción. 404 si el código no existe, 400 si está en
  borrador, 409 si el estudiante ya estaba inscrito.
- presentaciones: índice único { id_inscripcion, id_item }; orden_presentacion consecutivo.
- POST /inscripciones/:id/siguiente-item devuelve el próximo ítem a mostrar y registra la
  presentación. Implementa solo los límites de ADR-016 (mínimo 4, tope 6) y deja la regla de
  parada por certeza como TODO(ADR-016) con un comentario; no la inventes.
```

Verificación:
- [ ] Un estudiante no puede inscribirse dos veces a la misma experiencia
- [ ] Nunca se presentan más de 6 ítems por inscripción

## Fase 6 · Captura de la respuesta: respuestas y respuestas_opciones

```
Crea src/respuestas y src/respuestas_opciones (docs/modelo-v2.md Vista 5 y §4):
- POST /respuestas recibe { id_presentacion, certeza, opciones: [{ id_opcion, valor_dado? }] }.
- Valida: la presentación existe y no tiene respuesta (409 si ya tiene); certeza entero 0..5;
  las opciones pertenecen al ítem presentado; valor_dado obligatorio en ordering y matching.
- Calcula "correcta" en el servidor según el formato del ítem (nunca la recibe del cliente) y
  guarda la respuesta y sus respuestas_opciones.
- Sin PATCH ni DELETE para respuestas.
Tests: single_choice correcta/incorrecta, ordering con posiciones, matching con parejas.
```

Verificación:
- [ ] Enviar `correcta` en el cuerpo da 400 (no está en el DTO)
- [ ] Responder dos veces la misma presentación da 409

## Fase 7 · Conclusión: resultados y reporte

```
Reescribe src/resultados (docs/modelo-v2.md Vista 6, §4 y §5):
- estado usa ESTADO_RESULTADO (muestra / no_muestra / no_concluyente). Quita aprobado/reprobado.
- POST /inscripciones/:id/calcular-resultados crea un resultado por cada evidencia incluida
  de la experiencia, con fecha_calculo. La función que decide el estado va aislada en
  src/resultados/regla-resultado.ts con TODO(ADR-021); por ahora devuelve "no_concluyente".
- Sin PATCH ni DELETE para resultados (ADR-021: el histórico no muta).
- GET /experiencias/:id/reporte calcula, sin guardar nada, el conteo por evidencia de
  muestra / no_muestra / no_concluyente. estado_general queda como TODO(REPORTE).
```

Verificación:
- [ ] No existe colección `reportes` en Atlas
- [ ] Ningún endpoint devuelve puntajes ni notas

## Fase 8 · Cierre

```
1. Revisa que los 14 módulos del modelo v2 estén registrados en app.module.ts y que no sobre
   ningún módulo (por ejemplo, items/entities o código de plantilla).
2. Escribe un test e2e (vitest.config.e2e.ts) del flujo completo: docente crea experiencia,
   selecciona evidencia, crea ítem con opciones, publica, estudiante se une, recibe ítem,
   responde, se calculan resultados y se consulta el reporte. Usa una base de datos de pruebas
   (MONGODB_URI_TEST).
3. Reemplaza el README de NestJS por uno del proyecto: qué es, cómo instalar, variables de
   entorno, comandos, y la lista de endpoints.
```

---

## Decisiones que el equipo debe tomar (no se las pidan a la IA)

| Pendiente | Dónde aparece | Quién decide |
|-----------|---------------|--------------|
| Regla de parada por certeza de la secuencia adaptativa | `TODO(ADR-016)` | Equipo + profesor |
| Regla que convierte respuestas en `muestra` / `no_muestra` / `no_concluyente` | `TODO(ADR-021)` | Equipo + profesor |
| Fórmula de `estado_general` del reporte | `TODO(REPORTE)` | Equipo |
| Valores permitidos de `items.origen` y `items.estado_revision` | Fase 4 | Equipo |
| Si una evidencia seleccionada debe ser del mismo DBA de la experiencia | Fase 3 | Profesor |
| DBA y evidencias reales para el piloto | `src/seed/data/dbas.json` | Equipo |

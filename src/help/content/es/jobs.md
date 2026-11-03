---
title: Tareas
summary: Sigue las tareas en segundo plano, entiende sus estados y reintentos, pon una tarea en cola a mano y reintenta o cancela una tarea.
keywords: tarea, job, tarea en segundo plano, trabajo en segundo plano, cola, worker, reintentar, reintento, cancelar, dead letter, fallida, intentos, backoff, espera exponencial, poner en cola, clave de idempotencia, handler
---

Una **tarea** es un trabajo que se ejecuta en segundo plano en lugar de mientras alguien espera a que
cargue una pantalla: enviar un informe mensual, importar un archivo, entregar un webhook. Tu
producto, una programación o el propio Axentra ponen tareas en una cola, y un proceso **worker**
independiente las recoge y ejecuta el código (el **handler**) que corresponde al **tipo** de la
tarea. La pantalla **Tareas** muestra qué está esperando, qué se está ejecutando, qué ha funcionado y
qué ha fallado, y permite a los operadores reintentar o cancelar tareas.

> [!IMPORTANT]
> Las tareas requieren el módulo del servidor `events`; sin él, **Tareas** no aparece en la barra
> lateral. Verlas requiere el permiso `jobs:read` (lo tienen los propietarios, administradores,
> soporte y observadores del producto). **Poner tarea en cola**, **Reintentar** y **Cancelar
> tarea** requieren `jobs:manage`; sin ese permiso, estos botones están ocultos. Las tareas solo se
> ejecutan mientras haya al menos un proceso worker (`axentra worker`) en marcha. Esa es una tarea de
> operación; consulta la [configuración del servidor](help:server-configuration).

## Leer la lista de tareas {#jobs-list}

Abre [Tareas](app:jobs). La lista muestra primero las tareas más recientes, con **Tipo**,
**Estado**, **Intentos** (por ejemplo, `2 de 5`), **Inquilino** (o **Nivel de producto** para las
tareas que no pertenecen a un inquilino), **Creada** y **Actualizada**. Selecciona un tipo para abrir
los detalles de la tarea.

### Contadores del resumen {#overview}

La tarjeta **Resumen** cuenta las tareas por estado. Selecciona un contador para mostrar solo esas
tareas. Debajo de los contadores ves cuántas tareas se completaron y fallaron en las últimas 24 horas
(el número de fallidas incluye las tareas con estado **Fallida definitivamente**) y cuándo se creó la **Tarea en
cola más antigua**. Si esa hora es cada vez más antigua, ningún worker está recogiendo tareas:
comprueba que hay un worker en marcha y que gestiona este tipo.

### Filtrar tareas {#filter}

Filtra por **Estado**, por **Tipo** exacto (por ejemplo, `reports.send`) y por **Inquilino**, y
después elige **Aplicar filtros**. **Restablecer filtros** los borra. Los filtros forman parte de la
dirección de la página, así que puedes guardar en marcadores o compartir una vista filtrada.

### Seguir los cambios en directo {#live-updates}

Activa **Actualizaciones en directo** para seguir el flujo de tareas del servidor. Studio actualiza
entonces la lista y los contadores (como máximo una vez por segundo) cada vez que cambia una tarea.
El indicador junto al interruptor muestra el estado de la conexión; consulta
[Estado de la conexión](help:events#connection-status). Sin actualizaciones en directo, la lista solo
cambia cuando la recargas.

## Estados de las tareas {#statuses}

```diagram
job-lifecycle
```

| Estado                      | Significado                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **En cola**                 | Esperando a un worker. Una tarea con retraso o que espera su siguiente reintento también está en cola.                |
| **En ejecución**            | Un worker ha reclamado la tarea y tiene sobre ella una reserva de duración limitada.                                  |
| **Completada**              | El handler terminó. Su valor de retorno se guarda como **Resultado**.                                                 |
| **Fallida**                 | El handler informó de un error permanente (lanzó `PermanentJobError`). No hay más intentos automáticos.               |
| **Fallida definitivamente** | Se han agotado todos los intentos. La tarea se conserva como «dead letter» para que puedas examinarla y reintentarla. |
| **Cancelada**               | Se canceló antes de empezar, o el handler se detuvo tras una solicitud de cancelación.                                |

**Fallida** y **Fallida definitivamente** son estados finales, pero por motivos distintos:
**Fallida** significa que el handler decidió que reintentar no puede ayudar; **Fallida
definitivamente** significa que todos los intentos terminaron con un error.

**Tareas omitidas.** Una tarea cuyo producto está archivado o cuyo inquilino está suspendido (o ya
no existe) no se ejecuta. El worker la termina como **Fallida** con un último error que empieza por
`skipped:`, por ejemplo `skipped: the product or tenant is not active`. Studio la marca con **No
ejecutado: producto o inquilino inactivo**. Las tareas que lanza una programación terminan así
mientras el inquilino está suspendido. La tarea se conserva: cuando el producto y el inquilino
vuelvan a estar activos, reinténtala si todavía hace falta.

## Intentos, reintentos y espera exponencial {#retries}

Cada vez que un worker reclama una tarea, su contador de intentos aumenta en uno. Cuando un intento
termina con un error normal, la tarea vuelve a **En cola** y espera antes del siguiente intento. La
espera crece de forma exponencial: tras el intento _n_ está entre la mitad y el total de
`2 × 2^(n−1)` segundos (2, 4, 8, 16… segundos con la configuración predeterminada, nunca más de una
hora). Esta espera («backoff») da tiempo a que se resuelva un problema temporal, como un servicio
externo saturado. La parte aleatoria evita que muchas tareas fallidas se reintenten en el mismo
instante.

Cuando falla el último intento permitido, la tarea pasa a **Fallida definitivamente**. El valor
predeterminado es de **5** intentos, así que con la configuración predeterminada una tarea que
siempre falla queda fallida definitivamente al cabo de aproximadamente medio minuto. Puedes
establecer **Máx. de intentos** entre 1 y 100 al poner una tarea en cola o al crear una
programación.

Un worker que se bloquea deja de renovar su reserva. Cuando la reserva vence (60 segundos de forma
predeterminada), otro worker vuelve a poner la tarea en la cola. La ejecución perdida cuenta como un
intento.

> [!WARNING]
> Las tareas se ejecutan **al menos una vez**, no exactamente una vez. Una tarea puede ejecutarse
> dos veces, por ejemplo después de que un worker se bloquee o cuando no se pudo guardar el
> resultado. Los handlers deben ser idempotentes: ejecutarlos dos veces debe tener el mismo efecto
> que ejecutarlos una vez.

## Abrir los detalles de una tarea {#job-detail}

Selecciona el tipo de una tarea en la lista. La página de detalles muestra:

- **Detalles**: **ID de la tarea**, **Tipo**, **Estado**, **Inquilino**, **Intentos**,
  **Prioridad**, **Clave de idempotencia**, la **Programación** que creó la tarea (un enlace), el
  **Worker** que la ejecuta o la ejecutó, si está marcada **Cancelación solicitada**, y **Creada
  por** (un ID de usuario o de clave de API, o `schedule:<id>` para las tareas programadas).
- **Cronología**: **Creada**, **Ejecutar después de** (la hora de inicio más temprana, incluidos los
  retrasos y la espera exponencial), **Iniciada**, **Reservada hasta**, **Finalizada** y
  **Actualizada**.
- **Último error**: el mensaje de error del intento fallido más reciente, como máximo 2000
  caracteres. El servidor elimina los tokens, las claves de API y las cadenas de conexión antes de
  guardar el mensaje.
- **Payload** y **Resultado** en JSON. Los valores de claves como `password`, `secret`, `token` o
  `api_key` se muestran como `[redacted]`.

Mientras una tarea está **En cola** o **En ejecución**, la página se actualiza sola cada 3 segundos.

## Poner una tarea en cola {#enqueue}

Normalmente no pones tareas en cola a mano: de eso se encargan el código de tu producto y las
programaciones. Ponerlas en cola en Studio es útil para lanzar una ejecución puntual o para probar
un handler.

1. Abre [Tareas](app:jobs) y elige **Poner tarea en cola**.
2. Introduce el **Tipo**, por ejemplo `reports.send`. Debe corresponder a un handler que ejecute un
   worker.
3. Opcional: introduce el **Payload** como objeto JSON (la entrada del handler), elige un
   **Inquilino** y establece **Prioridad**, **Retraso (segundos)** y **Máx. de intentos**.
4. Elige **Poner en cola**. Studio abre la página de detalles de la tarea nueva.

| Ajuste                    | Qué hace                                                                                                            | Valores permitidos / valor predeterminado                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo**                  | Selecciona el handler que ejecuta la tarea.                                                                         | Empieza por una letra minúscula, seguida de letras minúsculas, dígitos y `_ . : -`, como máximo 100 caracteres. `axentra.` está reservado. Obligatorio. |
| **Payload**               | Entrada del handler.                                                                                                | Objeto JSON, como máximo 64 KB. Predeterminado: `{}`.                                                                                                   |
| **Inquilino**             | Ejecuta la tarea en el ámbito de un inquilino; el handler solo puede acceder entonces a los datos de ese inquilino. | Un inquilino del producto, o **Nivel de producto**.                                                                                                     |
| **Prioridad**             | Los valores más altos se reclaman primero cuando hay varias tareas pendientes.                                      | De −100 a 100. Predeterminado: 0.                                                                                                                       |
| **Retraso (segundos)**    | La tarea no empieza hasta que hayan pasado estos segundos.                                                          | De 0 a un año. Predeterminado: 0.                                                                                                                       |
| **Máx. de intentos**      | Cuántas veces se intenta la tarea antes de pasar a **Fallida definitivamente**.                                     | De 1 a 100. Vacío: valor predeterminado del servidor (5).                                                                                               |
| **Clave de idempotencia** | Evita crear la misma tarea dos veces.                                                                               | De 1 a 200 caracteres imprimibles. Studio rellena una clave aleatoria.                                                                                  |

> [!CAUTION]
> No pongas secretos (contraseñas, claves de API) en un payload. Los payloads se guardan tal cual y
> los puede leer cualquiera con `jobs:read` (los nombres de campo secretos habituales solo se ocultan
> en la vista). Pasa ids y deja que el handler lea el secreto.

### Clave de idempotencia {#idempotency-key}

Studio genera una clave nueva cada vez que abres el diálogo. Si envías dos veces (un doble clic, o
un reintento tras un tiempo de espera agotado), el servidor devuelve la tarea creada por el primer
envío en lugar de crear una segunda. La clave es única por producto, inquilino y tipo mientras
exista la tarea.

Si la misma clave ya se usó con otro payload u otra prioridad, o la usó otro llamante que no puede
leer tareas, el servidor rechaza la solicitud. Studio muestra entonces **Ya se usó para otra
solicitud** y ofrece **Usar una clave nueva**.

## Reintentar una tarea fallida {#retry}

1. Abre la tarea o abre el menú de acciones de su fila en la lista.
2. Elige **Reintentar** y confirma.

La tarea vuelve a **En cola** con su contador de intentos restablecido a 0, de modo que vuelve a
disponer de todos sus intentos. **Reintentar** solo se ofrece para las tareas con estado **Fallida**
o **Fallida definitivamente**. Corrige primero la causa (consulta **Último error**); de lo contrario,
la tarea volverá a fallar.

## Cancelar una tarea {#cancel}

1. Abre la tarea o abre el menú de acciones de su fila.
2. Elige **Cancelar tarea** y confirma.

Lo que ocurre depende del estado:

- Una tarea **En cola** se cancela en el acto y nunca se ejecuta.
- En una tarea **En ejecución**, la cancelación se _solicita_. La lista muestra **Cancelación
  solicitada**. El handler ve la solicitud la próxima vez que lo comprueba (los handlers lo
  comprueban entre pasos) y se detiene; la tarea termina entonces como **Cancelada**. Si el handler
  termina antes su trabajo, la tarea termina como **Completada**, porque el trabajo se hizo.

Las tareas que ya han finalizado no se pueden cancelar.

## Para desarrolladores y operadores {#developers}

### Handlers y workers {#workers}

Los handlers se registran en Python con `ax.jobs.register("reports.send", handler)` y los ejecuta
`axentra worker`. Un worker solo reclama los tipos para los que tiene un handler. Una tarea cuyo tipo
no gestiona ningún worker en marcha se queda **En cola** indefinidamente; no falla. Los handlers
pueden:

- devolver un valor JSON, que se convierte en el **Resultado** (si supera 64 KB, se sustituye por una
  nota de truncamiento);
- lanzar `PermanentJobError` para terminar en el acto como **Fallida**;
- lanzar `RetryJob(delay_seconds=…)` para reintentar tras el retraso que elijan;
- llamar a `ctx.heartbeat()` durante un trabajo largo para renovar la reserva, y a
  `ctx.cancel_requested()` para detectar una cancelación.

La lista de tareas y las estadísticas también están disponibles a través de la API:
`GET /v1/products/{product_id}/jobs`, `/jobs/stats` y el flujo SSE `/jobs/stream`. Consulta los
[fundamentos de la API](help:api-basics).

### Quién puede poner en cola cada tipo {#kind-permissions}

Quienes tienen `jobs:manage` pueden poner en cola cualquier tipo que no empiece por `axentra.`. A
través de la API, los miembros de un inquilino que solo tienen `events:publish` pueden poner en cola
un tipo únicamente cuando el producto les ha abierto ese tipo de forma explícita; si no, el servidor
responde «no permitido». Studio solo ofrece **Poner tarea en cola** a quienes tienen `jobs:manage`.

### Tipos de tarea integrados {#system-kinds}

Axentra usa la cola para su propio trabajo, así que verás estos tipos en la lista:

| Tipo                      | Finalidad                                                                       |
| ------------------------- | ------------------------------------------------------------------------------- |
| `axentra.event.dispatch`  | Distribuye un evento publicado a los suscriptores y a los endpoints de webhook. |
| `axentra.event.handle`    | Ejecuta un suscriptor dentro del proceso para un evento.                        |
| `axentra.webhook.deliver` | Envía una entrega de webhook; consulta [Webhooks](help:webhooks#retries).       |

No puedes poner en cola tú mismo los tipos `axentra.`, pero puedes reintentarlos y cancelarlos como
las demás tareas.

### Retención {#retention}

Las tareas finalizadas (**Completada**, **Fallida**, **Fallida definitivamente**, **Cancelada**) se
eliminan a los 30 días de forma predeterminada (`observability.job_retention_days`). Las tareas en
cola y en ejecución nunca se purgan.

## Conviene saber {#good-to-know}

- No hay un orden garantizado. Primero va la prioridad más alta y después la hora de inicio más
  temprana, pero los reintentos y los workers en paralelo alteran el orden de las tareas.
- Cada tarea se entrega exactamente a un worker por intento.
- Cada puesta en cola, reintento y cancelación se registra en el
  [registro de auditoría](help:audit) (`events.job.enqueue`, `events.job.retry`,
  `events.job.cancel`).
- La comprobación de disponibilidad (readiness) del servidor no incluye los workers. Vigila en su
  lugar la **Tarea en cola más antigua**.

## Solución de problemas {#troubleshooting}

**Las tareas se quedan En cola y nunca empiezan.** No hay ningún worker en marcha, o ninguno de los
workers en marcha tiene un handler para este tipo. Revisa la hora de la **Tarea en cola más
antigua**, pide a tus operadores que inicien `axentra worker` (con `--load` para los handlers de tu
producto) y revisa la ortografía del tipo. Revisa también **Ejecutar después de**: una tarea con
retraso o que espera un reintento está en cola a propósito.

**Una tarea tiene el estado Fallida definitivamente.** Todos los intentos fallaron. Lee **Último error** en la
página de detalles, corrige la causa (por ejemplo, un registro que falta o un servicio inaccesible) y
elige **Reintentar**.

**Una tarea tiene el estado Fallida tras un solo intento.** El handler informó de un error permanente, así que
Axentra no la reintentó. Lee **Último error**. Reintenta solo después de corregir la causa.

**«Revisa los datos introducidos» al poner en cola.** El servidor ha rechazado un valor; el mensaje
bajo el título lo indica, por ejemplo `kind must be 1-100 characters…`,
`payload is larger than 64000 bytes`, `priority must be between -100 and 100` o
`job kinds starting with 'axentra.' are reserved`. Corrige el campo y vuelve a enviarlo.

**«No permitido» al poner en cola.** Necesitas `jobs:manage`. Un mensaje como
`job kind … is not open to tenant callers` significa que el tipo solo lo pueden poner en cola los
operadores.

**«Ya se usó para otra solicitud».** La clave de idempotencia pertenece a otra solicitud de tarea.
Elige **Usar una clave nueva** para crear una tarea nueva, o repite la solicitud original sin
cambios.

**«Conflicto» al reintentar o cancelar.** El estado de la tarea cambió entretanto (por ejemplo,
terminó mientras confirmabas). Recarga la página; **Reintentar** solo funciona con tareas
con estado **Fallida** o **Fallida definitivamente**, y **Cancelar tarea**, solo con tareas **En cola**
o **En ejecución**.

**Se ha solicitado la cancelación, pero la tarea sigue ejecutándose.** El handler solo se detiene
cuando comprueba si hay una cancelación. Los handlers que nunca lo comprueban se ejecutan hasta el
final y cuentan entonces como **Completada**. Si el worker se queda colgado, la tarea vuelve a la
cola cuando vence su reserva.

**Una tarea se ejecutó dos veces.** Es lo esperado con la ejecución «al menos una vez». Haz que el
handler sea idempotente, por ejemplo comprobando si el trabajo ya se hizo.

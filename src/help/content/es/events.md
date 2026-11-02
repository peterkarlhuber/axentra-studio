---
title: Eventos
summary: Explora el historial de eventos, observa los eventos en directo a medida que ocurren, entiende el indicador de conexión y publica un evento de prueba.
keywords: evento, historial de eventos, registro de eventos, evento de dominio, en directo, tiempo real, flujo, stream, SSE, server-sent events, publicar, tipo de evento, suscriptor, outbox, bandeja de salida, Last-Event-ID
---

Un **evento** es un mensaje breve que indica que «algo ha ocurrido» en tu producto, por ejemplo
`invoice.created` o `user.invited`. Cada evento tiene un **tipo**, el momento en que **ocurrió**, el
inquilino al que pertenece, quién lo causó (el **actor**) y un objeto JSON con los detalles (los
**datos**). Otras partes del sistema reaccionan a los eventos: los suscriptores dentro del proceso en
el código de tu producto y los [endpoints de webhook](help:webhooks) de otros sistemas. La pantalla
**Eventos** te permite consultar lo que ha ocurrido (**Historial de eventos**) y ver llegar los
eventos nuevos (**En directo**).

Los eventos no son lo mismo que el [registro de auditoría](help:audit): el registro de auditoría
documenta quién cambió qué en Axentra a efectos de cumplimiento normativo, mientras que los eventos
son mensajes que publica tu producto para que otros sistemas reaccionen a ellos.

> [!IMPORTANT]
> Los eventos requieren el módulo del servidor `events`. Ver el historial y la vista en directo
> requiere `jobs:read` (el permiso abarca tareas y eventos). **Publicar evento** requiere
> `events:publish` en al menos un inquilino (lo tienen los propietarios, administradores y miembros
> de los inquilinos); sin él, el botón está oculto.

## Tipos de evento {#event-types}

Un tipo de evento es un nombre en minúsculas, normalmente _objeto.acción_: `invoice.created`,
`order.shipped`, `crm.contact:merged`. Empieza por una letra minúscula y puede contener letras
minúsculas, dígitos y `_ . : -`, hasta 150 caracteres. Los tipos que empiezan por `axentra.` están
reservados para el propio Axentra (por ejemplo `axentra.ping`, la prueba de webhooks).

Axentra no mantiene una lista de tipos «permitidos»: tu producto los define al publicarlos. Varias
pantallas aceptan **patrones** en los que `*` representa cualquier texto: `invoice.*` coincide con
`invoice.created` e `invoice.paid`, y `*` solo coincide con cualquier tipo.

## Explorar el historial de eventos {#event-log}

Abre [Eventos](app:events). La pestaña **Historial de eventos** enumera los eventos del más reciente
al más antiguo, con **Tipo**, **Inquilino** (o **Nivel de producto**), **Actor** y **Ocurrido**. El
actor muestra la clase de llamante (`user`, `api_key` o `system`) y su id. Desplázate hacia abajo y
carga más para retroceder en el tiempo.

### Filtrar por tipo e inquilino {#filter}

- **Tipo**: un tipo exacto (`invoice.created`) o un prefijo terminado en `*` (`invoice.*`,
  `crm.*`). El filtro del historial solo admite un `*` al final.
- **Inquilino**: solo los eventos de un inquilino.

Elige **Aplicar filtros**; **Restablecer filtros** los borra. Los filtros se conservan en la
dirección de la página.

### Detalles del evento {#event-detail}

Selecciona el icono de detalles al final de una fila. El panel muestra **ID del evento**, **Tipo**,
**Ocurrido**, **Inquilino**, **Actor**, **ID de solicitud** (para encontrar la solicitud a la API en
los logs del servidor), **Clave de idempotencia** (si quien publicó indicó una) y los **Datos** en
JSON.

## Ver los eventos en directo {#live}

Abre la pestaña **En directo**. Studio abre una conexión con el flujo de eventos del servidor y
muestra los eventos **publicados a partir de ahora**, con el más reciente arriba. Los eventos
anteriores están en el **Historial de eventos**.

1. Opcional: introduce **Tipos**, uno o varios patrones separados por comas (por ejemplo
   `invoice.*, user.created`), y elige **Aplicar**. Deja el campo vacío para ver todos los tipos.
   Al aplicar un filtro se vacía la lista y se vuelve a conectar.
2. Observa cómo llegan los eventos. Selecciona **Mostrar datos** en una entrada para ver el evento
   completo y su posición en el flujo.

La vista en directo conserva los 200 eventos más recientes; los más antiguos desaparecen de la lista,
pero siguen en el historial.

### Estado de la conexión {#connection-status}

El indicador situado encima de la lista (y junto a **Actualizaciones en directo** en la pantalla
[Tareas](help:jobs#live-updates)) te dice si realmente estás recibiendo actualizaciones:

| Indicador                | Significado                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Conectando…**          | Studio está abriendo la conexión.                                                                                                   |
| **En directo**           | La conexión está abierta; los eventos nuevos aparecen en un segundo aproximadamente.                                                |
| **En directo, en pausa** | Conectado, pero la vista está en pausa (consulta más abajo).                                                                        |
| **Reconectando**         | La conexión se cortó o el servidor la cerró. Studio vuelve a intentarlo automáticamente e indica cuándo (_próximo intento en … s_). |
| **Desconectado**         | Studio ha dejado de intentarlo, por ejemplo porque cambió tu sesión o tu permiso. El motivo aparece al lado; elige **Reconectar**.  |
| **No conectado**         | Elegiste **Desconectar**.                                                                                                           |

El servidor cierra cada flujo al cabo de una hora y comprueba tu sesión y tu permiso cada 15
segundos (configuración predeterminada). Tras un cierre normal o un problema de red, Studio se vuelve
a conectar y **continúa donde se detuvo**, así que no se pierde ningún evento entretanto. Si se
revocó tu acceso, el flujo se cierra con _Se perdió el acceso al flujo (cambió la sesión o los
permisos)._

### Pausar, reanudar y borrar {#pause}

- **Pausar** congela la lista para que puedas leerla. La conexión sigue abierta y los eventos nuevos
  se van acumulando. **Reanudar** los muestra (el botón los cuenta, por ejemplo **Reanudar (3 eventos
  nuevos)**).
- **Desconectar** cierra la conexión. **Conectar** la vuelve a abrir y continúa tras el último
  evento que recibiste, de modo que también aparecen los eventos publicados entretanto.
- **Borrar** vacía la lista de tu pantalla. No elimina ningún evento.

## Publicar un evento de prueba {#publish}

Publicar un evento a mano es útil para probar un endpoint de webhook o un suscriptor.

1. Elige **Publicar evento**.
2. Elige el **Inquilino**. Los eventos publicados aquí siempre pertenecen a un inquilino.
3. Introduce el **Tipo**, por ejemplo `invoice.created`.
4. Introduce los **Datos** como objeto JSON, por ejemplo `{"invoice_id": "inv_123"}`.
5. Elige **Publicar**.

El evento aparece en el historial y se entrega a todos los endpoints de webhook activados cuyos tipos
de evento coincidan, así como a los suscriptores de tu producto. Es un evento real: los receptores no
pueden distinguirlo de uno publicado por tu producto, así que usa datos de prueba y un inquilino
destinado a pruebas.

| Ajuste        | Qué hace                                                                   | Valores permitidos / valor predeterminado                         |
| ------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Inquilino** | El inquilino al que pertenece el evento. Necesitas `events:publish` en él. | Obligatorio.                                                      |
| **Tipo**      | El tipo de evento por el que filtran los receptores.                       | Consulta [Tipos de evento](help:events#event-types). Obligatorio. |
| **Datos**     | Detalles del evento.                                                       | Objeto JSON, como máximo 64 KB. Predeterminado: `{}`.             |

Studio envía una clave de idempotencia con cada diálogo de publicación, de modo que un doble clic
solo publica una vez.

## Para desarrolladores {#developers}

- **Outbox transaccional.** El código del producto publica con `ax.events.publish_in_tx(...)` dentro
  de su propia transacción de base de datos. El evento existe si y solo si la transacción se
  confirma, así que no se envía ningún evento por un cambio que se ha revertido.
- **La entrega a suscriptores y webhooks** se realiza mediante [tareas](help:jobs#system-kinds)
  (`axentra.event.dispatch`, `axentra.event.handle`, `axentra.webhook.deliver`), cada una al menos
  una vez. No hay garantía de orden entre eventos.
- **API.** `GET /v1/products/{product_id}/events?type=&tenant_id=` enumera eventos,
  `GET /events/{event_id}` devuelve uno y `POST /tenants/{tenant_id}/events` publica (con una
  cabecera `Idempotency-Key` opcional).
- **Flujos (SSE).** `GET /events/stream?types=invoice.*,user.created` y `GET /jobs/stream` envían
  mensajes con `id:` (la posición en el flujo), `event:` (el tipo de evento, o `job.<status>` en el
  flujo de tareas) y `data:` en JSON. Devuelve el último `id` como `Last-Event-ID` para continuar;
  `Last-Event-ID: 0` reproduce todo lo que aún se conserva. Con `?tenant_id=` el permiso se
  comprueba en ese inquilino, así que las claves de API vinculadas a un inquilino pueden seguir el
  flujo de su inquilino. El flujo de tareas muestra el último estado de cada tarea modificada, por lo
  que pueden omitirse estados intermedios.
- **Retención.** Los eventos se eliminan tras el período de retención de tareas (30 días de forma
  predeterminada) una vez que no queda ninguna entrega pendiente.

## Conviene saber {#good-to-know}

- La vista en directo solo muestra los eventos que llegan mientras está abierta. Para ver lo que
  ocurrió antes, usa el **Historial de eventos**.
- Las sugerencias de tipos del formulario de webhooks proceden de los últimos eventos de este
  historial, porque no existe un catálogo central de tipos.

## Solución de problemas {#troubleshooting}

**El historial está vacío.** Tu producto todavía no ha publicado eventos o los filtros los excluyen.
Elige **Restablecer filtros**. Publica un evento de prueba para comprobar la configuración.

**«Introduce un tipo exacto o un prefijo terminado en \*».** El filtro del historial acepta
`invoice.created` o `invoice.*`, no un `*` en medio. En la vista en directo y en los webhooks se
admiten patrones como `*.created`.

**El indicador se queda en Reconectando.** Studio no puede acceder al flujo del servidor. Revisa tu
red y el estado del servidor. Los proxies que almacenan las respuestas en búfer también pueden
romper los flujos; avisa a tus operadores.

**Desconectado con «Se perdió el acceso al flujo».** Tu sesión terminó o tu rol cambió. Vuelve a
iniciar sesión si hace falta y elige **Reconectar**.

**«No permitido» al abrir Eventos.** Necesitas `jobs:read` en este producto. Pide a un propietario o
administrador del producto un rol que lo incluya; consulta
[Roles y permisos](help:roles-permissions).

**«Los tipos que empiezan por “axentra.” están reservados para Axentra».** Elige un tipo con tu
propio prefijo, por ejemplo `invoice.created`.

**«Ya se usó para otra solicitud» al publicar.** Un intento anterior desde el mismo diálogo usó otros
valores. Studio ya ha creado una clave nueva: vuelve a elegir **Publicar**.

**Un evento publicado no llegó a un webhook.** Comprueba que el endpoint está activado, que uno de
sus tipos de evento coincide y que su filtro de inquilino (si lo tiene) es el inquilino del evento.
Después revisa las [entregas](help:webhooks#deliveries) del endpoint. Si no hay ninguna entrega, puede
que no haya ningún worker en marcha para distribuir el evento.

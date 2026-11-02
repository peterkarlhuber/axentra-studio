---
title: Webhooks
summary: Envía eventos a otros sistemas como solicitudes HTTP firmadas, gestiona el secreto de firma y revisa, reintenta y vuelve a entregar las entregas.
keywords: webhook, endpoint, callback, retrollamada, HTTP POST, secreto de firma, firma, HMAC, whsec, rotar secreto, entrega, volver a entregar, reintento, ping de prueba, receptor, integración
---

Un **webhook** permite que otro sistema se entere de los [eventos](help:events) de tu producto sin
tener que preguntar por ellos. Registras un **endpoint**, que es una URL del otro sistema, y eliges
qué tipos de evento quiere recibir. Cada vez que se publica un evento que coincide, Axentra envía a
esa URL una solicitud HTTP `POST` con el evento en JSON. Cada solicitud va **firmada** con un secreto
que solo conocen Axentra y el receptor, para que el receptor pueda comprobar que la solicitud es
auténtica. Cada intento se registra como una **entrega** que puedes examinar y volver a enviar.

> [!IMPORTANT]
> Los webhooks requieren el módulo del servidor `events`. Ver endpoints y entregas requiere
> `webhooks:read` (propietarios, administradores, soporte y observadores del producto). Crear,
> editar, probar, rotar el secreto, volver a entregar y eliminar requieren `webhooks:manage`
> (propietarios y administradores del producto); sin ese permiso, estos botones están ocultos y
> **Configuración** es de solo lectura. Debe haber un proceso worker en marcha para que se envíen
> las entregas.

## Cómo funciona la entrega {#how-it-works}

```diagram
webhook-delivery
```

1. Tu producto publica un evento, por ejemplo `invoice.created` en el inquilino `acme`.
2. Un worker busca los endpoints **activados** cuyos **Tipos de evento** coinciden con el tipo y
   cuyo **Filtro de inquilino** está vacío o es el inquilino del evento. Por cada coincidencia crea
   una entrega con el estado **Pendiente**.
3. El worker envía la solicitud firmada. Una respuesta `2xx` deja la entrega como **Entregada**.
4. Cualquier otra respuesta, un tiempo de espera agotado o un error de conexión la deja como
   **Fallida, reintentando**: se vuelve a enviar tras una espera cada vez mayor. Después del último
   intento queda como **Fallida definitivamente**.
5. Puedes usar **Volver a entregar** con una entrega que no esté pendiente, por ejemplo después de
   corregir el receptor.

Las entregas se producen **al menos una vez**: un receptor puede recibir el mismo evento dos veces
(por ejemplo, cuando se perdió su respuesta `200`). Los receptores deberían recordar el ID del evento
e ignorar los duplicados. No hay un orden garantizado entre eventos.

## Crear un endpoint {#create}

1. Abre [Webhooks](app:webhooks) y elige **Nuevo endpoint**.
2. Introduce la **URL** que debe recibir las solicitudes.
3. Opcional: una **Descripción** (hasta 1000 caracteres), por ejemplo quién es responsable del
   receptor.
4. Añade los **Tipos de evento**: escribe un tipo o un patrón y pulsa Intro o elige **Añadir tipo**.
   Studio sugiere los tipos que ha visto en eventos recientes, y **\* (todos los tipos)**.
5. Opcional: elige un **Filtro de inquilino** y desactiva **Activado** si el receptor todavía no está
   listo.
6. Elige **Crear endpoint**.
7. Copia el **Secreto de firma** que aparece, guárdalo para el receptor, marca **He guardado el
   secreto de forma segura** y elige **Listo**. Consulta
   [Guardar el secreto de firma](help:webhooks#signing-secret).

A continuación, Studio abre la página del endpoint.

### Reglas de la URL {#url-rules}

Para evitar que se usen webhooks para llegar a sistemas internos, el servidor comprueba cada URL al
guardarla y de nuevo antes de cada entrega:

- Debe empezar por `https://`. `http://` sin cifrar solo lo aceptan los servidores fuera de
  producción cuyos operadores han habilitado `events.webhook_allow_http`.
- No puede contener un nombre de usuario ni una contraseña (`https://user:pass@…`) ni un fragmento
  (`#…`).
- Se rechazan `localhost` y los nombres de host que terminan en `.local`, `.localhost` o
  `.internal`.
- El nombre de host se resuelve, y **todas** las direcciones a las que apunta deben ser públicas. Se
  rechazan las redes privadas (como `10.x` o `192.168.x`), loopback, link-local y otras direcciones
  especiales, salvo que los operadores establezcan `events.webhook_allow_private_targets` (pensado
  para desarrollo y, en producción, solo con una anulación adicional).
- Como máximo 2000 caracteres.

Las redirecciones no se siguen: una respuesta `301` o `302` cuenta como fallo. Usa la URL final.

### Elegir los tipos de evento {#event-types}

Cada endpoint tiene de 1 a 50 patrones de tipo de evento. Usa tipos exactos (`invoice.created`),
patrones con `*` (`invoice.*`, `*.deleted`) o `*` para todos los tipos. Los patrones usan letras
minúsculas, dígitos, `_ . : -` y `*`. Los eventos con tipos reservados (`axentra.…`) nunca se envían
a los endpoints, salvo el ping de prueba.

### Filtro de inquilino {#tenant-filter}

Sin filtro de inquilino, el endpoint recibe los eventos coincidentes de **todos los inquilinos** y
los eventos de nivel de producto. Con un filtro, solo recibe los eventos de ese inquilino. El filtro
de inquilino no se puede cambiar más adelante; en su lugar, crea un endpoint nuevo.

## Guardar el secreto de firma {#signing-secret}

Al crear un endpoint (y al rotar su secreto), Axentra genera un secreto de firma que empieza por
`whsec_`. Se muestra **una sola vez**. Axentra lo guarda cifrado y no vuelve a mostrarlo nunca.

> [!CAUTION]
> Guarda el secreto de inmediato en el almacén de secretos de tu receptor. Cualquiera que lo conozca
> puede enviar solicitudes que tu receptor aceptará como auténticas. Si lo pierdes o se filtra,
> [rota el secreto](help:webhooks#rotate-secret).

El receptor usa el secreto para comprobar la cabecera `Axentra-Signature` de cada solicitud. El
[tutorial del receptor de webhooks](help:tutorial-webhook-receiver#verify-signature) muestra el
algoritmo exacto con código en Python y TypeScript.

## Enviar un ping de prueba {#test}

En la página del endpoint, elige **Enviar ping de prueba**. Axentra envía de inmediato una solicitud
firmada con el tipo `axentra.ping` y espera la respuesta. Studio indica **Ping de prueba entregado
(HTTP 200)** o **Error en el ping de prueba** con el código de estado o el error, y abre la entrega
registrada.

Un ping de prueba se envía una sola vez, sin reintentos, y también a un endpoint desactivado, para
que puedas probar un receptor antes de activarlo. Su cuerpo contiene `"type": "axentra.ping"`,
`"data": {"endpoint_id": "…"}` y el ID de la entrega como `id`.

## Revisar las entregas {#deliveries}

La pestaña **Entregas** de un endpoint enumera sus entregas de la más reciente a la más antigua:
**Evento** (tipo e ID de la entrega), **Estado**, **Respuesta** (el código de estado HTTP),
**Intentos**, **Duración** y **Creada**. Filtra por **Estado**; **Actualizar** carga el estado más
reciente.

### Estados de entrega {#delivery-statuses}

| Estado                      | Significado                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| **Pendiente**               | Esperando para enviarse, enviándose, o puesta de nuevo en cola con **Volver a entregar**.         |
| **Entregada**               | El receptor respondió con un estado `2xx`.                                                        |
| **Fallida, reintentando**   | El último intento falló; hay otro intento previsto (**Próximo intento**).                         |
| **Fallida definitivamente** | No hay más intentos automáticos: se agotaron todos, se rechazó la URL o se desactivó el endpoint. |

### Detalles de la entrega {#delivery-detail}

Selecciona el icono de detalles al final de una fila. El panel muestra **ID de la entrega**,
**Estado**, **Respuesta**, **Intentos**, **Duración**, el **ID del evento**, la **Tarea** que la
envía (un enlace a la [tarea](help:jobs#job-detail)), **Creada**, **Entregada** y **Próximo
intento**, además de:

- **Último error**: por ejemplo `HTTP 500`, un tiempo de espera agotado, `unresolvable: …` o
  `refused: …`;
- **Cuerpo de la respuesta (truncado por el servidor)**: los primeros 4096 bytes (valor
  predeterminado) de lo que respondió el receptor. Si tu receptor devuelve un breve texto de error,
  te resultará más fácil diagnosticar los problemas aquí.

## Reintentos {#retries}

Las entregas fallidas se reintentan automáticamente a través de la cola de tareas, hasta **8
intentos** con la configuración predeterminada (`events.webhook_max_attempts`). La espera antes del
intento _n + 1_ está entre la mitad y el total de `2 × 2^(n−1)` segundos (2, 4, 8… 128 segundos), así
que con la configuración predeterminada todos los intentos se consumen en unos dos a cinco minutos.
Cada intento espera como máximo 10 segundos para la conexión y para cada lectura de la respuesta.

Un receptor que esté caído durante más tiempo no pierde eventos, pero sus entregas terminan como
**Fallida definitivamente**: vuelve a entregarlas cuando esté de nuevo disponible. Axentra no
desactiva los endpoints que fallan continuamente y no tiene límite de frecuencia por endpoint.

Dos casos terminan una entrega sin más intentos: una URL que el servidor rechaza (consulta las
[reglas de la URL](help:webhooks#url-rules)) y un endpoint que se desactivó mientras la entrega
esperaba. Un nombre de host que no se puede resolver sí se reintenta.

## Volver a entregar {#redeliver}

1. Abre los detalles de la entrega.
2. Elige **Volver a entregar**.

La entrega pasa a **Pendiente** y se envía de nuevo con un conjunto nuevo de intentos. El contador
**Intentos** sigue sumando. **Volver a entregar** no se ofrece mientras la entrega está
**Pendiente**. El receptor recibe de nuevo el mismo ID de evento, así que un receptor que elimina
duplicados ignora los eventos que ya procesó.

## Rotar el secreto de firma {#rotate-secret}

Rota el secreto cuando pueda haberse filtrado, cuando se marche alguien que lo conocía o, como buena
práctica, de forma periódica.

1. En la página del endpoint, elige **Rotar secreto**.
2. Elige un **Período de gracia**: **Ninguno (el secreto anterior deja de funcionar de inmediato)**,
   **1 hora**, **24 horas** o **7 días**.
3. Elige **Rotar secreto** y, después, copia y guarda el secreto nuevo igual que al crear el
   endpoint.

Durante el período de gracia, cada solicitud lleva **dos** firmas: una hecha con el secreto nuevo y
otra con el secreto anterior. Un receptor que todavía tiene el secreto anterior sigue funcionando
mientras lo actualizas. La página del endpoint muestra **El secreto anterior sigue siendo válido**
hasta que termina el período.

> [!TIP]
> Para rotar sin entregas fallidas: elige un período de gracia, pon el secreto nuevo en el receptor
> y comprueba que las entregas siguen funcionando antes de que termine el período. Con **Ninguno**,
> el receptor rechaza todas las solicitudes hasta que tiene el secreto nuevo.

## Editar o desactivar un endpoint {#edit}

Abre la pestaña **Configuración** del endpoint, cambia **URL**, **Descripción**, **Tipos de evento**
o **Activado** y elige **Guardar cambios**. **Descartar cambios** restablece los valores guardados.

Desactivar **Activado** detiene las entregas nuevas. Las entregas que aún esperaban un intento
terminan como **Fallida definitivamente** con el error `endpoint disabled`; vuelve a entregarlas
después de activar de nuevo el endpoint. Los eventos publicados mientras el endpoint estaba
desactivado no se entregan más tarde.

## Eliminar un endpoint {#delete}

Elige **Eliminar endpoint** y confirma. El endpoint ya no recibe nada, y su historial de entregas se
elimina con él. No se puede deshacer. Para pausar un endpoint, desactívalo.

## Formato de la solicitud {#request-format}

```http
POST /hooks/axentra HTTP/1.1
Host: example.com
Content-Type: application/json
User-Agent: Axentra-Webhooks/1
Axentra-Event: invoice.created
Axentra-Event-Id: evt_01EXAMPLE
Axentra-Delivery: dlv_01EXAMPLE
Axentra-Signature: t=1767225600,v1=9c1e…(64 hex characters)

{"data":{"invoice_id":"inv_123"},"id":"evt_01EXAMPLE","occurred_at":"2026-01-01T00:00:00+00:00","product_id":"prd_01EXAMPLE","tenant_id":"ten_01EXAMPLE","type":"invoice.created"}
```

| Campo                     | Contenido                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `id`                      | ID del evento, idéntico a la cabecera `Axentra-Event-Id`. Úsalo para eliminar duplicados. |
| `type`                    | Tipo de evento.                                                                           |
| `product_id`, `tenant_id` | Dónde ocurrió el evento; `tenant_id` es `null` en los eventos de nivel de producto.       |
| `occurred_at`             | Cuándo ocurrió el evento (ISO 8601, UTC).                                                 |
| `data`                    | El objeto de datos del evento.                                                            |

`Axentra-Delivery` identifica la entrega y es el mismo en todos sus intentos y reenvíos. Verifica la
firma sobre los bytes **sin procesar** del cuerpo; no analices y vuelvas a serializar el JSON antes.

## Configuración {#settings}

| Ajuste                           | Qué hace                                                      | Valores permitidos / valor predeterminado                               |
| -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **URL**                          | Adónde se envían las solicitudes.                             | URL `https://`, host público, como máximo 2000 caracteres. Obligatorio. |
| **Descripción**                  | Nota para las personas.                                       | Hasta 1000 caracteres.                                                  |
| **Tipos de evento**              | Qué eventos se envían.                                        | De 1 a 50 tipos o patrones con `*`. Obligatorio.                        |
| **Filtro de inquilino**          | Limita el endpoint a un inquilino.                            | Un inquilino o **Todos los inquilinos**. Solo al crear.                 |
| **Activado**                     | Si se envían entregas nuevas.                                 | Predeterminado: activado.                                               |
| **Período de gracia** (rotación) | Cuánto tiempo sigue firmando solicitudes el secreto anterior. | Ninguno, 1 hora, 24 horas, 7 días (API: hasta 7 días en segundos).      |

Valores predeterminados del servidor (los operadores pueden cambiarlos en `[events]`): 8 intentos,
tiempo de espera de 10 segundos, 4096 bytes de cuerpo de respuesta guardado.

## Conviene saber {#good-to-know}

- Los endpoints, las entregas, las pruebas y las rotaciones también están disponibles a través de la
  API en `/v1/products/{product_id}/webhooks`; consulta los
  [fundamentos de la API](help:api-basics).
- Las creaciones, los cambios, las eliminaciones, las pruebas, las rotaciones y los reenvíos se
  registran en el [registro de auditoría](help:audit).
- Las entregas entregadas y las fallidas definitivamente se eliminan tras el período de retención
  (30 días de forma predeterminada).

## Solución de problemas {#troubleshooting}

**«webhook urls must use https».** Usa una URL `https://`. `http://` solo funciona en servidores de
desarrollo que lo permiten.

**«webhook urls must not point to local hosts» o «… private, loopback or link-local addresses».**
La URL apunta a tu propia máquina o a una red interna. Usa una dirección HTTPS pública, por ejemplo
mediante un servicio de túnel durante el desarrollo (consulta el
[tutorial](help:tutorial-webhook-receiver#public-url)).

**«event_types needs 1-50 type patterns».** Añade al menos un tipo de evento, o `*` para todos.

**El ping de prueba falla con HTTP 401 o 403.** El receptor rechazó la firma. Comprueba que usa el
secreto actual (el valor completo, incluido `whsec_`), el cuerpo de la solicitud sin procesar y un
reloj correcto (se rechazan las marcas de tiempo con más de unos 5 minutos de antigüedad).

**El ping de prueba falla con HTTP 404 o 405.** La ruta es incorrecta o el receptor no acepta
`POST`.

**El ping de prueba falla sin código de estado.** No se pudo acceder al receptor: lee **Último
error**. `unresolvable` significa que el nombre de host no existe en el DNS; un tiempo de espera
agotado significa que el receptor no respondió en 10 segundos. Responde rápido y haz el trabajo lento
después de responder.

**Las entregas tienen el estado Fallida definitivamente con «refused: …».** El host se resuelve ahora a una
dirección privada. Corrige la entrada DNS o la URL y vuelve a entregar.

**Las entregas tienen el estado Fallida definitivamente con «endpoint disabled».** El endpoint se desactivó
mientras esperaban. Actívalo y vuelve a entregarlas.

**No aparece ninguna entrega para un evento.** Comprueba que el endpoint está activado, que un patrón
de tipo de evento coincide y el filtro de inquilino. Los eventos publicados antes de que existiera el
endpoint no se entregan. Si el evento está en el [historial de eventos](help:events#event-log) pero
no ocurre nada, puede que no haya ningún worker en marcha.

**«Conflicto» al volver a entregar.** La entrega ya está en cola o enviándose. Espera y elige
**Actualizar**.

**«Modificado mientras tanto» al guardar o eliminar.** Otra persona cambió el endpoint. Recarga la
página y repite el cambio.

**El receptor procesó un evento dos veces.** Es lo esperado con la entrega «al menos una vez».
Elimina los duplicados por `Axentra-Event-Id`.

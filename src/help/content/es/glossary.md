---
title: Glosario
summary: Explicaciones breves de los términos que se usan en Axentra y Studio, ordenadas alfabéticamente por el término inglés, con enlaces a los detalles.
keywords: glosario, términos, definiciones, vocabulario, significado, qué es, diccionario, terminología
---

Definiciones breves de los términos que se usan en Studio y en esta ayuda. Las entradas siguen el
orden alfabético del término inglés, que aparece entre paréntesis. Cada entrada enlaza con el
artículo que tiene los detalles.

## Clave de API (API key) {#api-key}

Credenciales para máquinas (formato `axk_…`) que llaman a la API de Axentra para un producto, con
una lista explícita de permisos y, opcionalmente, vinculadas a un inquilino. Consulta
[Claves de API](help:api-keys).

## Archivar (archive) {#archive}

Retirar un producto del uso sin eliminarlo. Solo los administradores de la plataforma pueden seguir
trabajando en un producto archivado; se puede restaurar. Consulta [Productos](help:products).

## Registro de auditoría (audit log) {#audit-log}

El registro de solo anexado de quién cambió qué y cuándo en el servidor, con resultado, ID de
solicitud y dirección IP. Consulta [Registro de auditoría](help:audit).

## Rol integrado (built-in role) {#built-in-role}

Un rol que Axentra proporciona en todos los productos, como **Product admin**,
**Owner** o **Viewer**. No se puede modificar. Consulta la
[referencia de permisos](help:permissions-reference#built-in-roles).

## Checkout {#checkout}

Pagar un plan en la página alojada del proveedor de pagos. Studio nunca maneja datos de tarjeta.
Consulta [Planes y suscripciones](help:plans-subscriptions).

## Colección (collection) {#collection}

Un grupo de registros con nombre dentro de un inquilino, por ejemplo `contacts`. Consulta
[Registros](help:records).

## Expresión cron (cron expression) {#cron-expression}

Cinco campos (minuto, hora, día del mes, mes, día de la semana) que describen cuándo se ejecuta una
programación, siempre en UTC. Consulta [Programaciones](help:schedules).

## CSRF {#csrf}

Falsificación de solicitudes entre sitios (cross-site request forgery): un ataque en el que otro
sitio web intenta enviar cambios a través de tu navegador con la sesión iniciada. Studio y el
servidor lo bloquean automáticamente. Consulta [Seguridad](help:security#csrf).

## Rol personalizado (custom role) {#custom-role}

Un rol definido para un producto con un conjunto de permisos elegido, para el producto o para un
inquilino. Consulta [Roles y permisos](help:roles-permissions).

## Entrega (delivery) {#delivery}

Una cadena de intentos para enviar un evento a un endpoint de webhook, con estado, respuesta y
reintentos. Consulta [Webhooks](help:webhooks).

## Prestación (entitlement) {#entitlement}

Una función (activada o desactivada) o un límite que un plan concede a los inquilinos suscritos a
él. Consulta [Planes y suscripciones](help:plans-subscriptions).

## Evento (event) {#event}

Un mensaje de tu producto que indica que algo ha ocurrido, por ejemplo `invoice.created`. Los
eventos pueden desencadenar webhooks y handlers. Consulta [Eventos](help:events).

## Período de gracia (grace period) {#grace-period}

El tiempo tras rotar un secreto durante el cual el secreto antiguo sigue funcionando (como máximo 7
días), para que los servicios puedan cambiar sin interrupciones. Consulta
[Claves de API](help:api-keys) y [Webhooks](help:webhooks).

## Clave de idempotencia (idempotency key) {#idempotency-key}

Un valor único que se envía con una solicitud para que repetir la misma solicitud no la ejecute dos
veces. Se rechaza reutilizar una clave con valores distintos. Consulta
[solución de problemas](help:troubleshooting#idempotency-conflict).

## Invitación (invitation) {#invitation}

Una oferta para unirse a un inquilino con un rol determinado, enviada a una dirección de correo
electrónico. Su enlace y su token se muestran una sola vez. Consulta
[Miembros e invitaciones](help:members-invitations).

## Tarea (job) {#job}

Un trabajo en segundo plano que ejecuta un worker, con reintentos si falla. Consulta
[Tareas](help:jobs).

## Miembro (member) {#member}

Un usuario que pertenece a un inquilino con un rol de inquilino. También es el nombre del rol de
inquilino integrado **Member**, que trabaja con los datos del inquilino. Consulta
[Miembros e invitaciones](help:members-invitations).

## Medidor (meter) {#meter}

Algo que mide un producto, como llamadas a la API o almacenamiento, y cómo se combina (suma, máximo
o último valor) y se restablece. Consulta [Uso](help:usage).

## Módulo (module) {#module}

Una pieza del servidor de Axentra (por ejemplo `storage` o `billing`) que un operador puede activar
o desactivar. Consulta la [referencia de módulos](help:modules-reference).

## Modo de varios productos (multi-product mode) {#multi-product-mode}

Un modo del servidor en el que una instalación aloja muchos productos, creados por administradores
de la plataforma. Consulta [Conceptos](help:concepts).

## Rango de propietario (owner rank) {#owner-rank}

El rango especial de los roles **Owner** (inquilino) y **Product owner**: solo un
propietario del mismo ámbito, o alguien con autoridad de un nivel superior, puede asignarlo o
quitarlo. Consulta [techo de roles](help:security#role-ceiling).

## Permiso (permission) {#permission}

Un derecho concreto escrito como `resource:action`, por ejemplo `files:write`, con ámbito de
plataforma, producto o inquilino. Consulta la [referencia de permisos](help:permissions-reference).

## Plan {#plan}

Una oferta con precios y prestaciones a la que se suscriben los inquilinos. Consulta
[Planes y suscripciones](help:plans-subscriptions).

## Rol de plataforma (platform role) {#platform-role}

Un rol para toda la instalación: **Administrador de la plataforma** (todo) u **Observador de la
plataforma** (acceso de lectura en todas partes). Solo los administradores de la plataforma pueden
concederlo. Consulta [Usuarios](help:users).

## Producto (product) {#product}

Una aplicación que se ejecuta en el servidor de Axentra, con sus propios inquilinos, roles, claves
y datos. Consulta [Productos](help:products).

## Operador de producto (product operator) {#product-operator}

Un usuario con un rol de producto, como **Product owner** o **Support**, que trabaja en
el producto en su conjunto. Consulta [Productos](help:products).

## Permiso del producto (product permission) {#product-permission}

Un permiso que declara el propio producto, con un nombre como `crm.deals:approve`. Consulta la
[referencia de permisos](help:permissions-reference#product-defined).

## Cuota (quota) {#quota}

Un límite superior del uso o del almacenamiento de un inquilino. Superarlo da
[Cuota superada](help:troubleshooting#quota-exceeded). Consulta [Uso](help:usage).

## Registro (record) {#record}

Un objeto JSON guardado en una colección de un inquilino. Consulta [Registros](help:records).

## ID de solicitud (request ID) {#request-id}

El identificador `req_…` de cada solicitud al servidor, que aparece en los detalles de los errores
y en el registro de auditoría; es la clave para el soporte. Consulta
[solución de problemas](help:troubleshooting#request-id).

## Reserva (reservation) {#reservation}

Uso apartado por adelantado que después se confirma con la cantidad real o se libera. Consulta
[Uso](help:usage).

## Rol (role) {#role}

Un conjunto de permisos con nombre que se asigna a personas (o, como lista de permisos, a claves de
API). Consulta [Roles y permisos](help:roles-permissions).

## Techo de roles (role ceiling) {#role-ceiling}

La regla según la cual nadie puede asignar un rol con permisos que no tiene. Consulta
[Seguridad](help:security#role-ceiling).

## Rotación (rotation) {#rotation}

Sustituir un secreto por uno nuevo, opcionalmente con un período de gracia. Consulta
[Claves de API](help:api-keys).

## Seguridad a nivel de fila (row-level security) {#row-level-security}

Una función de la base de datos que limita cada transacción a las filas de un producto o de un
inquilino, como segunda línea de defensa detrás de las comprobaciones de permisos. Consulta
[Seguridad](help:security#tenant-isolation).

## Programación (schedule) {#schedule}

Una regla que pone una tarea en cola a intervalos fijos o en momentos cron. Consulta
[Programaciones](help:schedules).

## Sesión (session) {#session}

El estado de sesión iniciada de un navegador. Termina tras una duración máxima, tras un tiempo de
inactividad, al cerrar la sesión o cuando se revoca. Consulta [Seguridad](help:security#sessions).

## Token de configuración inicial (setup token) {#setup-token}

Un token de un solo uso, impreso en el servidor, que crea el primer administrador de la plataforma.
Consulta [Configuración inicial](help:first-run-setup).

## Secreto de firma (signing secret) {#signing-secret}

El secreto (`whsec_…`) con el que Axentra firma las solicitudes de webhook (HMAC-SHA256) para que
los receptores puedan verificarlas. Consulta [Webhooks](help:webhooks) y
[Seguridad](help:security#webhook-signing).

## Modo de un solo producto (single-product mode) {#single-product-mode}

Un modo del servidor con exactamente un producto, creado a partir de la configuración del servidor;
no se pueden crear ni archivar productos. Consulta [Conceptos](help:concepts).

## Slug {#slug}

Un identificador corto y apto para URL de un producto o inquilino, por ejemplo `acme`. Es único y
no puede contener espacios. Consulta [Inquilinos](help:tenants).

## Suscripción (subscription) {#subscription}

La contratación de un plan por parte de un inquilino, con estado (por ejemplo en prueba, activa,
pago vencido) y período. Consulta [Planes y suscripciones](help:plans-subscriptions).

## Suspender (suspend) {#suspend}

Bloquear el acceso a un inquilino sin eliminar sus datos. Se puede reactivar. Consulta
[Inquilinos](help:tenants).

## Plantilla (template) {#template}

Un correo de notificación con variantes de idioma y variables. Consulta
[Notificaciones](help:notifications).

## Inquilino (tenant) {#tenant}

Un cliente u organización dentro de un producto. Los datos de cada inquilino están estrictamente
separados. Consulta [Inquilinos](help:tenants).

## UTC {#utc}

Tiempo universal coordinado, la base horaria de todas las programaciones. Studio muestra las horas
en tu propia zona horaria siempre que puede.

## Webhook {#webhook}

Una solicitud HTTP firmada que Axentra envía a otro sistema cuando ocurre un evento. Consulta
[Webhooks](help:webhooks).

## Worker {#worker}

Un proceso del servidor que ejecuta tareas, programaciones y entregas de webhooks. Sin un worker en
marcha, las tareas se quedan en cola. Consulta [Tareas](help:jobs).

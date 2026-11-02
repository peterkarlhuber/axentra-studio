---
title: Solución de problemas
summary: Qué significan los mensajes de error de Studio, por qué aparecen y qué hacer, desde los problemas de arranque hasta las acciones rechazadas.
keywords: error, problema, fallo, no funciona, ID de solicitud, no permitido, prohibido, no encontrado, conflicto, 401, 403, 404, 409, 412, 413, 415, 422, 429, 500, no se puede conectar, versión incompatible, sesión caducada, módulo no habilitado
---

Cuando el servidor de Axentra rechaza una solicitud o no puede completarla, Studio muestra un
mensaje traducido que indica qué ha pasado y qué puedes hacer. Esta página explica cada mensaje, las
pantallas de arranque que puedes ver antes de que se abra Studio y algunas situaciones habituales.
Cada sección tiene su propio destino de enlace, para que las pantallas puedan llevarte directamente
a la explicación adecuada.

## Cómo se compone un mensaje de error {#error-message}

Todos los errores de Studio tienen las mismas partes:

- **Título**: un nombre breve para el problema, por ejemplo **No permitido** o **Conflicto**. Se
  elige a partir del _código de error_ estable del servidor, así que es el mismo en todos los
  idiomas.
- **Mensaje**: qué ha pasado, la causa probable y qué hacer a continuación.
- **Errores de campo**: cuando el servidor rechaza valores concretos, Studio los muestra debajo de
  los campos del formulario afectados, o como una lista de nombres de campo y motivos.
- **Detalles técnicos** (desplegable): el **Estado HTTP**, el **Código de error**, el **Mensaje del
  servidor** (la explicación propia del servidor, siempre en inglés) y el **ID de solicitud**.

Las acciones fallidas (guardar, eliminar, enviar) aparecen como una notificación en una esquina de
la pantalla con la misma información. En **No permitido** y **Conflicto**, la notificación añade el
mensaje del servidor, porque suele indicar exactamente qué falta, por ejemplo
`missing permission tenants:update` o `a tenant with this slug exists in the product`.

### El ID de solicitud {#request-id}

Cada respuesta del servidor lleva un ID de solicitud como `req_01EXAMPLE…`. El servidor escribe el
mismo ID en sus registros y en el [registro de auditoría](help:audit). Cuando comuniques un problema
a tu operador o al soporte, incluye siempre el ID de solicitud: les permite encontrar la solicitud
exacta en segundos.

> [!TIP]
> Abre **Detalles técnicos** y copia el ID de solicitud antes de cerrar el mensaje o reintentar.

## Códigos de error {#error-codes}

La tabla ofrece un resumen. Las secciones siguientes explican cada código con causas y soluciones.

| Título en Studio                      | Código de error                   | Estado HTTP    | En resumen                                                 |
| ------------------------------------- | --------------------------------- | -------------- | ---------------------------------------------------------- |
| **Revisa los datos introducidos**     | `validation_failed`               | 422 (o 400)    | Se rechazaron valores                                      |
| **Solicitud no comprendida**          | `bad_request`                     | 400            | No se pudo leer la solicitud                               |
| **Inicia sesión**                     | `unauthenticated`                 | 401            | No hay sesión válida                                       |
| **No permitido**                      | `forbidden`                       | 403            | Falta un permiso, o el producto o inquilino no está activo |
| **Vuelve a iniciar sesión**           | `reauthentication_required`       | 403            | Requiere un inicio de sesión reciente                      |
| **No encontrado**                     | `not_found`                       | 404            | No existe, o no es visible para ti                         |
| **Módulo no activado**                | `module_disabled`                 | 404            | Módulo del servidor desactivado                            |
| **Conflicto**                         | `conflict`                        | 409            | Choca con datos o estados existentes                       |
| **No disponible en este modo**        | `mode_not_supported`              | 409            | No es posible en este modo del servidor                    |
| **Proveedor de pagos no configurado** | `payment_provider_not_configured` | 409            | La facturación necesita un proveedor                       |
| **Modificado mientras tanto**         | `precondition_failed`             | 412            | Otra persona guardó antes                                  |
| **Demasiado grande**                  | `payload_too_large`               | 413            | Solicitud o archivo demasiado grande                       |
| **Tipo no aceptado**                  | `unsupported_media_type`          | 415            | Tipo de contenido bloqueado o no admitido                  |
| **Demasiadas solicitudes**            | `rate_limited`                    | 429            | Reduce el ritmo                                            |
| **Cuota superada**                    | `quota_exceeded`                  | 429            | Cuota del inquilino o límite del plan agotado              |
| **Error del servidor**                | `internal`                        | 500 o superior | Fallo en el servidor                                       |
| **Servidor no accesible**             | `network_error`                   | ninguno        | No hay respuesta del servidor                              |
| **Error inesperado**                  | `unknown`                         | otro           | No reconocido                                              |

### Revisa los datos introducidos {#validation-failed}

**Qué ha pasado:** el servidor comprobó los valores que enviaste y rechazó al menos uno de ellos
(`validation_failed`, HTTP 422).

**Causas habituales:** un campo obligatorio está vacío, un valor es demasiado largo, una clave o un
slug contiene caracteres no permitidos, un campo JSON no es un objeto JSON, un nombre de permiso es
desconocido o no está permitido para este tipo de rol, o una contraseña no cumple la política de
contraseñas del servidor.

**Qué hacer:** lee los mensajes debajo de los campos o en la lista bajo el título. Si no hay ningún
campo marcado, abre **Detalles técnicos**: el **Mensaje del servidor** indica la regla, por ejemplo
`permissions not allowed for a tenant role: tenants:read`. Corrige el valor y vuelve a enviarlo.

### Solicitud no comprendida {#bad-request}

**Qué ha pasado:** el servidor no pudo interpretar la solicitud en absoluto (`bad_request`, HTTP
400), por ejemplo porque un valor tenía un formato incorrecto.

**Qué hacer:** recarga la página y repite la acción. Si vuelve a ocurrir, comunícalo con el ID de
solicitud; normalmente Studio solo envía solicitudes bien formadas.

### Inicia sesión {#unauthenticated}

**Qué ha pasado:** no has iniciado sesión o tu sesión ha terminado (`unauthenticated`, HTTP 401).

**Causas habituales:** una sesión termina tras una duración máxima (12 horas por defecto), tras un
período sin actividad (120 minutos por defecto), cuando cierras la sesión, cuando la revocas
tú o la revoca un administrador, cuando se desactiva tu cuenta y (para tus demás sesiones) cuando cambias
tu contraseña. Los tiempos exactos los fija tu operador.

**Qué hacer:** Studio te lleva automáticamente a la página de inicio de sesión y, después, te
devuelve a la página en la que estabas. Los datos de formulario sin guardar se pierden. Consulta
[Sesión terminada](#session-ended).

### No permitido {#forbidden}

**Qué ha pasado:** el servidor te conoce a ti y conoce el elemento, pero rechaza la acción
(`forbidden`, HTTP 403).

**Causas habituales:**

- **Falta un permiso.** El mensaje del servidor dice cuál, por ejemplo
  `missing permission records:write`. Consulta la
  [referencia de permisos](help:permissions-reference) para saber qué permite cada permiso y qué
  roles integrados lo tienen.
- **El producto está archivado o el inquilino está suspendido.** En ese caso solo los
  administradores de la plataforma (acceso completo) y los observadores de la plataforma (acceso de
  lectura) pueden seguir trabajando en él; todos los demás, incluidas las claves de API, reciben
  `the product or tenant is not active`.
- **El techo de roles.** Intentaste asignar un rol con permisos que tú no tienes, o un rol de
  propietario sin ser propietario. Consulta [techo de roles](help:security#role-ceiling).
- **Permisos de claves de API.** Intentaste dar a una clave nueva un permiso que tú no tienes
  (`you cannot grant permissions you do not hold`).
- **Comprobación del origen.** El servidor rechazó una solicitud porque Studio se ejecuta en una
  dirección en la que no confía (`cross-origin request refused`) o faltaba el token de seguridad
  (`missing or invalid CSRF token`). Consulta
  [El inicio de sesión o el guardado falla con No permitido](#csrf-origin).

**Qué hacer:** pide a un propietario o administrador del producto o del inquilino que te dé un rol
con el permiso que falta, o que reactive el producto o el inquilino. Studio suele ocultar los
botones de las acciones que no puedes realizar, pero el servidor siempre tiene la última palabra.

### Vuelve a iniciar sesión {#reauthentication-required}

**Qué ha pasado:** la acción solo se permite en los minutos siguientes al inicio de sesión
(`reauthentication_required`, HTTP 403). Hoy afecta a establecer una primera contraseña en una
cuenta que hasta ahora solo inicia sesión mediante inicio de sesión único.

**Qué hacer:** elige **Volver a iniciar sesión**. Studio cierra tu sesión, abre la página de inicio
de sesión y te devuelve al mismo sitio; repite la acción enseguida (ventana predeterminada: 5
minutos). Si tu operador ha desactivado las primeras contraseñas, la acción nunca es posible.
Consulta [Perfil](help:profile).

### No encontrado {#not-found}

**Qué ha pasado:** el servidor responde como si el elemento no existiera (`not_found`, HTTP 404).

**Causas habituales:** el elemento se eliminó, la dirección está mal escrita o viene de otra
instalación, o no tienes relación con el producto o el inquilino. En este último caso, Axentra
muestra deliberadamente **No encontrado** en lugar de **No permitido**, para que nadie pueda
averiguar qué productos, inquilinos o cuentas existen.

Cuando añades un usuario existente como miembro, **Usuario no encontrado** significa que ninguna
cuenta _que puedas ver_ tiene esta dirección. Envía una invitación en su lugar (consulta
[Miembros e invitaciones](help:members-invitations)).

**Qué hacer:** comprueba la dirección, vuelve a la lista o pide a alguien con acceso al producto o
al inquilino que te añada.

### Módulo no activado {#module-disabled}

**Qué ha pasado:** la acción necesita un módulo del servidor que está desactivado
(`module_disabled`).

**Qué hacer:** pide a tu operador que active el módulo en la configuración del servidor. La
[referencia de módulos](help:modules-reference) indica qué hace posible cada módulo.

### Conflicto {#conflict}

**Qué ha pasado:** la solicitud choca con datos existentes o con el estado actual del elemento
(`conflict`, HTTP 409). El mensaje del servidor explica el choque; Studio lo muestra después del
texto traducido.

**Causas habituales y soluciones:**

| Mensaje del servidor (ejemplos)                                                                               | Qué hacer                                                                                 |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `a tenant with this slug exists in the product`, `a role with this key exists`, `a plan with this key exists` | Elige otro slug u otra clave. Los slugs y las claves son únicos.                          |
| `an open invitation for this email exists`                                                                    | Usa o revoca primero la invitación abierta.                                               |
| `the tenant needs at least one owner`, `the product needs at least one owner`                                 | Da el rol de propietario a otra persona antes de degradar o quitar al último propietario. |
| `the role is assigned 3 times; reassign those members first`                                                  | Cambia esos miembros a otro rol y después elimina el rol.                                 |
| `subscriptions use this plan; deactivate it instead`, `the meter has recorded usage; deactivate it instead`   | Desactiva en lugar de eliminar.                                                           |
| `only failed or dead jobs can be retried`, `the job is already succeeded`                                     | La tarea ya no está en un estado que permita la acción; recarga.                          |
| `the delivery is already queued or in progress`                                                               | Espera a que termine la entrega en curso.                                                 |

### Ya se usó para otra solicitud {#idempotency-conflict}

Algunas acciones (poner una tarea en cola, publicar un evento, enviar una notificación, registrar
uso) llevan una _clave de idempotencia_ para que un envío repetido no se ejecute dos veces. Si la
misma clave ya se usó con otros valores, o por otro llamante, el servidor responde `409`. Studio
muestra **Ya se usó para otra solicitud** y genera una clave nueva por ti u ofrece **Usar una clave
nueva**. Vuelve a enviar para crear un elemento nuevo. Consulta la entrada del glosario
[clave de idempotencia](help:glossary#idempotency-key).

### No disponible en este modo {#mode-not-supported}

**Qué ha pasado:** el servidor se ejecuta en un modo que no admite la acción
(`mode_not_supported`).

**Causas habituales:** crear o archivar productos en un servidor en modo de un solo producto, o
abrir el buzón local de notificaciones cuando el servidor no usa el proveedor de correo local de
pruebas.

**Qué hacer:** nada en Studio; un operador tendría que cambiar la configuración del servidor.
Consulta [Productos](help:products) y [configuración del servidor](help:server-configuration).

### Proveedor de pagos no configurado {#payment-provider-not-configured}

**Qué ha pasado:** una acción de facturación, como un checkout para un plan de pago, necesita un
proveedor de pagos y el servidor no tiene ninguno configurado (`payment_provider_not_configured`).

**Qué hacer:** pide a tu operador que configure el proveedor de facturación. Consulta
[Planes y suscripciones](help:plans-subscriptions).

### Modificado mientras tanto {#precondition-failed}

**Qué ha pasado:** editaste un elemento que otra persona guardó después de que lo abrieras
(`precondition_failed`, HTTP 412). Studio envía la versión de la que partiste; el servidor se niega
a sobrescribir la versión más reciente, para que ningún cambio se pierda sin avisar.

**Qué hacer:** recarga el elemento, revisa el cambio de la otra persona y vuelve a hacer el tuyo.

### Demasiado grande {#payload-too-large}

**Qué ha pasado:** la solicitud o el archivo es más grande de lo que acepta el servidor
(`payload_too_large`, HTTP 413).

**Límites habituales:** cuerpos de solicitud de 10 MiB por defecto (los fija el operador), un
registro de 256 KiB de JSON como máximo y archivos hasta el tamaño máximo de archivo del servidor.
El mensaje del servidor indica el límite, por ejemplo `files may be at most 10485760 bytes`. (Los
payloads de tareas y los datos de eventos, de 64 KB como máximo cada uno, se rechazan en cambio con
**Revisa los datos introducidos**).

**Qué hacer:** usa un archivo más pequeño o menos datos, o pregunta a tu operador por el límite.
Consulta [Archivos](help:files) y [Registros](help:records).

### Tipo no aceptado {#unsupported-media-type}

**Qué ha pasado:** el servidor no acepta el tipo de contenido (`unsupported_media_type`, HTTP 415).
Lo más frecuente es que se haya bloqueado una subida de archivo: los ejecutables, HTML, SVG y los
archivos de script se bloquean por tipo, extensión del nombre de archivo y contenido.

**Qué hacer:** sube otro tipo de archivo o empaqueta el archivo en un archivo comprimido si tu
producto lo permite. Un producto puede configurarse para guardar los archivos bloqueados como
adjuntos inertes en lugar de rechazarlos. Consulta [Archivos](help:files).

### Demasiadas solicitudes {#rate-limited}

**Qué ha pasado:** demasiadas solicitudes en poco tiempo (`rate_limited`, HTTP 429).

**Causas habituales:** demasiados intentos fallidos de inicio de sesión para una cuenta o desde una
dirección de red (por defecto, 10 intentos fallidos por cuenta y minuto), o un límite general de
solicitudes que tu operador ha activado.

**Qué hacer:** espera aproximadamente un minuto y vuelve a intentarlo. Si sigues alcanzando el
límite al iniciar sesión, comprueba el correo electrónico y la contraseña, o usa el inicio de sesión
único si está disponible.

### Cuota superada {#quota-exceeded}

**Qué ha pasado:** se ha agotado una cuota o un límite del plan (`quota_exceeded`, HTTP 429), por
ejemplo la cuota de almacenamiento del inquilino (bytes o número de archivos) o una cuota de uso.

**Qué hacer:** elimina archivos o espera al siguiente período de uso, o pide a alguien con
`tenants:update` (cuota de almacenamiento), `usage:manage` (cuotas de uso) o `billing:manage`
(planes) que suba el límite. Consulta [Uso](help:usage) y [Archivos](help:files).

### Error del servidor {#internal}

**Qué ha pasado:** el servidor, o un servicio que hay detrás, falló al procesar la solicitud
(`internal`, HTTP 500 o superior). Por motivos de seguridad, el servidor nunca muestra detalles
internos; el ID de solicitud relaciona tu informe con la entrada del registro del servidor. Un
`502`, `503` o `504` de un proxy inverso situado delante del servidor también aparece como **Error
del servidor**.

**Qué hacer:** vuelve a intentarlo pasado un momento. Puede que tu cambio no se haya guardado, así
que compruébalo antes de repetir acciones destructivas. Si sigue fallando, comunícalo a tu operador
con el ID de solicitud y la hora.

### Servidor no accesible {#network-error}

**Qué ha pasado:** Studio no recibió ninguna respuesta (`network_error`): la conexión falló o se
interrumpió.

**Qué hacer:** comprueba tu conexión de red y la VPN. Si otros sitios funcionan, puede que el
servidor de Axentra esté caído o reiniciándose; consulta el
[Estado del sistema](help:health-monitoring) cuando vuelva a responder, o pregunta a tu operador.

### Error inesperado {#unknown}

**Qué ha pasado:** el servidor respondió con un error que Studio no reconoce (`unknown`).

**Qué hacer:** vuelve a intentarlo. Si sigue ocurriendo, comunícalo con el ID de solicitud, el
**Código de error** y el **Mensaje del servidor** de **Detalles técnicos**.

## Mensajes al arrancar {#startup}

Antes de mostrar nada, Studio carga la información del servidor, comprueba la versión de la API y
después tu sesión. Los problemas en esta fase ocupan toda la pantalla.

### Conectando con el servidor de Axentra… {#connecting}

Es la pantalla de inicio normal. Si se mantiene mucho tiempo, el servidor tarda en responder o no
es accesible; Studio muestra entonces [No se puede conectar con Axentra](#api-unreachable).

### No se puede conectar con Axentra {#api-unreachable}

Studio no pudo cargar la información del servidor (`GET /v1/meta`). Debajo de la explicación ves el
título del error y, si el servidor respondió, el ID de solicitud.

- **Servidor no accesible**: el servidor está caído, se está reiniciando o la red lo bloquea.
- **Error del servidor** o **No encontrado**: Studio llega a _algo_, pero no a la API de Axentra,
  por ejemplo a un proxy inverso que no reenvía `/v1`, o hay una dirección de API incorrecta en el
  archivo de configuración de Studio (`/config.json`, ajuste `apiBaseUrl`).

**Qué hacer:** elige **Reintentar**. Si persiste, un operador debe comprobar que el servidor se
esté ejecutando y que Studio apunte a la dirección de API correcta (consulta
[configuración del servidor](help:server-configuration)).

### Versión del servidor incompatible {#incompatible-version}

Studio y el servidor usan versiones distintas de la API de Axentra. La pantalla muestra la
**Versión de API del servidor**, la **Versión de API requerida**, la versión del **Servidor** y la
**Versión de Studio**, junto con uno de estos motivos:

- **Versión principal distinta**: Studio y el servidor son de generaciones distintas.
- **Servidor demasiado antiguo**: el servidor es más antiguo de lo que requiere este Studio.
  Actualiza el servidor o usa un Studio más antiguo.
- **Versión ilegible**: el servidor informó de una versión que Studio no puede interpretar.

**Qué hacer:** usa una versión de Studio que corresponda a la versión de API del servidor, o
actualiza el servidor. Studio solo comprueba la versión cuando se carga la página: tras actualizar
el servidor, recarga la página.

### Configurar Axentra {#setup-required}

Un servidor nuevo aún no tiene administrador de la plataforma. En ese caso, Studio abre
**Configurar Axentra** en lugar de la página de inicio de sesión. Necesitas un token de
configuración de un solo uso que un operador imprime en el servidor. Consulta
[Configuración inicial](help:first-run-setup).

### No se pudo comprobar tu sesión {#session-check-failed}

Studio preguntó al servidor si tienes la sesión iniciada y recibió un error en lugar de una
respuesta (por ejemplo **Error del servidor** o **Servidor no accesible**). Elige **Reintentar**. No
es lo mismo que una sesión terminada.

### Sesión terminada {#session-ended}

Cuando cualquier solicitud devuelve **Inicia sesión**, Studio abre la página de inicio de sesión con
el aviso **Inicia sesión para continuar donde lo dejaste.** Tras iniciar sesión vuelves a la misma
página. Consulta [Iniciar sesión](help:signing-in).

### Módulo no habilitado en este servidor {#module-not-enabled}

Abriste un área cuyo módulo del servidor está desactivado. La página indica el ID del módulo que un
operador tiene que activar (por ejemplo `storage` o `billing`). En la barra lateral, esas áreas
llevan la etiqueta **Inactivo**. Consulta la [referencia de módulos](help:modules-reference).

### Aún no disponible en Studio {#not-in-studio}

El módulo está activado en el servidor, pero esta versión de Studio no tiene pantallas para él. Usa
directamente la API o una versión más reciente de Studio.

### Página no encontrada {#page-not-found}

La dirección no corresponde a ninguna página de Studio: puede estar mal escrita, o el elemento se
movió o se eliminó. Elige **Ir a la página de inicio**.

### Se ha producido un error {#something-went-wrong}

No se pudo mostrar la página, a menudo porque se desplegó una versión más reciente de Studio
mientras tu pestaña estaba abierta. Elige **Recargar página**. Si el problema continúa, comunícalo
con la dirección de la página.

## Situaciones habituales {#situations}

### Un área aparece como Inactivo en la barra lateral {#menu-item-off}

El módulo del servidor que hay detrás está desactivado. El área se sigue abriendo y te indica qué
módulo hay que activar. Las áreas que necesitan un producto (la mayoría) solo aparecen después de
elegir un producto.

### Falta un botón o una pestaña {#action-missing}

Studio oculta las acciones y pestañas que tus permisos no permiten, por ejemplo **Nuevo inquilino**
sin `tenants:create` o la pestaña **Miembros** sin `members:read`. Busca el permiso en la
[referencia de permisos](help:permissions-reference) y pide un rol adecuado. Algunas acciones
también se ocultan por el modo del servidor (por ejemplo **Nuevo producto** en el modo de un solo
producto).

### Una página muestra No permitido aunque puedes abrirla {#page-forbidden}

La barra lateral muestra todas las áreas; si puedes leer sus datos se decide al cargar la página.
Un área sin el permiso de lectura muestra **No permitido** con el permiso que falta en el mensaje
del servidor.

### El inicio de sesión o el guardado falla con No permitido {#csrf-origin}

Si el inicio de sesión o todos los cambios fallan con **No permitido** y el mensaje del servidor
dice `cross-origin request refused` o `missing or invalid CSRF token`, Studio se ejecuta en una
dirección en la que el servidor no confía, o tu navegador bloquea la cookie de sesión. Un operador
tiene que añadir la dirección de Studio a los orígenes permitidos del servidor. Cuando Studio y la
API se ejecutan en direcciones distintas, ambas deben pertenecer al mismo sitio (por ejemplo
`studio.example.com` y `api.example.com`). Consulta [Seguridad](help:security#sessions-csrf).

### Falla el inicio de sesión {#sign-in-fails}

**Error al iniciar sesión** con «El correo electrónico o la contraseña no son correctos» aparece
tanto con una contraseña incorrecta _como_ con una dirección desconocida; el servidor no revela
cuál de las dos. Tras demasiados intentos ves [Demasiadas solicitudes](#rate-limited). Una cuenta
desactivada no puede iniciar sesión en absoluto. Consulta [Iniciar sesión](help:signing-in).

### Un enlace de invitación no funciona {#invitation-link}

- **Página no encontrada** o una página de la API: el enlace apunta a una dirección donde Studio no
  se ejecuta. Pide a tu equipo de operaciones que defina `notify.invitation_accept_url`; consulta
  [Miembros e invitaciones](help:members-invitations#delivery).
- **Esta invitación no se puede usar**: la invitación caducó, ya se usó o se revocó, o el enlace
  está incompleto. Pide a quien te invitó una invitación nueva.
- **Invitación para otra dirección de correo electrónico**: elige **Cerrar sesión y usar la
  dirección invitada**.

Consulta [Aceptar una invitación](help:members-invitations#accept).

### Se perdió un secreto de un solo uso {#secret-lost}

Los secretos de las claves de API, los secretos de firma de los webhooks y los enlaces de invitación
se muestran solo una vez y no se pueden volver a mostrar. Rota el secreto o crea una invitación
nueva. Consulta [Claves de API](help:api-keys), [Webhooks](help:webhooks) y
[Miembros e invitaciones](help:members-invitations).

### Problemas de funciones concretas {#feature-problems}

Cada artículo de función tiene su propia sección de solución de problemas, por ejemplo para tareas
que se quedan pendientes, entregas de webhooks que fallan, subidas rechazadas o invitaciones que no
llegan: [Tareas](help:jobs), [Programaciones](help:schedules), [Webhooks](help:webhooks),
[Archivos](help:files), [Notificaciones](help:notifications),
[Planes y suscripciones](help:plans-subscriptions).

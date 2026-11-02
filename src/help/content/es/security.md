---
title: Seguridad
summary: Cómo protegen Axentra y Studio los inicios de sesión, separan los inquilinos, limitan lo que se puede conceder y gestionan los secretos, y qué puedes hacer para mantener segura tu instalación.
keywords: seguridad, sesión, cookie, CSRF, seguridad a nivel de fila, RLS, aislamiento de inquilinos, techo de roles, secreto, clave de API, rotación, firma de webhook, HMAC, auditoría, privacidad, RGPD, GDPR, contraseña
---

Axentra está construido para que un error en un punto no lo abra todo: el acceso se deniega salvo
que un rol lo conceda, los datos de cada inquilino están separados en la base de datos, nadie puede
repartir más derechos de los que tiene y los secretos se muestran una vez y después solo se guardan
de una forma que no se puede volver a leer. Esta página explica estas protecciones con palabras
sencillas, qué ves de ellas en Studio y los hábitos que mantienen segura una instalación.

> [!NOTE]
> Studio es solo una ventana al servidor de Axentra. Todas las decisiones (quién puede ver o cambiar
> qué) las toma el servidor. Studio oculta los botones que no puedes usar, pero ocultarlos es una
> comodidad, no la protección.

## Sesiones y protección CSRF {#sessions-csrf}

### Tu sesión {#sessions}

Cuando inicias sesión, el servidor crea una _sesión_ y tu navegador recibe una cookie de sesión. La
cookie está marcada para que los scripts de una página no puedan leerla y, con HTTPS, solo se envía
por conexiones cifradas. El servidor guarda solo una huella (hash) del token de sesión, nunca el
token en sí. Cada inicio de sesión crea un token nuevo.

Una sesión termina:

- al alcanzar su duración máxima (12 horas por defecto),
- tras un período sin actividad (120 minutos por defecto),
- cuando eliges **Cerrar sesión** en el menú de usuario,
- cuando la revocas en **Tus sesiones** en tu [perfil](help:profile), o un administrador usa
  **Cerrar sesión en todas partes** en tu página de usuario,
- cuando se desactiva tu cuenta,
- para todas tus _demás_ sesiones, cuando cambias tu contraseña.

Tu operador puede cambiar las duraciones. Cuando termina una sesión, Studio te lleva a la página de
inicio de sesión y, después, de vuelta a donde estabas (consulta
[Sesión terminada](help:troubleshooting#session-ended)).

### Protección CSRF {#csrf}

La _falsificación de solicitudes entre sitios_ (CSRF) es un ataque en el que otro sitio web intenta
que tu navegador envíe un cambio a Axentra mientras tienes la sesión iniciada. Axentra lo bloquea de
tres maneras, y tú no tienes que hacer nada:

1. La cookie de sesión no se envía con las solicitudes que otros sitios lanzan en segundo plano
   (`SameSite=Lax`).
2. Cada cambio que envía Studio lleva un token de seguridad que pertenece a tu sesión. Studio
   guarda este token solo en memoria, nunca en el almacenamiento del navegador.
3. El servidor comprueba que la solicitud venga de una dirección de confianza (la dirección de
   Studio debe estar en la lista de orígenes permitidos del servidor).

Si Studio se ejecuta en una dirección en la que el servidor no confía, el inicio de sesión y todos
los cambios fallan con **No permitido**; consulta
[Falla el inicio de sesión o el guardado](help:troubleshooting#csrf-origin).

### Contraseñas e intentos de inicio de sesión {#passwords}

Las contraseñas se guardan con Argon2id, un hash unidireccional lento. La política del servidor
exige al menos 12 caracteres por defecto. Un inicio de sesión fallido siempre indica que el correo
electrónico _o_ la contraseña son incorrectos, para que nadie pueda averiguar qué cuentas existen.
Tras unos 10 intentos fallidos para una cuenta en un minuto (más desde una misma dirección de red),
los intentos siguientes se rechazan durante un máximo de un minuto.

Establecer una _primera_ contraseña en una cuenta que solo inicia sesión mediante inicio de sesión
único solo se permite en los minutos siguientes al inicio de sesión, para que una sesión robada no
se pueda convertir en un acceso permanente con contraseña (consulta
[Vuelve a iniciar sesión](help:troubleshooting#reauthentication-required)).

## Aislamiento de inquilinos {#tenant-isolation}

Cada cliente u organización de un producto es un [inquilino](help:tenants). Axentra mantiene
separados los inquilinos en dos capas independientes:

1. **Comprobaciones de permisos.** Antes de leer o escribir cualquier dato, el servidor comprueba
   que tú (o la clave de API) tienes el permiso necesario exactamente para este producto e
   inquilino.
2. **Seguridad a nivel de fila en la base de datos.** Cada transacción de la base de datos se limita
   a un producto o a un inquilino. Aunque a una consulta se le olvidara un filtro, la propia base de
   datos solo devuelve filas de ese producto o inquilino y se niega a escribir filas de otro.

Qué significa esto para ti:

- Un miembro de un inquilino solo ve los datos de su propio inquilino. Quien no tiene relación con
  un producto o inquilino recibe **No encontrado**, exactamente como si no existiera.
- Un rol a nivel de producto (por ejemplo **Product admin**) funciona en _todos_ los
  inquilinos del producto. Da roles de producto solo a quien de verdad necesite ese alcance.
- Una clave de API pertenece a un producto y se puede restringir a un inquilino.
- Las cuentas de usuario son globales: una cuenta puede trabajar en varios productos e inquilinos.
  Los administradores de producto solo ven los usuarios relacionados con su producto.

> [!NOTE]
> Los administradores de la base de datos, y las copias de seguridad de la base de datos, pueden ver
> todos los datos. Proteger el servidor de base de datos y sus copias de seguridad es tarea del
> operador.

## Techo de roles: nadie puede conceder más de lo que tiene {#role-ceiling}

Poder gestionar miembros (`members:manage`, o `product_members:manage` para los operadores de
producto) no significa que puedas hacer administrador a cualquiera. El servidor aplica un _techo de
roles_:

- Solo puedes asignar un rol (añadir, invitar o cambiar a un miembro) si **tienes todos los permisos
  de ese rol** en el mismo ámbito.
- Solo puedes cambiar o quitar a un miembro si su rol _actual_ también está dentro de tus permisos.
- Los roles de propietario (**Owner** de un inquilino, **Product owner** de un
  producto) solo los puede asignar, cambiar o quitar un propietario del mismo ámbito, o alguien con
  autoridad superior: los operadores de producto para los inquilinos y los administradores de la
  plataforma en todas partes.
- El último propietario de un producto o inquilino no se puede quitar ni degradar, y el último
  administrador de la plataforma no se puede desactivar ni degradar.

En Studio, los roles que no puedes asignar aparecen como **«… (por encima de tus permisos)»** y no
se pueden seleccionar; los miembros por encima de tu nivel muestran **Por encima de tu propio rol:
solo alguien con los permisos de este rol puede cambiarlo**. El mismo principio se aplica a las
claves de API: una clave nueva solo puede tener permisos que tenga quien la crea. Los permisos de
plataforma nunca se conceden a claves de API.

Detalles y ejemplos: [Roles y permisos](help:roles-permissions) y la
[referencia de permisos](help:permissions-reference).

## Secretos de un solo uso {#one-time-secrets}

Algunos valores son secretos que permiten a una máquina o persona actuar en tu nombre. Axentra
muestra cada uno de ellos **exactamente una vez**:

| Secreto                                  | Cuándo se muestra                                      | Cómo lo guarda el servidor                      |
| ---------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Secreto de la clave de API (`axk_…`)     | Tras crear o rotar una clave                           | Solo un hash; no se puede volver a mostrar      |
| Secreto de firma del webhook (`whsec_…`) | Tras crear un webhook o rotar su secreto               | Cifrado (AES-256-GCM), solo se usa para firmar  |
| Enlace y token de invitación             | Tras crear una invitación                              | Solo un hash del token                          |
| Token de configuración inicial           | Se imprime en el servidor para el primer administrador | Solo un hash; válido durante un tiempo limitado |

En Studio, los secretos de claves de API y de webhooks aparecen en un diálogo con una advertencia,
un campo enmascarado y botones para copiar. El diálogo no se puede cerrar con Escape ni haciendo
clic fuera; lo confirmas con **He guardado el secreto de forma segura**. Los enlaces y tokens de
invitación se muestran en un recuadro marcado como **Se muestra solo una vez**.

Si pierdes un secreto, no se puede recuperar: [rota la clave de API](help:api-keys), rota el
[secreto del webhook](help:webhooks) o crea una invitación nueva.

## Buenas prácticas con las claves de API {#api-key-hygiene}

Las [claves de API](help:api-keys) permiten que otros sistemas llamen a la API de Axentra. Buenas
prácticas:

- **Una clave por servicio y entorno**, con el nombre del lugar donde se usa (por ejemplo
  «billing-worker production»), para poder revocar una sin romper las demás.
- **Mínimo privilegio:** concede solo los permisos que necesita el servicio y restringe la clave a
  un inquilino cuando el servicio trabaje solo para uno.
- **Guarda los secretos en un gestor de secretos**, nunca en el código fuente, en tickets ni en el
  chat.
- **Rota con regularidad** con **Rotar secreto**. Un período de gracia (hasta 7 días) mantiene
  operativo el secreto antiguo mientras actualizas los servicios.
- **Revoca las claves que ya no necesites.** Revocar una clave también revoca todas las claves que
  se crearon con ella. Las claves creadas por una persona pertenecen al producto, no a la persona:
  cuando alguien se va, revisa y revoca las claves que configuró.
- Vigila la columna **Último uso**: una clave que nunca se usa puede eliminarse; una clave usada de
  forma inesperada merece un vistazo en el [registro de auditoría](help:audit).

## Firmas de los webhooks {#webhook-signing}

Axentra firma cada solicitud de [webhook](help:webhooks) para que el sistema receptor pueda
comprobar que viene realmente de tu servidor de Axentra y que no se ha modificado ni reproducido.
Cada solicitud lleva una cabecera `Axentra-Signature`:

```text
Axentra-Signature: t=1767225600,v1=5f2b…
```

`t` es el momento de la firma (segundos Unix); `v1` es un HMAC-SHA256 de `<t>.<raw request body>`
calculado con el secreto de firma del webhook. Durante una rotación de secreto con período de
gracia, la cabecera lleva dos valores `v1`, uno por secreto. El receptor debe:

1. calcular el HMAC sobre la marca de tiempo, un punto y el cuerpo sin procesar,
2. compararlo con cada valor `v1` en tiempo constante,
3. rechazar las solicitudes cuya marca de tiempo tenga más de unos 5 minutos,
4. ignorar los eventos cuyo ID (`Axentra-Event-Id`) ya haya procesado.

El [tutorial del receptor de webhooks](help:tutorial-webhook-receiver) recorre un ejemplo completo.

## Pista de auditoría {#audit-trail}

El servidor registra los cambios relevantes para la seguridad en un
[registro de auditoría](help:audit) de solo anexado: quién (usuario o clave de API), qué (por
ejemplo `access.role.create`), cuándo, en qué producto e inquilino, el resultado, el ID de
solicitud, la dirección IP y el navegador o cliente. Los secretos se eliminan de los detalles
registrados antes de guardarlos.

Los operadores de producto con `audit:read` ven los eventos de su producto; los administradores y
observadores de la plataforma (`platform:audit`) ven los eventos de toda la instalación, como los
inicios de sesión y los cambios de usuarios. Los eventos de auditoría se conservan durante un
período que fija tu operador (365 días por defecto).

## Lo que Studio nunca guarda {#what-studio-never-stores}

- **Ningún secreto en el navegador.** El token CSRF y un token de monitorización que introduzcas se
  guardan solo en memoria y desaparecen al cerrar o recargar la pestaña. Los secretos de un solo uso
  se muestran, nunca se guardan.
- **Solo preferencias inofensivas en el almacenamiento del navegador:** idioma, tema, la barra
  lateral contraída y el último producto que usaste.
- **Ningún dato de tarjeta ni bancario.** Studio nunca pide datos de pago; los pagos se hacen solo
  en la página alojada del proveedor de pagos (consulta
  [Planes y suscripciones](help:plans-subscriptions)).
- **Ningún script de terceros.** Studio carga su código solo desde su propia dirección. Las vistas
  previas de correo se muestran en un entorno aislado que no puede ejecutar scripts.

El servidor también elimina contraseñas, tokens y claves de sus registros, mensajes de error y
detalles de auditoría.

## Buenas prácticas {#good-practice}

- Concede los roles de plataforma con moderación; da preferencia a los roles de producto y de
  inquilino.
- Usa los roles integrados cuando encajen, y roles personalizados solo con los permisos necesarios.
- Desactiva las cuentas de las personas que se van (**Desactivar usuario** termina todas sus
  sesiones a la vez) y revisa las claves de API que crearon.
- Revisa el [registro de auditoría](help:audit) con regularidad, sobre todo los cambios de roles,
  claves y miembros.
- Cierra la sesión en ordenadores compartidos y revoca en tu [perfil](help:profile) las sesiones
  que no reconozcas.

> [!IMPORTANT]
> Axentra ofrece medidas técnicas (separación de inquilinos, cifrado de los secretos guardados,
> pista de auditoría, minimización de datos en los registros), pero por sí solo no hace que una
> instalación cumpla la legislación de protección de datos, como el RGPD. El alojamiento, las copias
> de seguridad, la retención y las solicitudes de los interesados son responsabilidad del operador.
> Aún no existe una exportación ni un borrado integrados de los datos de una persona (consulta
> [limitaciones](help:limitations)).

## Solución de problemas {#troubleshooting}

| Situación                                                                                                                             | Causa y solución                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El inicio de sesión y todos los cambios fallan con **No permitido** (`cross-origin request refused`, `missing or invalid CSRF token`) | La dirección de Studio no está en los orígenes permitidos del servidor, o la cookie está bloqueada. Consulta [la entrada de solución de problemas](help:troubleshooting#csrf-origin). |
| Se cierra tu sesión de forma inesperada                                                                                               | La sesión caducó, se revocó o tu contraseña se cambió en otra sesión. Vuelve a iniciar sesión.                                                                                        |
| **No permitido** al asignar un rol                                                                                                    | Techo de roles: el rol tiene permisos que tú no tienes, o es un rol de propietario. Pregunta a un propietario.                                                                        |
| **No permitido** al crear una clave de API                                                                                            | Intentaste conceder un permiso que tú no tienes. Quítalo de la selección.                                                                                                             |
| **Vuelve a iniciar sesión** al establecer una contraseña                                                                              | Solo se permite poco después de iniciar sesión. Elige **Volver a iniciar sesión** y repite de inmediato.                                                                              |
| Un receptor rechaza las firmas del webhook                                                                                            | Debe firmar el cuerpo _sin procesar_, aceptar cualquier valor `v1` y usar el secreto actual. Consulta [Webhooks](help:webhooks).                                                      |
| Perdiste un secreto                                                                                                                   | No se puede volver a mostrar; rótalo o crea una invitación nueva.                                                                                                                     |

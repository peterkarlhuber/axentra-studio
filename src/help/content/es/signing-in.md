---
title: Iniciar y cerrar sesión
summary: Inicia sesión con contraseña o con inicio de sesión único, entiende cuándo termina una sesión y resuelve problemas de acceso.
keywords: login, iniciar sesión, acceder, entrar, logout, cerrar sesión, salir, contraseña, SSO, inicio de sesión único, OIDC, OpenID Connect, proveedor de identidad, Keycloak, Entra ID, Google, sesión, caducada, tiempo de espera, idioma, volver
---

Studio funciona con tu cuenta personal en el servidor Axentra. Cuando inicias sesión, el servidor
abre una **sesión** para tu navegador; a partir de ahí Studio actúa con tus roles hasta que la sesión
termina. Según la configuración del servidor, inicias sesión con una dirección de correo electrónico
y una contraseña, mediante el **inicio de sesión único** con el proveedor de identidad de tu
organización, o de ambas formas.

## Iniciar sesión con correo electrónico y contraseña {#password}

1. Abre Studio. Si no has iniciado sesión, aparece la página **Iniciar sesión**.
2. Introduce tu **Correo electrónico** y tu **Contraseña**.
3. Elige **Iniciar sesión**.

**Resultado esperado:** Studio abre la página de la que venías o el panel del último producto que
usaste. Si todavía no tienes ningún producto, llegas a **Productos**.

El formulario solo aparece cuando el servidor permite iniciar sesión con contraseña. Las cuentas
creadas mediante inicio de sesión único no tienen contraseña y no pueden usar el formulario; puedes
establecer una contraseña para una cuenta así en tu [perfil](help:profile), si el servidor lo
permite.

## Iniciar sesión con inicio de sesión único {#sso}

Si el operador ha conectado un proveedor de identidad (OpenID Connect, por ejemplo Keycloak,
Microsoft Entra ID, Google o Auth0), la página de inicio de sesión muestra un botón **Continuar con …**
por cada proveedor, debajo del formulario de contraseña y de la palabra **o**.

1. Elige **Continuar con** _tu proveedor_.
2. Inicia sesión en tu proveedor de identidad como de costumbre (incluido cualquier paso de
   autenticación multifactor que exija).
3. El proveedor te devuelve a Studio con la sesión iniciada.

Conviene saber:

- La autenticación multifactor la gestiona tu proveedor de identidad, no Axentra.
- En tu primer inicio de sesión único, Axentra vincula el acceso a una cuenta existente con la misma
  dirección de correo electrónico **verificada**, o crea una cuenta nueva si el proveedor permite el
  registro o si existe una [invitación](help:members-invitations) abierta para tu dirección.
- Una cuenta nueva no tiene acceso por sí misma. Solo verás productos e inquilinos cuando alguien te
  asigne un rol o aceptes una invitación.

## Volver a donde lo dejaste {#return-to}

Cuando tu sesión termina mientras trabajas, o cuando abres un enlace a una página de Studio sin haber
iniciado sesión, Studio te lleva a la página de inicio de sesión y recuerda la página. La página de
inicio de sesión indica entonces **Inicia sesión para continuar donde lo dejaste.** Tras iniciar
sesión (con contraseña o con inicio de sesión único) vuelves a esa página, incluidos los filtros de
la dirección.

Por seguridad, Studio solo vuelve a sus propias páginas; cualquier otro destino lleva a la página de
inicio.

> [!WARNING]
> Los datos sin guardar de un formulario abierto se pierden cuando termina la sesión. En ediciones
> largas, guarda de vez en cuando.

## Cuándo termina una sesión {#session-end}

| La sesión termina…                                  | Valor predeterminado                          |
| --------------------------------------------------- | --------------------------------------------- |
| Al alcanzar su duración máxima, aunque estés activo | 12 horas (`security.session_ttl_hours`)       |
| Tras un período sin ninguna solicitud               | 120 minutos (`security.session_idle_minutes`) |
| Cuando cierras sesión                               | De inmediato                                  |
| Cuando la revocas tú o la revoca un administrador   | En la siguiente solicitud                     |
| Cuando se desactiva tu cuenta                       | De inmediato, todas las sesiones              |
| Cuando cambias tu contraseña                        | Todas tus **demás** sesiones                  |

Los valores los establece el operador del servidor. Tus sesiones activas (navegadores y
dispositivos) aparecen en tu [perfil](help:profile), donde también puedes cerrarlas.

Algunas acciones relevantes para la seguridad requieren un inicio de sesión **reciente**. Si el
servidor responde **Vuelve a iniciar sesión**, Studio cierra tu sesión y, tras volver a iniciarla,
regresas a la misma página para repetir la acción.

> [!NOTE]
> El inicio de sesión único solo **abre** una sesión de Axentra. Cerrar sesión en Studio no cierra
> tu sesión en el proveedor de identidad, y cerrar sesión o quedar bloqueado en el proveedor no
> termina una sesión de Axentra en curso; esta termina al caducar normalmente o cuando un
> administrador desactiva la cuenta.

## Cerrar sesión {#sign-out}

1. Abre el menú de usuario arriba a la derecha (tus iniciales y tu nombre).
2. Elige **Cerrar sesión**.

Studio cierra la sesión en el servidor, olvida todos los datos cargados y muestra la página de
inicio de sesión. En un ordenador compartido, cierra siempre la sesión.

## Elegir el idioma antes de iniciar sesión {#language}

La página de inicio de sesión y la página de configuración tienen un selector de idioma debajo del
formulario. Tu elección se aplica de inmediato y se recuerda en este navegador. Después de iniciar
sesión puedes cambiar el idioma en el menú de usuario (**Idioma**) o en **Configuración**; entonces
también se guarda en tu cuenta y te acompaña en otros navegadores. Consulta
[la interfaz](help:interface#language).

## Configuración {#settings}

Estos ajustes del servidor afectan al inicio de sesión. Solo el operador del servidor puede
cambiarlos; Studio muestra los valores efectivos en **Configuración**.

| Ajuste                           | Qué hace                                                                                                                   | Valor predeterminado |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `security.password_login`        | Permite iniciar sesión con correo electrónico y contraseña. Si está desactivado, solo se ofrece el inicio de sesión único. | activado             |
| `security.login_rate_per_minute` | Inicios de sesión fallidos permitidos por cuenta y minuto (por dirección de red: el triple).                               | 10                   |
| `security.session_ttl_hours`     | Duración máxima de la sesión.                                                                                              | 12                   |
| `security.session_idle_minutes`  | Tiempo de espera por inactividad.                                                                                          | 120                  |
| Proveedores `[[oidc]]`           | Proveedores de inicio de sesión único que se muestran como **Continuar con …**.                                            | ninguno              |

## Detalles para administradores {#details}

- La sesión se guarda en una cookie `HttpOnly`; Studio nunca almacena tokens en el almacenamiento
  del navegador. Las solicitudes que modifican datos también necesitan un token CSRF, que Studio
  conserva en memoria.
- La dirección de Studio debe ser la `security.public_url` del servidor o figurar en
  `security.allowed_origins`; de lo contrario, el inicio de sesión y las solicitudes que modifican
  datos se rechazan con `403`.
- Los inicios de sesión, los inicios de sesión fallidos (`identity.login` con resultado `denied`) y
  los cierres de sesión se escriben en el [registro de auditoría](help:audit).
- Los inicios de sesión fallidos se limitan por cuenta. Por tanto, cualquiera que conozca una
  dirección puede bloquear el inicio de sesión con contraseña de esa cuenta durante un minuto como
  máximo.
- El inicio de sesión único usa el flujo de código de autorización con PKCE. El URI de redirección
  que hay que registrar en el proveedor es
  `<public URL of the API>/v1/auth/oidc/<provider id>/callback`. Configuración:
  [configuración del servidor](help:server-configuration).

## Errores del inicio de sesión único {#sso-errors}

Cuando falla el inicio de sesión único, el servidor te devuelve a la página de inicio de sesión y
Studio muestra **El inicio de sesión único no se completó** con el motivo:

| Motivo (código)                                                 | Qué significa                                                                                                                               | Qué hacer                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tardó demasiado o se inició en otro navegador (`login_expired`) | El inicio de sesión debe completarse en 10 minutos y en el mismo navegador.                                                                 | Vuelve a empezar desde la página de inicio de sesión.                                                   |
| Cancelado o rechazado (`access_denied`)                         | Cancelaste en el proveedor o se denegó el consentimiento.                                                                                   | Vuelve a empezar y confirma en el proveedor.                                                            |
| Proveedor no accesible (`provider_unavailable`)                 | Axentra no pudo acceder al proveedor o validarlo.                                                                                           | Inténtalo más tarde; el operador revisa la configuración del proveedor.                                 |
| No se pudo verificar la respuesta (`login_failed`)              | El token del proveedor no superó una comprobación.                                                                                          | Vuelve a intentarlo; si persiste, el operador revisa el log del servidor.                               |
| Correo electrónico no verificado (`email_not_verified`)         | El proveedor no confirmó tu dirección como verificada. Es habitual con Microsoft Entra ID, que a menudo no envía el claim `email_verified`. | El operador configura el proveedor para que lo envíe.                                                   |
| Dominio no permitido (`domain_not_allowed`)                     | Tu dominio de correo no está en la lista de dominios permitidos del proveedor.                                                              | Usa una cuenta de un dominio permitido.                                                                 |
| Sin cuenta (`signup_disabled`)                                  | No existe ninguna cuenta para ti y el registro está desactivado.                                                                            | Pide una [invitación](help:members-invitations) a un administrador y vuelve a iniciar sesión.           |
| Cuenta desactivada (`account_disabled`)                         | Tu cuenta está desactivada.                                                                                                                 | Ponte en contacto con un administrador.                                                                 |
| Demasiados intentos (`rate_limited`)                            | Se han iniciado demasiados accesos desde tu red.                                                                                            | Espera un minuto.                                                                                       |
| Invitación no aceptada aquí (`invitation_requires_post`)        | Un enlace de inicio de sesión único llevaba un token de invitación en su dirección, que el servidor rechaza.                                | Abre de nuevo el enlace de invitación de tu correo e inicia sesión desde la página de inicio de sesión. |

## Solución de problemas {#troubleshooting}

| Mensaje                                                                                | Causa                                                                                                                                                                                          | Qué hacer                                                                                                                                |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Error al iniciar sesión**: «El correo electrónico o la contraseña no son correctos.» | Dirección o contraseña incorrectas, la cuenta está desactivada o la cuenta no tiene contraseña (creada mediante inicio de sesión único). Por seguridad, el servidor no indica cuál es el caso. | Revisa los datos; prueba el inicio de sesión único; pide a un administrador que revise la cuenta en la página de [usuarios](help:users). |
| **Demasiadas solicitudes**                                                             | Se han superado los intentos fallidos permitidos en un minuto (10 por cuenta de forma predeterminada).                                                                                         | Espera un minuto y vuelve a intentarlo.                                                                                                  |
| **No hay ningún método de inicio de sesión disponible**                                | El servidor no tiene habilitado ni el inicio de sesión con contraseña ni el inicio de sesión único.                                                                                            | El operador debe configurar la autenticación.                                                                                            |
| El inicio de sesión único vuelve con un error                                          | Consulta los [errores del inicio de sesión único](help:signing-in#sso-errors).                                                                                                                 |                                                                                                                                          |
| Se te envía una y otra vez a la página de inicio de sesión                             | El navegador bloquea la cookie de sesión.                                                                                                                                                      | Permite las cookies para la dirección de Studio; pide al operador que revise la configuración.                                           |
| **No permitido** justo al iniciar sesión                                               | La dirección de Studio no es la URL pública del servidor ni figura en `security.allowed_origins`.                                                                                              | El operador añade la dirección de Studio a `security.allowed_origins`.                                                                   |
| **No se pudo comprobar tu sesión**                                                     | No se pudo consultar tu sesión al servidor (error de red o del servidor).                                                                                                                      | Elige **Reintentar**; revisa **Estado del sistema** cuando hayas vuelto a iniciar sesión.                                                |
| **Vuelve a iniciar sesión**                                                            | La acción requiere un inicio de sesión reciente.                                                                                                                                               | Vuelve a iniciar sesión y repite la acción.                                                                                              |
| Tras iniciar sesión no ves ningún producto                                             | Tu cuenta todavía no tiene ningún rol.                                                                                                                                                         | Pide a un administrador que te añada o que te envíe una invitación.                                                                      |

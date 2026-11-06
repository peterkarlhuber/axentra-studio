---
title: Tu perfil
summary: Consulta tu cuenta y tus membresías, cambia tu nombre visible y tu contraseña, y cierra la sesión en los navegadores que ya no usas.
keywords: perfil, cuenta, mi cuenta, nombre visible, nombre, contraseña, cambiar contraseña, establecer contraseña, sesiones, dispositivos, cerrar sesión, cerrar sesión en todas partes, inicio de sesión único, SSO
---

En tu **Perfil** gestionas tu propia cuenta: el nombre que ven los demás, tu contraseña y los
navegadores en los que tienes la sesión iniciada. También muestra a qué productos perteneces y con
qué rol. Todos los usuarios con sesión iniciada tienen un perfil; no se necesita ningún permiso.

Ábrelo desde el menú de usuario, arriba a la derecha, con **Perfil** ([abrir](app:profile)). El
idioma y el tema están en la página [Configuración](help:settings#preferences) y en el mismo menú
de usuario.

## Consultar tu cuenta {#account}

La tarjeta **Cuenta** muestra:

| Campo                  | Significado                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Correo electrónico** | La dirección con la que inicias sesión. No puedes cambiarla tú                                               |
| **ID de usuario**      | Tu ID (`usr_…`), por ejemplo para filtrar el [registro de auditoría](help:audit#filter) por **ID del actor** |
| **Rol de plataforma**  | `platform_admin` o `platform_viewer` si tienes uno; si no, **Ninguno**                                       |
| **Productos**          | Cada producto al que perteneces, con tu rol de producto (por ejemplo **Acme CRM · product_admin**)           |

Las membresías de inquilinos no aparecen aquí; están en las páginas de los inquilinos. Para obtener
otro rol, pídeselo a un propietario del producto o a un administrador de la plataforma; consulta
[Roles y permisos](help:roles-permissions).

## Cambiar tu nombre visible {#name}

1. En **Nombre visible**, cambia el **Nombre** (hasta 200 caracteres).
2. Elige **Guardar cambios**. El botón solo está activo cuando el nombre es distinto del guardado.

El nombre aparece en el menú de usuario, en las listas de miembros y como **Actor** de tus acciones
en el registro de auditoría. Los eventos de auditoría anteriores conservan el nombre que tenías
cuando se registraron.

## Cambiar tu contraseña {#password}

1. En **Cambiar contraseña**, introduce tu **Contraseña actual**.
2. Introduce la **Nueva contraseña** dos veces (**Repetir nueva contraseña**).
3. Elige **Cambiar contraseña**.

> [!WARNING]
> Cambiar la contraseña **cierra tu sesión en todos los demás navegadores y dispositivos** a la vez.
> El navegador que estás usando mantiene la sesión iniciada. Hazlo cuando sospeches que otra
> persona conoce tu contraseña.

La nueva contraseña debe

- tener al menos la longitud mínima del servidor (12 caracteres por defecto, consulta
  `password_min_length` en [Configuración](help:settings#settings-tree)) y como máximo 1024
  caracteres,
- no ser tu dirección de correo electrónico,
- contener al menos 4 caracteres distintos.

### Establecer una primera contraseña (usuarios de inicio de sesión único) {#set-password}

Si siempre has iniciado sesión mediante inicio de sesión único, la tarjeta se llama **Establecer una
contraseña** y no tiene el campo **Contraseña actual**. Con una contraseña también puedes iniciar
sesión con correo electrónico y contraseña.

Por tu seguridad, una primera contraseña solo se puede establecer **poco después de iniciar
sesión** (por defecto, en los 5 minutos siguientes; el operador lo configura con
`security.fresh_login_minutes`). Si tu inicio de sesión es anterior, Studio muestra **Vuelve a
iniciar sesión**:

1. Elige **Volver a iniciar sesión**. Studio cierra tu sesión y abre la página de inicio de sesión.
2. Inicia sesión. Vuelves a tu perfil.
3. En los minutos siguientes, introduce la **Nueva contraseña** dos veces y elige **Establecer
   contraseña**.

> [!NOTE]
> El operador puede desactivar esta opción (`security.first_password = "disabled"`). En ese caso,
> los usuarios que inician sesión mediante inicio de sesión único no pueden establecer ninguna
> contraseña, y el servidor lo rechaza con **No permitido**.

## Ver dónde tienes la sesión iniciada {#sessions}

**Tus sesiones** lista cada navegador o dispositivo con una sesión activa:

| Columna                        | Significado                                                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Dispositivo**                | Navegador y sistema operativo (según el user agent del navegador) y la dirección IP. **Esta sesión** marca el navegador que estás usando |
| **Método de inicio de sesión** | `password`, u `oidc:<provider>` para el inicio de sesión único                                                                           |
| **Última actividad**           | La última solicitud de esa sesión                                                                                                        |
| **Caduca**                     | Cuándo termina la sesión como muy tarde                                                                                                  |

Una sesión termina cuando alcanza su duración máxima (12 horas por defecto), tras un período sin
actividad (120 minutos por defecto), cuando cierras la sesión, cuando se revoca, cuando cambias tu
contraseña (todas las demás sesiones) o cuando un administrador desactiva tu cuenta.

### Cerrar la sesión en un navegador que ya no usas {#revoke-session}

1. Busca el navegador en **Tus sesiones**.
2. Elige **Revocar sesión** (el icono de la papelera al final de la fila).
3. Confirma **¿Revocar esta sesión?** con **Revocar sesión**.

Ese navegador cierra la sesión con su siguiente solicitud. Tu sesión actual no tiene botón para
revocarla; usa **Cerrar sesión** en el menú de usuario.

### Cerrar la sesión en todos los demás sitios {#sign-out-elsewhere}

Para terminar todas las sesiones excepto la que estás usando, elige **Cerrar todas las demás
sesiones** en la cabecera de **Tus sesiones**. El botón aparece cuando existe al menos otra sesión.
Studio pide antes una confirmación que indica cuántas sesiones terminan.

Tu sesión actual nunca se cierra. Cada una de las demás sesiones se cierra por separado; si algunas
no se pueden cerrar (por ejemplo por el límite de solicitudes), Studio te dice cuántas, la lista
muestra las que siguen activas y puedes volver a elegir el botón.

> [!TIP]
> ¿Iniciaste sesión en un ordenador compartido o perdido? Revoca esa sesión aquí. Si crees que otra
> persona conoce tu contraseña, cámbiala: eso también cierra todas las demás sesiones.

Los administradores pueden terminar las sesiones de otros usuarios en la página
[Usuarios](help:users).

## Solución de problemas {#troubleshooting}

- **No permitido** tras **Cambiar contraseña**: la **Contraseña actual** es incorrecta. El servidor
  registra el intento como **Denegado** en el registro de auditoría.
- **Revisa los datos introducidos**: la nueva contraseña incumple una de las reglas anteriores
  (demasiado corta, igual a tu correo electrónico, demasiado simple). Los **Detalles técnicos** del
  mensaje muestran el motivo del servidor, por ejemplo «the password must have at least 12
  characters».
- **Las nuevas contraseñas no coinciden.**: **Nueva contraseña** y **Repetir nueva contraseña** son
  distintas.
- **Vuelve a iniciar sesión** al establecer una primera contraseña: tu inicio de sesión es demasiado
  antiguo. Sigue los pasos de [Establecer una primera contraseña](#set-password).
- **No permitido** al establecer una primera contraseña: el servidor no permite contraseñas para los
  usuarios de inicio de sesión único, o tu cuenta no tiene dirección de correo electrónico. Sigue
  iniciando sesión mediante inicio de sesión único.
- Se cerró tu sesión de forma inesperada: tu sesión caducó, estuvo inactiva demasiado tiempo o se
  revocó (por ejemplo, porque cambiaste tu contraseña en otro sitio). Vuelve a iniciar sesión;
  Studio te devuelve a la página en la que estabas.

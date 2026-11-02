---
title: Configuración inicial
summary: Crea el primer administrador de la plataforma de un servidor Axentra nuevo con un token de configuración de un solo uso.
keywords: configuración, instalación, configuración inicial, primer arranque, puesta en marcha, bootstrap, token de configuración, primer administrador, administrador de la plataforma, incorporación, configurar Axentra
---

Un servidor Axentra nuevo todavía no tiene administrador. Mientras sea así, el servidor indica
«setup required» y Studio muestra la página **Configurar Axentra** en lugar de la página de inicio
de sesión. Allí creas el primer **administrador de la plataforma**: la cuenta con control total
sobre la instalación. Necesitas un **token de configuración** de la persona que gestiona el
servidor.

## Antes de empezar {#before-you-start}

> [!IMPORTANT]
>
> - El servidor Axentra está en marcha y Studio puede acceder a él.
> - Nadie ha completado todavía la configuración. La página solo está disponible hasta que exista el
>   primer administrador de la plataforma.
> - Alguien con acceso a la consola del servidor puede ejecutar el comando `axentra`.

## Obtener un token de configuración {#setup-token}

El token de configuración demuestra que tienes autorización para reclamar el servidor nuevo. Se crea
en el propio servidor, de modo que solo alguien que controla el servidor puede entregarlo.

1. En el servidor (o en el contenedor del servidor), ejecuta:

   ```bash
   axentra admin setup-token
   ```

2. El comando muestra un token que empieza por `axsetup_`. Cópialo.

| Propiedad      | Valor                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validez        | 60 minutos de forma predeterminada (ajuste del operador `security.setup_token_ttl_minutes`, al menos 5).                                                                          |
| Uso            | Una sola vez. Un token usado deja de funcionar.                                                                                                                                   |
| Disponibilidad | Solo mientras no exista ningún administrador de la plataforma. Si ya existe uno, el comando muestra «setup is already complete (a platform admin exists)» y no crea ningún token. |

Puedes crear un token nuevo en cualquier momento mientras la configuración siga abierta; los tokens
anteriores sin usar siguen siendo válidos hasta que caducan.

> [!CAUTION]
> El token de configuración otorga el control total del servidor a quien lo use primero. Entrégalo
> solo a la persona que crea el primer administrador, por un canal privado, y crea uno nuevo en
> lugar de reenviar uno antiguo por correo electrónico.

## Crear el primer administrador {#create-admin}

1. Abre Studio en tu navegador. **Configurar Axentra** aparece automáticamente.
2. Si quieres, elige tu idioma con el selector de idioma situado debajo del formulario.
3. Rellena el formulario:

   | Campo                      | Qué introducir                                                                                            |
   | -------------------------- | --------------------------------------------------------------------------------------------------------- |
   | **Token de configuración** | El token del servidor, por ejemplo `axsetup_EXAMPLE…`.                                                    |
   | **Nombre completo**        | Tu nombre tal como lo verán otros administradores.                                                        |
   | **Correo electrónico**     | La dirección con la que iniciarás sesión.                                                                 |
   | **Contraseña**             | Una contraseña larga y única (consulta las [reglas de contraseña](help:first-run-setup#password-policy)). |
   | **Repetir contraseña**     | La misma contraseña otra vez.                                                                             |

4. Elige **Crear administrador**.

**Resultado esperado:** Studio indica **Configuración completada** («Has iniciado sesión como
administrador de la plataforma») y abre Studio. En modo multiproducto sin ningún producto todavía,
llegas a **Productos** con la indicación de crear el primer producto; en modo de producto único
llegas al panel del único producto del servidor.

## Reglas de contraseña {#password-policy}

El servidor comprueba la contraseña y la rechaza si incumple alguna de estas reglas:

| Regla                           | Valor predeterminado                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Longitud mínima                 | 12 caracteres (ajuste del operador `security.password_min_length`, al menos 8).                                 |
| Longitud máxima                 | 1024 caracteres.                                                                                                |
| Distinta del correo electrónico | La contraseña no puede ser igual a la dirección de correo electrónico (sin distinguir mayúsculas y minúsculas). |
| No trivial                      | Al menos 4 caracteres diferentes.                                                                               |

Las contraseñas se almacenan como hashes Argon2id; nadie, ni siquiera el operador, puede
recuperarlas.

## Después de la configuración {#after-setup}

- La página de configuración ya no está accesible; abrir `/setup` lleva a la página de inicio de
  sesión.
- Tu cuenta tiene el rol **Administrador de la plataforma**. El evento `identity.setup.complete`
  figura en el [registro de auditoría](help:audit).
- Tu sesión funciona como cualquier otra sesión iniciada (consulta
  [iniciar sesión](help:signing-in#session-end)).

Próximos pasos:

1. Crea tu primer producto y tu primer inquilino: [primeros pasos](help:first-steps).
2. Asigna el rol de administrador de la plataforma a una segunda persona de confianza, para que la
   instalación no dependa de una sola cuenta (consulta [usuarios](help:users)). Antes necesita una
   cuenta, por ejemplo mediante el [inicio de sesión único](help:signing-in#sso).
3. Si el servidor debe usar solo el inicio de sesión único, el operador puede desactivar más
   adelante el inicio de sesión con contraseña (`security.password_login = false`).

## Solución de problemas {#troubleshooting}

| Mensaje                                                                                                                                                                                      | Causa                                                                                                                                  | Qué hacer                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Token de configuración no aceptado**                                                                                                                                                       | El token tiene un error tipográfico, ha caducado (más de 60 minutos de forma predeterminada) o ya se ha usado.                         | Crea un token nuevo con `axentra admin setup-token` y pégalo sin espacios.                                    |
| **La configuración ya está completada**                                                                                                                                                      | Alguien ha creado entretanto un administrador de la plataforma.                                                                        | Inicia sesión con esa cuenta o pide acceso a su propietario. Studio te lleva a la página de inicio de sesión. |
| **Las contraseñas no coinciden.**                                                                                                                                                            | **Contraseña** y **Repetir contraseña** son distintas.                                                                                 | Vuelve a escribir ambas.                                                                                      |
| **Revisa los datos introducidos** con el mensaje del servidor «the password must have at least … characters», «the password must not equal the email address» o «the password is too simple» | No se cumplen las [reglas de contraseña](help:first-run-setup#password-policy).                                                        | Elige una contraseña más larga y con más caracteres diferentes.                                               |
| **Revisa los datos introducidos** con «invalid email address»                                                                                                                                | La dirección de correo electrónico no es válida.                                                                                       | Corrige la dirección.                                                                                         |
| **Conflicto** con el mensaje del servidor «a user with this email address exists»                                                                                                            | Ya existe una cuenta con esta dirección de correo electrónico (por ejemplo, una creada por código de biblioteca).                      | Usa otra dirección o pregunta al operador.                                                                    |
| **Demasiadas solicitudes**                                                                                                                                                                   | Demasiados intentos de configuración desde tu red en un minuto (el límite de inicio de sesión, 10 por minuto de forma predeterminada). | Espera un minuto y vuelve a intentarlo.                                                                       |
| Studio muestra la página de inicio de sesión en lugar de la de configuración                                                                                                                 | Ya existe un administrador de la plataforma.                                                                                           | Inicia sesión o pide una cuenta a un administrador existente.                                                 |
| **No se puede conectar con Axentra**                                                                                                                                                         | Studio no puede acceder al servidor.                                                                                                   | Revisa con el operador el servidor y la dirección de API de Studio.                                           |

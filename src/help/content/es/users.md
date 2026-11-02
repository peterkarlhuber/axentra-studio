---
title: Usuarios
summary: Encuentra a las personas que tienen acceso a un producto, revisa su perfil y sus sesiones, cierra sus sesiones, desactiva cuentas y asigna roles de plataforma.
keywords: usuario, cuenta, persona, personas, desactivar usuario, deshabilitar, bloquear, cerrar sesión en todas partes, sesiones, rol de plataforma, administrador de la plataforma, observador de la plataforma, sin correo electrónico
---

Un **usuario** es la cuenta de una persona en el servidor Axentra. Las cuentas abarcan toda la
instalación: una misma cuenta puede ser operadora de un producto y miembro de inquilinos de varios
otros. Lo que puede hacer un usuario procede de tres fuentes:

- un **rol de plataforma** (para toda la instalación; poco habitual),
- un **rol de producto**, cuando el usuario es operador de un producto (consulta
  [productos](help:products#members)),
- un **rol de inquilino** en cada inquilino del que el usuario es miembro (consulta
  [miembros e invitaciones](help:members-invitations)).

La pantalla [Usuarios](app:users) muestra los usuarios del producto actual: sus operadores y los
miembros de sus inquilinos.

> [!IMPORTANT]
> La pantalla **Usuarios** requiere `product_users:read` (propietarios, administradores, soporte y
> observadores del producto; administradores y observadores de la plataforma). Desactivar usuarios,
> cerrar sus sesiones y ver sus sesiones requiere el permiso de plataforma `users:manage`, que solo
> tienen los administradores de la plataforma. Solo los administradores de la plataforma cambian los
> roles de plataforma.

## Buscar un usuario {#find}

Abre [Usuarios](app:users). Usa **Buscar usuarios** para filtrar por nombre o dirección de correo
electrónico y el filtro **Estado** para mostrar los usuarios con estado **Activo** o **Desactivado**. Selecciona
un nombre para abrir la página del usuario.

Studio no crea cuentas. Las cuentas se crean cuando el primer administrador completa la
configuración inicial, cuando alguien inicia sesión por primera vez mediante inicio de sesión único
(si la configuración del proveedor de identidad permite el registro o hay una invitación abierta
para esa dirección de correo electrónico) o mediante el código de un producto que integra Axentra.
Consulta [iniciar sesión](help:signing-in).

## La página del usuario {#profile}

La tarjeta **Perfil** muestra:

| Campo                                   | Significado                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Nombre**, **Correo electrónico**      | Proceden de la cuenta. Los usuarios editan su propio nombre en su perfil.                        |
| **Estado**                              | **Activo** o **Desactivado**.                                                                    |
| **Idioma**                              | El idioma de la interfaz del usuario.                                                            |
| **Rol de plataforma**                   | **Sin rol de plataforma**, **Observador de la plataforma** o **Administrador de la plataforma**. |
| **Inicio de sesión con contraseña**     | **Contraseña establecida** o **Sin contraseña (solo inicio de sesión único)**.                   |
| **Último inicio de sesión**, **Creado** | Marcas de tiempo.                                                                                |

La página del usuario no muestra sus membresías. Para ver o cambiar lo que un usuario puede hacer en
un inquilino, abre la pestaña **Miembros** del inquilino; para los operadores, la pestaña
**Miembros** del producto.

### Usuarios sin dirección de correo electrónico {#no-email}

Algunas cuentas no tienen dirección de correo electrónico, por ejemplo cuando un proveedor de
identidad no confirmó ninguna y el servidor permite ese tipo de registros. Studio muestra entonces el
ID del usuario en lugar de la dirección. Estos usuarios:

- solo inician sesión mediante inicio de sesión único, nunca con contraseña;
- no pueden aceptar invitaciones, porque las invitaciones están vinculadas a una dirección;
- sí pueden añadirse directamente a inquilinos por alguien que pueda verlos (por ejemplo, un
  administrador de la plataforma).

## Cerrar todas las sesiones de un usuario {#sign-out}

1. Abre la página del usuario.
2. Elige **Cerrar sesión en todas partes** y confirma.

Todas las sesiones del usuario terminan de inmediato, en todos los dispositivos. El usuario puede
volver a iniciar sesión. Úsalo cuando se haya perdido un dispositivo o una sesión pueda estar
comprometida. **Sesiones activas**, en la misma página, enumera cada sesión con el dispositivo, el
**Método de inicio de sesión**, **Última actividad** y **Caduca**.

## Desactivar un usuario {#disable}

1. Abre la página del usuario.
2. Elige **Desactivar usuario**.
3. Escribe la dirección de correo electrónico del usuario (o su ID, si no tiene) para confirmar y
   elige **Desactivar usuario**.

Un usuario desactivado no puede iniciar sesión, ni con contraseña ni con inicio de sesión único, y
todas sus sesiones terminan de inmediato. Las membresías, el rol de plataforma y el historial de
auditoría se conservan, de modo que **Activar usuario** restablece el acceso anterior.

> [!WARNING]
> Las claves de API que creó un usuario pertenecen al producto, no al usuario, y siguen funcionando
> después de desactivarlo. Cuando alguien se marcha, revisa y revoca también las claves que
> configuró. Consulta [claves de API](help:api-keys#revoke).

No puedes desactivarte a ti mismo, y el último administrador de la plataforma activo no se puede
desactivar.

## Cambiar un rol de plataforma {#platform-role}

Los roles de plataforma se aplican a **todos los productos** del servidor, con independencia de las
membresías.

| Rol de plataforma                  | Significado                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sin rol de plataforma**          | Acceso solo mediante membresías de producto y de inquilino.                                                                                                                          |
| **Observador de la plataforma**    | Acceso de solo lectura a todos los productos, incluidos los productos archivados y los inquilinos suspendidos, a la configuración y al registro de auditoría de toda la instalación. |
| **Administrador de la plataforma** | Control total de toda la instalación: todos los productos y usuarios, creación y archivado de productos, sin techo de roles.                                                         |

1. Abre la página del usuario. La tarjeta **Rol de plataforma** solo se muestra a los
   administradores de la plataforma.
2. Elige el nuevo **Rol de plataforma**.
3. Elige **Cambiar rol de plataforma** y confirma. Para conceder **Administrador de la plataforma**
   hay que escribir la dirección de correo electrónico del usuario (o su ID).

> [!CAUTION]
> Un administrador de la plataforma puede hacerlo todo en el servidor, incluido eliminar inquilinos y
> crear claves en cualquier producto. Concédelo al menor número posible de personas. El último
> administrador de la plataforma no puede perder el rol.

## Solución de problemas {#troubleshooting}

**No permitido en la pantalla Usuarios.** Te falta `product_users:read` en este producto. Los
propietarios y miembros de los inquilinos no lo tienen; ven a sus compañeros en la pestaña
**Miembros** del inquilino.

**No aparecen los botones Desactivar usuario ni Cerrar sesión en todas partes.** Requieren
`users:manage`, que solo tienen los administradores de la plataforma.

**Conflicto: «you cannot disable yourself».** Pídeselo a otro administrador de la plataforma.

**Conflicto: «the last platform admin cannot be disabled» / «the last platform admin cannot lose
the role».** Haz antes administrador de la plataforma a otro usuario.

**No permitido: «only platform admins can change platform roles».** Pídeselo a un administrador de
la plataforma.

**Falta un usuario en la lista.** El usuario no es operador de este producto ni miembro de ninguno
de sus inquilinos. Añádelo o invítalo; consulta [miembros e invitaciones](help:members-invitations).

**Un usuario desactivado sigue apareciendo en los inquilinos.** Desactivar no quita las membresías.
Quítalas en la pestaña **Miembros** del inquilino si el acceso no debe volver cuando se reactive el
usuario.

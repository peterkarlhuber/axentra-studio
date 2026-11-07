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

Salvo los [usuarios de inicio de sesión único](help:users#external-user), Studio no crea cuentas. Las cuentas se crean cuando el primer administrador completa la
configuración inicial, cuando alguien inicia sesión por primera vez mediante inicio de sesión único
(si la configuración del proveedor de identidad permite el registro o hay una invitación abierta
para esa dirección de correo electrónico) o mediante el código de un producto que integra Axentra.
Consulta [iniciar sesión](help:signing-in).

## Añadir un usuario de inicio de sesión único {#external-user}

Para migraciones e importaciones, los administradores de la plataforma crean cuentas que solo
inician sesión mediante un proveedor de identidad, con o sin dirección de correo electrónico.

1. Abre [Usuarios](app:users) y elige **Añadir usuario de inicio de sesión único**.
2. Escribe el **Proveedor (emisor)**: la URL de emisor del proveedor de identidad, exactamente como
   figura en la configuración de inicio de sesión único del servidor. Studio sugiere los proveedores
   configurados.
3. Escribe el **Sujeto**: el ID del usuario en el proveedor (el claim `sub`), no la dirección de
   correo.
4. Si quieres, rellena **Nombre** y **Correo electrónico (opcional)**. Marca **El proveedor verificó
   esta dirección** solo si el proveedor confirmó que la dirección pertenece al usuario.
5. Elige **Añadir usuario**. Studio abre la página del nuevo usuario.

La dirección de correo pasa a ser la del usuario solo si está verificada; si no, el usuario no tiene
dirección (consulta [usuarios sin dirección de correo electrónico](help:users#no-email)). El nuevo
usuario no tiene contraseña ni membresías: añádelo a los inquilinos en la pestaña **Miembros** del
inquilino.

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

### Membresías {#memberships}

La tarjeta **Membresías** muestra a qué pertenece el usuario, en la medida en que puedas verlo:

- **Roles de producto**: productos en los que el usuario es operador, con el rol. Los
  administradores y observadores de la plataforma ven todos; los demás ven los productos en los
  que tienen `product_members:read`.
- **Membresías de inquilinos**: inquilinos en los que el usuario es miembro, con el producto, el
  rol y el estado del inquilino. Los demás ven los inquilinos en los que tienen `members:read`.

La tarjeta es de solo lectura. Para cambiar lo que un usuario puede hacer, abre la pestaña
**Miembros** del inquilino (desde su nombre) o, para los operadores, la pestaña **Miembros** del
producto.

### Usuarios sin dirección de correo electrónico {#no-email}

Algunas cuentas no tienen dirección de correo electrónico, por ejemplo cuando un proveedor de
identidad no confirmó ninguna y el servidor permite ese tipo de registros. Studio muestra entonces el
ID del usuario en lugar de la dirección. Estos usuarios:

- solo inician sesión mediante inicio de sesión único, nunca con contraseña;
- no pueden aceptar invitaciones, porque las invitaciones están vinculadas a una dirección;
- sí pueden añadirse directamente a inquilinos por alguien que pueda verlos (por ejemplo, un
  administrador de la plataforma).

## Identidades de inicio de sesión único {#identities}

La tarjeta **Identidades de inicio de sesión único** de la página de un usuario lista las cuentas en
proveedores de identidad que inician sesión como este usuario, con las columnas **Proveedor
(emisor)**, **Sujeto**, **Correo informado** (la dirección que envió el proveedor) y **Vinculada**.
Axentra vincula una identidad en el primer inicio de sesión único del usuario o cuando un
administrador de la plataforma la vincula aquí.

> [!IMPORTANT]
> La tarjeta necesita `users:manage`. Solo los administradores de la plataforma vinculan y
> desvinculan identidades.

### Vincular una identidad {#link-identity}

1. Abre la página del usuario y elige **Vincular identidad** en la tarjeta **Identidades de inicio
   de sesión único**.
2. Escribe el **Proveedor (emisor)** y el **Sujeto** y elige **Vincular identidad**.

Después, el usuario puede iniciar sesión con esa cuenta del proveedor. Una identidad pertenece a un
solo usuario: **Conflicto** significa que ya está vinculada, a este o a otro usuario.

### Desvincular una identidad {#unlink-identity}

1. En la tarjeta **Identidades de inicio de sesión único**, elige el botón de desvincular junto a la
   identidad.
2. Lee el aviso y elige **Desvincular identidad**.

Todas las sesiones del usuario terminan de inmediato, porque una sesión no guarda con qué identidad
empezó. La última forma de iniciar sesión de un usuario no se puede desvincular: si el usuario no
tiene contraseña ni otra identidad, Studio muestra **Última forma de iniciar sesión del usuario**.
Vincula primero otra identidad o, en su lugar, [desactiva al usuario](help:users#disable).

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
> Las claves de API que creó un usuario dejan de funcionar en cuanto se desactiva o pierde los
> permisos que usan las claves: las solicitudes se rechazan con `api_key_creator_lost_access`
> (consulta [claves de API](help:api-keys#creator-permissions)). Las claves no se revocan y vuelven
> a funcionar si el acceso se restablece. Cuando alguien se marcha, crea claves de sustitución como
> alguien que se queda, cambia los servicios a ellas y revoca las claves antiguas.

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

**Conflicto al añadir un usuario de inicio de sesión único o al vincular una identidad.** La
identidad ya está vinculada a un usuario, o la dirección de correo verificada pertenece a otro
usuario. Busca a ese usuario o revisa el proveedor y el sujeto.

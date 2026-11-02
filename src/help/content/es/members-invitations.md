---
title: Miembros e invitaciones
summary: Da acceso a un inquilino añadiendo personas como miembros o invitándolas por correo electrónico, y entiende el techo de roles que limita qué roles puedes asignar.
keywords: miembro, membresía, invitar, invitación, enlace de invitación, token de invitación, aceptar invitación, techo de roles, propietario, añadir usuario, incorporación, equipo
---

Un **miembro** es un usuario con un rol en un inquilino, por ejemplo **Owner** (propietario),
**Admin** (administrador), **Member** (miembro) o **Viewer** (observador). El rol determina qué
puede hacer la persona en ese inquilino. Puedes dar acceso a alguien de dos maneras:

- **Añadir** directamente una cuenta existente, cuando ya puedes ver esa cuenta.
- **Invitar** a una persona por correo electrónico. Acepta la invitación tras iniciar sesión y se
  convierte en miembro con el rol que elegiste.

Los operadores de un producto completo se gestionan, en cambio, en el producto; consulta
[productos](help:products#members).

> [!IMPORTANT]
> Ver las pestañas **Miembros** e **Invitaciones** de un inquilino requiere `members:read` en el
> inquilino; añadir, invitar, cambiar roles, quitar y revocar requiere `members:manage`. Los
> propietarios y administradores del inquilino tienen ambos; los operadores con **Support**
> (soporte) tienen `members:manage`, pero solo pueden asignar roles que estén dentro de sus propios
> permisos (consulta el [techo de roles](#role-ceiling)). Ambas pantallas requieren el módulo de
> inquilinos.

## Roles de inquilino integrados {#tenant-roles}

| Rol                                       | Qué puede hacer                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Owner** (propietario, `tenant_owner`)   | Todo en el inquilino, incluido hacer propietarias a otras personas.                                                                 |
| **Admin** (administrador, `tenant_admin`) | Los mismos permisos que Owner, pero no puede asignar, cambiar ni quitar propietarios.                                               |
| **Member** (miembro, `member`)            | Trabaja con los datos: lee y escribe registros y archivos, publica eventos, registra uso, envía notificaciones y realiza búsquedas. |
| **Viewer** (observador, `viewer`)         | Lee el inquilino, sus miembros, registros, archivos, uso y facturación, y realiza búsquedas.                                        |

Los roles de inquilino personalizados de tu producto aparecen en las mismas listas, con su clave
entre paréntesis. Consulta [roles y permisos](help:roles-permissions).

## Añadir un usuario existente {#add}

1. Abre el inquilino desde [Inquilinos](app:tenants) y selecciona la pestaña **Miembros**.
2. Elige **Añadir miembro**.
3. Introduce el **Correo electrónico** y elige un **Rol**.
4. Elige **Añadir miembro**.

Esto solo funciona con cuentas que puedes ver: los administradores de la plataforma ven todas las
cuentas; los usuarios con `product_users:read` (propietarios, administradores, soporte y
observadores del producto) ven a todas las personas que ya pertenecen al producto; el resto solo ve
a los miembros del propio inquilino. Para cualquier otra dirección, el diálogo muestra **Usuario no
encontrado** y ofrece **Enviar invitación en su lugar**, que crea una invitación con el mismo correo
electrónico y el mismo rol.

> [!NOTE]
> Axentra responde «no encontrado» de la misma forma tanto si una cuenta no existe como si
> simplemente no es visible para ti. Así se evita que alguien pueda sondear la lista de cuentas del
> servidor.

## Cambiar un rol o quitar un miembro {#change-role}

- Para cambiar un rol, elige uno nuevo en la columna **Rol** del miembro. El cambio se aplica de
  inmediato.
- Para quitar un miembro, elige el icono de la papelera en la fila y confirma **¿Quitar miembro?**.
  La persona pierde todo el acceso que le otorgaba esta membresía. Su cuenta y sus demás membresías
  se mantienen.

Un inquilino siempre conserva al menos un **Owner**: al último propietario no se le puede quitar ni
asignar otro rol. Haz antes propietaria a otra persona.

## Invitar a alguien por correo electrónico {#invite}

1. Abre el inquilino y selecciona la pestaña **Invitaciones**, o abre
   [Invitaciones](app:invitations) y elige el inquilino.
2. Elige **Invitar a un miembro**.
3. Introduce el **Correo electrónico** y elige un **Rol**. Studio preselecciona **Member** o el
   primer rol que puedes asignar.
4. Elige **Enviar invitación**.

A continuación, el diálogo **Invitación creada** muestra el **Enlace de invitación** (si está
disponible) y el **Token de invitación**.

> [!CAUTION]
> El enlace y el token se muestran una sola vez. Axentra solo almacena un hash del token, así que
> nadie puede volver a mostrarlo. Cualquiera que tenga el token e inicie sesión con la dirección
> invitada puede unirse al inquilino. Compártelo solo con la persona invitada. Si se pierde, revoca
> la invitación y crea una nueva.

### Cómo llega la invitación a la persona {#delivery}

- **Módulo de notificaciones habilitado:** Axentra pone en cola un correo de invitación a la
  dirección con el enlace para aceptarla, y Studio muestra el mismo enlace para que también puedas
  enviarlo tú. El enlace apunta al ajuste de producto `invitation_accept_url`, si está definido
  (consulta la [configuración del producto](help:products#settings)); si no, a
  `/accept-invitation` en la URL pública del servidor. Para enviar a las personas directamente a la
  página de aceptación de Studio, establece `invitation_accept_url` en
  `https://<your Studio address>/invitations/accept?token={token}`.
- **Módulo de notificaciones desactivado:** no se envía ningún correo y no hay enlace. Comparte el
  **Token de invitación**; la persona lo introduce en la página **Aceptar invitación** de Studio.

### Vigencia y estado de la invitación {#expiry}

| Estado        | Significado                                                    |
| ------------- | -------------------------------------------------------------- |
| **Pendiente** | Abierta y válida; se puede aceptar o revocar.                  |
| **Aceptada**  | Usada; la persona es miembro.                                  |
| **Revocado**  | Cancelada con **Revocar invitación**; el token ya no funciona. |
| **Caducado**  | No se aceptó en los **7 días** siguientes a su creación.       |

La vigencia de 7 días es fija. Para ampliarla, revoca la invitación (si sigue pendiente) y vuelve a
invitar. Solo puede existir una invitación abierta por dirección de correo electrónico e inquilino a
la vez.

### Revocar una invitación {#revoke}

Elige el icono de la papelera junto a una invitación **Pendiente** y confirma **¿Revocar
invitación?**. El enlace y el token dejan de funcionar de inmediato.

## Aceptar una invitación {#accept}

Esto es lo que hace la persona invitada:

1. Inicia sesión en Studio con la cuenta cuya dirección de correo electrónico es la invitada. Una
   persona sin cuenta puede crearla iniciando sesión mediante inicio de sesión único con esa
   dirección (si tu servidor ofrece inicio de sesión único); no existe el registro propio con
   contraseña.
2. Abre el enlace de invitación. Si solo tienes el token, abre **Aceptar invitación** en
   `/invitations/accept` y pégalo en **Token de invitación**.
3. Elige **Aceptar invitación**.

Studio confirma **Invitación aceptada** y el inquilino aparece en tu producto. Si ya eras miembro del
inquilino, tu rol actual no cambia.

> [!IMPORTANT]
> Una invitación solo la puede aceptar un usuario con la sesión iniciada cuya cuenta tenga
> exactamente la dirección de correo electrónico invitada (sin distinguir mayúsculas y minúsculas).
> Los usuarios sin dirección de correo electrónico no pueden aceptar invitaciones; añádelos
> directamente.

## Techo de roles: qué roles puedes asignar {#role-ceiling}

Tener `members:manage` no te permite repartir más de lo que tú mismo tienes. El servidor aplica estas
reglas y Studio las muestra de antemano:

1. **Permisos.** Solo puedes asignar un rol (añadir, invitar o cambiar a él) si tienes todos los
   permisos de ese rol en el mismo inquilino. Solo puedes cambiar o quitar un miembro si su rol
   _actual_ también está dentro de tus permisos.
2. **Rango de propietario.** El rol **Owner** solo lo puede asignar, cambiar o quitar un propietario
   del inquilino, un operador de producto, una clave de API de todo el producto o un administrador de
   la plataforma.
3. **Último propietario.** Al último propietario de un inquilino (y al último **Product owner** de un
   producto) no se le puede quitar ni degradar.

| Eres                                     | Puedes asignar                                 | No puedes                                                                     |
| ---------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| Administrador de la plataforma           | Cualquier rol                                  | No hay ninguna limitación                                                     |
| Propietario o administrador del producto | Cualquier rol de inquilino, incluido **Owner** | (Los administradores del producto no pueden gestionar operadores de producto) |
| Operador con **Support**                 | **Viewer**                                     | **Member**, **Admin**, **Owner**                                              |
| **Owner** del inquilino                  | Cualquier rol del inquilino                    | Quitar al último propietario                                                  |
| **Admin** del inquilino                  | **Admin**, **Member**, **Viewer**              | Asignar, degradar o quitar a un **Owner**                                     |
| Rol personalizado con `members:manage`   | Roles cuyos permisos tiene                     | Roles más potentes                                                            |

En Studio, los roles que no puedes asignar aparecen como **“… (por encima de tus permisos)”** y están
desactivados, y los miembros que no puedes cambiar muestran **Por encima de tu propio rol**, sin
selector de rol ni botón para quitar.

> [!NOTE]
> Studio solo puede calcular el techo cuando puedes leer los roles del producto (`roles:read`). Sin
> ese permiso, el rol es un campo de texto libre y el servidor explica un rechazo con **No
> permitido**.

## Solución de problemas {#troubleshooting}

**Usuario no encontrado.** La cuenta no existe o no tienes permiso para verla. Usa **Enviar
invitación en su lugar**.

**Conflicto: «an open invitation for this email exists».** Ya existe una invitación pendiente para
esta dirección en el inquilino. Úsala, o revócala y vuelve a invitar.

**No permitido: «you cannot assign the role …: it has permissions you do not hold».** El rol está por
encima de tu nivel. Elige un rol con menos permisos o pídeselo a un propietario. Consulta el
[techo de roles](#role-ceiling).

**No permitido: «only owners can assign the role tenant_owner».** Solo los propietarios, los
operadores de producto y los administradores de la plataforma pueden gestionar propietarios.

**Conflicto: «the tenant needs at least one owner».** Has intentado quitar o degradar al último
propietario.

**Revisa los datos introducidos: «unknown tenant role …».** La clave del rol no existe en este
producto (por ejemplo, por un error tipográfico en el campo de texto libre del rol) o es un rol de
producto.

**Al aceptar: No encontrado, «the invitation is invalid or expired».** El token es incorrecto, o la
invitación ya se aceptó, se revocó o tiene más de 7 días. Pide una invitación nueva.

**Al aceptar: No permitido, «this invitation was sent to another email address».** Has iniciado
sesión con una cuenta de otra dirección o con una sin dirección de correo electrónico. Inicia sesión
con la dirección invitada o pide una invitación para tu dirección.

**La persona invitada no puede iniciar sesión.** Todavía no tiene cuenta. Studio no puede crear
cuentas y no existe el registro con contraseña. Una persona invitada obtiene una cuenta iniciando
sesión mediante inicio de sesión único con la dirección de correo electrónico invitada y verificada;
sin inicio de sesión único, pregunta a un administrador de la plataforma. Consulta
[iniciar sesión](help:signing-in).

**El diálogo de invitación solo muestra un token.** El módulo de notificaciones está desactivado, por
lo que no se generó ningún enlace. Comparte el token.

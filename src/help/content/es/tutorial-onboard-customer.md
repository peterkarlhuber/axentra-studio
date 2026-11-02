---
title: Dar de alta a una organización cliente
summary: Configura un cliente nuevo de principio a fin - inquilino, administrador y personal con los roles adecuados, invitaciones aceptadas, una clave de API para su integración y una comprobación en la auditoría.
keywords: alta, incorporación, onboarding, cliente nuevo, configuración de cliente, configuración de inquilino, invitar, invitación, aceptar invitación, propietario, administrador, miembro, observador, integración, clave de API, auditoría, lista de comprobación, baja
---

Un cliente nuevo, «Acme Ltd», se ha registrado en tu producto. En este tutorial preparas todo lo que
necesita: su propio inquilino, su administrador y su personal con los roles adecuados, una clave de
API para su integración y una comprobación en el registro de auditoría de que todo ocurrió según lo
previsto. También aprendes qué tiene que hacer el cliente por su parte para aceptar una invitación.

Este tutorial parte de [primeros pasos](help:first-steps). Calcula unos 30 minutos más el tiempo que
el cliente necesite para aceptar.

## Antes de empezar {#before-you-start}

> [!IMPORTANT]
> Necesitas estos permisos en el producto (los roles integrados **Product owner** y
> **Product admin** los tienen todos; un administrador de la plataforma los tiene de
> todos modos):
>
> | Tarea                              | Permiso                                                                                                |
> | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
> | Crear el inquilino                 | `tenants:create`                                                                                       |
> | Invitar, añadir y cambiar miembros | `members:manage`                                                                                       |
> | Invitar al **Owner** del cliente   | rango de propietario: operador de producto, propietario del inquilino o administrador de la plataforma |
> | Crear la clave de API              | `api_keys:manage` y cada permiso que pongas en la clave                                                |
> | Revisar el registro de auditoría   | `audit:read`                                                                                           |

Recoge antes del cliente:

- la dirección de correo electrónico de su **administrador** y de cada miembro del personal,
- qué debe poder hacer cada persona,
- qué tiene que hacer su integración a través de la API.

## Paso 1: Planificar los roles {#plan-roles}

Elige los roles antes de invitar a nadie; cambiarlos después es posible, pero es más fácil
olvidarse.

| Persona                             | Rol de inquilino recomendado | Por qué                                                                                          |
| ----------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Administrador principal del cliente | **Owner** (propietario)      | Control total del inquilino; puede gestionar a todos los miembros, incluidos otros propietarios. |
| Administrador adjunto               | **Admin** (administrador)    | Gestiona miembros y datos, pero no puede asignar ni quitar propietarios.                         |
| Personal que trabaja con datos      | **Member** (miembro)         | Lee y escribe datos y ve a los miembros; no puede gestionar miembros.                            |
| Auditores, personal de solo lectura | **Viewer** (observador)      | Solo lee datos.                                                                                  |

Si ninguno encaja, un operador de producto con `roles:manage` puede crear antes un rol de inquilino
personalizado. Consulta [roles y permisos](help:roles-permissions).

> [!TIP]
> Da el rol **Owner** solo a una o dos personas. Un segundo propietario evita un bloqueo
> cuando el primero se va.

## Paso 2: Crear el inquilino {#create-tenant}

1. Abre [Inquilinos](app:tenants) y elige **Nuevo inquilino**.
2. **Nombre**: `Acme Ltd`. Mantén el **Slug** derivado, `acme-ltd`, o introduce el nombre corto del
   cliente. El slug debe ser único en el producto y no se puede reutilizar mientras exista el
   inquilino.
3. Elige **Crear inquilino**.

**Resultado esperado:** «Inquilino “Acme Ltd” creado»; se abre la página del inquilino con el estado
**Activo** y sin miembros. Anota el **ID** del inquilino (`ten_…`) de la pestaña **Detalles**.

## Paso 3: Invitar al administrador del cliente {#invite-admin}

1. En la página del inquilino, abre **Invitaciones** y elige **Invitar a un miembro**.
2. **Correo electrónico**: la dirección del administrador, por ejemplo `admin@acme.example`.
3. **Rol**: **Owner**.
4. Elige **Enviar invitación**.

**Resultado esperado:** **Invitación creada** con el **Token de invitación** y, si el módulo
`notify` está activado, un **Enlace de invitación**. Ambos se muestran solo una vez.

### Cómo llega la invitación al cliente {#delivery}

- **Con el módulo `notify`**, Axentra envía la invitación por correo a la dirección, enlace
  incluido. No necesitas enviar nada; aun así, puedes copiar el enlace como respaldo.
- **Sin él**, copia el **Token de invitación** y envíalo tú mismo por un canal de confianza, junto
  con las instrucciones del [paso 5](help:tutorial-onboard-customer#accept-invitation).

> [!NOTE]
> El enlace de invitación se construye a partir del ajuste de producto `invitation_accept_url` (en
> **Ajustes (JSON)** del producto), por ejemplo
> `{"invitation_accept_url": "https://app.example.com/accept-invitation?token={token}"}`. Sin ese
> ajuste se aplica el ajuste del servidor `notify.invitation_accept_url`; sin este, el enlace apunta
> a `/accept-invitation` en la dirección pública de la API, que Studio redirige a su página de
> aceptación cuando se ejecuta en esa dirección. Haz que el enlace apunte a la página de tu producto
> que acepta invitaciones, o a la página de Studio
> `https://studio.example.com/invitations/accept?token={token}` si tus clientes usan Studio en su
> propia dirección.

**Compruébalo:** la pestaña **Invitaciones** muestra la invitación con el estado **Pendiente** y una
fecha de caducidad 7 días después.

## Paso 4: Añadir al personal {#add-staff}

Para cada persona más, elige una de estas vías:

- **La persona ya tiene una cuenta que puedes ver** (por ejemplo, es miembro de otro inquilino de
  este producto): abre **Miembros**, elige **Añadir miembro**, introduce el **Correo electrónico**,
  elige el **Rol** y confirma. La persona tiene acceso de inmediato.
- **Si no**: invítala como en el paso 3, con el rol del paso 1. Si **Añadir miembro** responde
  **Usuario no encontrado**, elige **Enviar invitación en su lugar**; Studio crea una invitación con
  el mismo rol.

Axentra no revela si una dirección tiene cuenta: invitar funciona igual para todas las direcciones.

## Paso 5: El cliente acepta {#accept-invitation}

Esto es lo que hace la persona invitada. Envíale estas instrucciones.

1. **Abrir el enlace de invitación.** Si no ha iniciado sesión, llega a **Iniciar sesión**, que
   menciona la invitación, y después de iniciar sesión vuelve a ella.
2. **Iniciar sesión exactamente con la dirección de correo electrónico invitada.**
   - Si tu servidor ofrece **inicio de sesión único**, la persona inicia sesión con **Continuar con
     …**. Se crea una cuenta automáticamente para una dirección de correo verificada que tiene una
     invitación abierta.
   - Con **solo inicio de sesión con contraseña**, la cuenta ya debe existir. Axentra no ofrece
     registro propio por la API: las cuentas para el inicio de sesión con contraseña las crea el
     código de tu producto. Consulta [usuarios](help:users).
3. **Confirmar.** La página muestra la cuenta en **Sesión iniciada como**; la persona elige **Aceptar
   invitación**. Con un token en lugar de un enlace, abre **Aceptar invitación** (dirección
   `/invitations/accept`) después de iniciar sesión y pega el **Token de invitación**.

**Resultado esperado:** **Invitación aceptada**, con el inquilino, el producto y el rol. La persona
ve ahora el inquilino según su rol. Puede tardar un momento en que el acceso aparezca en todas
partes.

**Compruébalo (tú):** en la pestaña **Miembros** del inquilino, la persona aparece con el rol
**Owner**. En **Invitaciones**, el estado es **Aceptada**.

> [!WARNING]
> Las invitaciones están vinculadas a la dirección. Si la persona inicia sesión con otra dirección,
> Studio muestra **Invitación para otra dirección de correo electrónico** y ofrece **Cerrar sesión y
> usar la dirección invitada**. Una invitación aceptada, revocada o caducada no se puede volver a
> usar (**Esta invitación no se puede usar**): crea una nueva.

## Paso 6: Ajustar los roles si hace falta {#change-role}

En la pestaña **Miembros**, elige un rol nuevo en la lista **Rol** del miembro; Studio confirma «Rol
actualizado». Para retirar el acceso, elige **Quitar miembro**. No puedes cambiar ni quitar
miembros cuyo rol esté por encima del tuyo (marcados con «Por encima de tu propio rol»).

## Paso 7: Crear la clave de API para la integración {#integration-key}

La integración del cliente (por ejemplo, su sincronización con el ERP) recibe su propia clave,
vinculada a su inquilino.

1. Abre [Claves de API](app:apiKeys) y elige **Nueva clave de API**.
2. **Nombre**: indica quién la usa y dónde, por ejemplo `acme erp-sync production`.
3. **Ámbito de inquilino**: **Acme Ltd**. Una clave vinculada a un inquilino no puede ver ni
   cambiar otros inquilinos.
4. **Permisos**: solo lo que necesita la integración, por ejemplo `records:read` y `records:write`
   para una sincronización de datos, y además `events:publish` si publica eventos.
5. Elige **Crear clave**, copia el **Secreto de la clave de API**, confirma **He guardado el
   secreto de forma segura** y elige **Listo**.

Entrega el secreto al contacto técnico del cliente por un canal seguro (por ejemplo, un gestor de
secretos compartido), nunca por correo electrónico sin cifrar. La integración lo envía como
`Authorization: Bearer axk_…`. Pruébalo como en [primeros pasos](help:first-steps#try-api-key).

> [!CAUTION]
> El secreto no se puede volver a mostrar. Si se pierde o se filtra, usa **Rotar secreto** (con un
> período de gracia para cambiar sin interrupciones) o **Revocar clave**. Consulta
> [Claves de API](help:api-keys).

## Paso 8: Revisar el registro de auditoría {#check-audit}

1. Abre el [Registro de auditoría](app:audit).
2. Pon **Producto** en tu producto. Si quieres, escribe `tenancy.*` en **Acción** para ver solo los
   eventos de inquilinos y miembros, o escribe el ID del inquilino en **ID del inquilino** (en
   **Más filtros** en pantallas pequeñas).
3. Elige **Aplicar filtros**.

**Resultado esperado**, los más recientes primero:

| Acción                      | Actor                        | Significado                                                            |
| --------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| `access.api_key.create`     | tú                           | Se creó la clave de la integración.                                    |
| `tenancy.invitation.accept` | el administrador del cliente | Se aceptó la invitación.                                               |
| `tenancy.member.set`        | tú                           | Se añadió un miembro o se cambió un rol (si hiciste el paso 4 o el 6). |
| `tenancy.invitation.create` | tú                           | Uno por invitación.                                                    |
| `tenancy.tenant.create`     | tú                           | Se creó el inquilino.                                                  |

Todos con el resultado **Éxito**. Un intento de aceptación con la cuenta equivocada aparece como
`tenancy.invitation.accept` con el resultado **Denegado**.

## Lista de comprobación del alta {#checklist}

1. Inquilino creado, ID anotado.
1. Administrador invitado como **Owner**, invitación aceptada, visible en **Miembros**.
1. Personal añadido o invitado con los roles previstos; todas las invitaciones **Aceptada**.
1. Clave de integración creada, vinculada al inquilino, con permisos mínimos y secreto entregado de
   forma segura.
1. El registro de auditoría muestra los eventos esperados.
1. Opcional: suscripción asignada (consulta [planes y suscripciones](help:plans-subscriptions)).

## Cuando el cliente se va {#offboarding}

- Primero, **Suspender inquilino**: los miembros y las claves vinculadas al inquilino pierden el
  acceso, no se elimina ningún dato y puedes reactivarlo.
- **Revoca** la clave de la integración.
- Usa **Eliminar inquilino** solo cuando los datos deban desaparecer; elimina el inquilino y todos
  sus datos y no se puede deshacer. Consulta [inquilinos](help:tenants).

## Solución de problemas {#troubleshooting}

| Problema                                                                    | Causa y solución                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No se puede seleccionar **Owner**                                           | Te falta el rango de propietario o algunos de los permisos del rol (techo de roles). Pregunta a un propietario del producto o a un administrador de la plataforma.                                                                                                                                                  |
| **Conflicto** al invitar                                                    | Ya existe una invitación abierta para esta dirección en este inquilino. Úsala o revócala.                                                                                                                                                                                                                           |
| **Usuario no encontrado** en **Añadir miembro**                             | Ninguna cuenta que puedas ver tiene esta dirección. Usa **Enviar invitación en su lugar**.                                                                                                                                                                                                                          |
| El cliente no recibe ningún correo                                          | El módulo `notify` está desactivado o falló el envío del correo. Envía tú el enlace o el token; revisa [notificaciones](help:notifications).                                                                                                                                                                        |
| El enlace abre una página de «no encontrado» o una página de la API         | Studio se ejecuta en su propia dirección y ni el ajuste del servidor `notify.invitation_accept_url` ni el ajuste de producto `invitation_accept_url` apuntan a ella (consulta [la entrega](help:tutorial-onboard-customer#delivery)). Mientras tanto, envía el token y pide que lo peguen en `/invitations/accept`. |
| Al aceptar aparece **Invitación para otra dirección de correo electrónico** | La persona ha iniciado sesión con una cuenta cuyo correo no coincide con la dirección invitada. Elige **Cerrar sesión y usar la dirección invitada** o invita a la dirección correcta.                                                                                                                              |
| Al aceptar aparece **Esta invitación no se puede usar**                     | La invitación ya se aceptó, se revocó o tiene más de 7 días, o el token está incompleto. Crea una invitación nueva.                                                                                                                                                                                                 |
| El inicio de sesión único falla con «no account»                            | No hay ninguna invitación abierta para la dirección verificada y el registro está desactivado. Comprueba la dirección invitada; consulta [inicio de sesión](help:signing-in#sso-errors).                                                                                                                            |
| La integración recibe `403`                                                 | A la clave le falta un permiso, o el inquilino está suspendido.                                                                                                                                                                                                                                                     |
| No hay eventos en el registro de auditoría                                  | Comprueba el filtro **Producto** y que tengas `audit:read`.                                                                                                                                                                                                                                                         |

---
title: Registro de auditoría
summary: Averigua quién hizo qué y cuándo en el servidor, filtra el registro, comparte una vista filtrada y lee todos los detalles de un evento.
keywords: auditoría, pista de auditoría, historial, registro de actividad, quién cambió, registro de eventos, cumplimiento normativo, ID de solicitud, denegado, intentos de inicio de sesión
---

El **Registro de auditoría** guarda las acciones administrativas y relevantes para la seguridad en
el servidor de Axentra: quién actuó (un usuario, una clave de API o el sistema), qué hizo, sobre qué
objeto, con qué resultado y cuándo. Úsalo para responder a preguntas como «¿quién revocó esta clave
de API?», «¿por qué este usuario ya no puede iniciar sesión?» o «¿qué pasó durante la solicitud con
este ID de solicitud?».

El servidor escribe los eventos por sí mismo. Studio solo los lee: nadie puede editar ni eliminar
un evento de auditoría, ni siquiera un administrador de la plataforma.

> [!IMPORTANT]
> El módulo de auditoría está siempre activado. Para leer los eventos de un producto necesitas el
> permiso `audit:read` en ese producto (lo tienen todos los roles de producto integrados:
> **Product owner**, **Product admin**, **Support** y **Product viewer**). Los eventos de toda la instalación, incluidos los que no pertenecen a ningún
> producto, requieren `platform:audit` (roles de plataforma `platform_admin` y `platform_viewer`).
> Los roles de inquilino no pueden leer el registro de auditoría.

## Quién ve qué eventos {#who-sees-what}

| Tienes                                            | Studio muestra                                                                                                       | Filtro de producto                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `platform:audit`                                  | Todos los eventos de la instalación, incluidos inicios de sesión, configuración inicial y otros eventos sin producto | **Todos los productos** (predeterminado) o un producto     |
| `audit:read` en un producto, sin `platform:audit` | Solo los eventos de un producto; Studio empieza con el último producto que usaste                                    | Uno de tus productos; no se ofrece **Todos los productos** |
| Ninguno de los dos                                | **Registro de auditoría** no aparece en la barra lateral; un enlace directo muestra **No permitido**                 | –                                                          |

El servidor comprueba el permiso en cada solicitud. Si seleccionas un producto que no puedes leer,
obtienes **No permitido**, y un evento que no puedes leer no se puede abrir en detalle (consulta
[Solución de problemas](#troubleshooting)).

> [!NOTE]
> Los eventos sin producto, como `identity.login`, `identity.logout` o `identity.setup.complete`,
> solo son visibles con `platform:audit`.

## Abrir el registro de auditoría {#open}

1. En la barra lateral, abre **Auditoría y monitorización** › **Registro de auditoría**
   ([abrir](app:audit)).
2. Los eventos más recientes aparecen primero. Desplázate hasta el final de la tabla para cargar
   más.

Cada fila muestra **Hora**, **Acción**, **Actor**, **Objetivo** y **Resultado**. En un teléfono solo
se muestran **Hora** y **Acción**; abre los detalles para ver el resto.

## Filtrar eventos {#filter}

1. Escribe una palabra en **Buscar**. En una pantalla estrecha, elige **Más filtros** para ver los
   demás campos; el número entre paréntesis indica cuántos filtros están activos.
2. Rellena cualquiera de los demás filtros. Todos los filtros se combinan (un evento debe cumplirlos
   todos).
3. Elige **Aplicar filtros**. Studio solo carga resultados nuevos cuando aplicas los filtros.
4. Para empezar de nuevo, elige **Restablecer filtros**.

| Filtro                | Qué busca                                                                                                 | Ejemplo                              |
| --------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Buscar**            | Parte de la acción, el ID del objetivo, el nombre del actor o el ID del actor (sin distinguir mayúsculas) | `acme`, `api_key`                    |
| **Producto**          | Eventos de un producto                                                                                    | –                                    |
| **ID del inquilino**  | Eventos de un inquilino (ID exacto)                                                                       | `ten_01EXAMPLE`                      |
| **Acción**            | El nombre exacto de la acción, o un prefijo si termina en `*`                                             | `access.api_key.revoke`, `tenancy.*` |
| **ID del actor**      | Eventos de un usuario o una clave de API (ID exacto)                                                      | `usr_01EXAMPLE`, `key_01EXAMPLE`     |
| **Resultado**         | **Éxito**, **Denegado** o **Fallo**                                                                       | –                                    |
| **Desde** / **Hasta** | Intervalo de tiempo en tu hora local. **Desde** se incluye, **Hasta** no                                  | –                                    |

El servidor acepta como máximo 100 caracteres en **Acción** y 200 en **Buscar**.

### Compartir una vista filtrada {#share}

Los filtros aplicados forman parte de la dirección de la página, por ejemplo
`/audit?actor_id=usr_01EXAMPLE&outcome=denied`. Copia la dirección del navegador para compartir o
guardar en marcadores exactamente esta vista. Quien la reciba solo verá los eventos que permitan sus
propios permisos.

## Leer los detalles de un evento {#event-detail}

1. Elige el botón de detalles al final de una fila (**Mostrar detalles de …**).
2. Se abre un panel lateral con todos los campos del evento y sus **Detalles**.

| Campo                                            | Significado                                                                                                                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID del evento**                                | ID del evento de auditoría (`aud_…`)                                                                                                                                                                  |
| **Hora**                                         | Cuándo registró el servidor el evento                                                                                                                                                                 |
| **Acción**                                       | Qué pasó, en la forma `module.object.verb`                                                                                                                                                            |
| **Actor** / **Tipo de actor** / **ID del actor** | Quién actuó. Tipos: `user`, `api_key`, `system` (el propio servidor, por ejemplo una tarea programada) y `anonymous` (no había nadie con sesión iniciada, por ejemplo en un inicio de sesión fallido) |
| **Producto** / **Inquilino**                     | Dónde ocurrió; vacío en los eventos de toda la instalación                                                                                                                                            |
| **Objetivo**                                     | El objeto sobre el que se actuó: tipo e ID (por ejemplo `api_key · key_01EXAMPLE`)                                                                                                                    |
| **Resultado**                                    | Consulta [Resultados](#outcomes)                                                                                                                                                                      |
| **ID de solicitud**                              | El `X-Request-ID` de la solicitud HTTP que causó el evento                                                                                                                                            |
| **Dirección IP**                                 | La dirección del cliente tal como la ve el servidor (detrás de un proxy, solo si el proxy es de confianza)                                                                                            |
| **Detalles**                                     | Datos adicionales en JSON, por ejemplo los campos modificados o el motivo de un rechazo                                                                                                               |

> [!NOTE]
> El servidor elimina los secretos (contraseñas, tokens, claves) de los detalles antes de
> guardarlos. Nunca encontrarás un secreto en el registro de auditoría.

### Resultados {#outcomes}

| Resultado    | Significado                                                                                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Éxito**    | La acción se llevó a cabo.                                                                                                                                                                                            |
| **Denegado** | El servidor rechazó la acción, por ejemplo un inicio de sesión con una contraseña incorrecta, un cambio de contraseña con una contraseña actual incorrecta o una primera contraseña sin un inicio de sesión reciente. |
| **Fallo**    | Se intentó la acción, pero no tuvo éxito.                                                                                                                                                                             |

Una solicitud rechazada por falta de permisos normalmente **no** se registra: el cliente solo
recibe `403`. Busca eventos **Denegado** sobre todo en torno al inicio de sesión y las contraseñas.

## Rastrear una solicitud por su ID {#request-id}

Cada mensaje de error de Studio muestra un **ID de solicitud** en **Detalles técnicos**. Para
averiguar qué cambió esa solicitud:

1. Copia el ID de solicitud del mensaje de error.
2. La búsqueda de auditoría no incluye los ID de solicitud. Acota la lista con **Desde** / **Hasta**
   (y el **ID del actor**, si lo conoces), abre los eventos candidatos y compara su **ID de
   solicitud**.
3. Si ningún evento coincide, la solicitud no cambió nada que se audite. Da el ID de solicitud a tu
   operador: los registros del servidor llevan el mismo ID.

Consulta [ID de solicitud](help:api-basics#request-ids) para saber cómo funcionan.

## Qué se registra {#what-is-recorded}

Las acciones se llaman `module.object.verb`. Ejemplos típicos:

| Área                             | Acciones                                                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inicio de sesión y cuentas       | `identity.login`, `identity.logout`, `identity.password.change`, `identity.session.revoke`, `identity.session.revoke_all`, `identity.platform_role.set`, `identity.setup.complete` |
| Productos, inquilinos, miembros  | `tenancy.product.create`, `tenancy.tenant.create`, `tenancy.tenant.update`, `tenancy.member.set`, `tenancy.invitation.create`, `tenancy.invitation.accept`                         |
| Acceso                           | `access.role.create`, `access.api_key.create`, `access.api_key.rotate`, `access.api_key.revoke`                                                                                    |
| Datos y archivos                 | `data.record.delete`, `storage.file.upload`, `storage.file.delete`, `storage.policy.update`                                                                                        |
| Eventos y tareas                 | `events.job.enqueue`, `events.job.cancel`, `events.schedule.update`, `events.webhook.rotate_secret`                                                                                |
| Uso, facturación, notificaciones | `usage.quota.set`, `billing.plan.update`, `notify.template.update`, `notify.message.enqueue`                                                                                       |

No todo es un evento de auditoría: las lecturas no se registran, y tampoco crear o modificar un
registro (eliminarlo sí). Los backends de producto construidos sobre Axentra pueden añadir sus
propias acciones.

## Retención {#retention}

Los eventos de auditoría se conservan durante `observability.audit_retention_days` (365 días por
defecto). Solo se eliminan cuando el operador ejecuta la tarea de mantenimiento
`axentra maintenance purge`. Hasta que se ejecuta esa tarea, los eventos más antiguos siguen
visibles. El valor configurado aparece en **Mantenimiento y retención** en la página
[Monitorización](help:health-monitoring#retention).

## Conviene saber {#good-to-know}

- La lista está ordenada por hora, los más recientes primero; no puedes cambiar el orden.
- Las horas se muestran en la zona horaria de tu navegador; la API guarda y filtra en UTC.
- Studio no tiene exportación. Los desarrolladores pueden leer el registro con la API
  (`GET /v1/audit`, paginación por cursor) o los SDK (`audit.list`, `audit.iter`); consulta
  [Conceptos básicos de la API](help:api-basics#pagination).

## Solución de problemas {#troubleshooting}

- **No permitido** al abrir la página: no tienes `audit:read` en el producto seleccionado. Elige un producto en el que tengas un rol de producto, o pide acceso a un propietario del producto o a un administrador de la plataforma.
- **No hay eventos coincidentes**: los filtros son demasiado restrictivos. Comprueba que **Acción** esté escrita exactamente (las acciones son `tenancy.tenant.create`, no `tenant.created`) o termínala con `*`, amplía **Desde** / **Hasta** o elige **Restablecer filtros**.
- **Aún no hay eventos de auditoría** aunque hubo cambios: estás viendo un producto, pero el cambio afectó a toda la instalación (por ejemplo, un inicio de sesión). Esos eventos requieren `platform:audit`. Comprueba también que la acción sea de las que se registran (consulta [Qué se registra](#what-is-recorded)).
- **No se pudo cargar el evento completo** (en el panel de detalles): la tarea de retención eliminó el evento, o pertenece a un producto (o a ningún producto) que no puedes leer. El servidor responde `404` en ambos casos, así que no revela si el evento existe. En su lugar, Studio muestra los valores de la lista.
- **Revisa los datos introducidos**: se rechazó un valor de filtro, por ejemplo una **Acción** de más de 100 caracteres o un texto en **Buscar** de más de 200 caracteres.

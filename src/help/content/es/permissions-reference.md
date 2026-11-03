---
title: Referencia de permisos
summary: Todos los permisos integrados de Axentra, qué roles integrados los tienen y qué te permiten hacer en Studio.
keywords: permiso, lista de permisos, catálogo, matriz de roles, ámbito, plataforma, producto, inquilino, lectura, gestión, derechos de acceso, roles integrados, propietario, administrador, observador, soporte, miembro
---

Un _permiso_ es un derecho concreto escrito como `resource:action`, por ejemplo `files:write`. El
acceso se deniega salvo que un rol o una clave de API conceda el permiso de forma explícita. Esta
página lista todos los permisos integrados, muestra qué rol integrado tiene cada uno e indica qué
desbloquea en Studio. Para saber cómo se crean y asignan los roles, consulta
[Roles y permisos](help:roles-permissions).

## Cómo funcionan los permisos {#how-permissions-work}

Cada permiso tiene un **ámbito**:

- **Plataforma**: toda la instalación. Solo lo conceden los roles de plataforma **Administrador de
  la plataforma** y **Observador de la plataforma**, nunca los roles de producto o de inquilino y
  nunca las claves de API.
- **Producto**: un producto en su conjunto (sus inquilinos, roles, claves, tareas, planes …).
- **Inquilino**: los datos dentro de un inquilino (registros, archivos, miembros …).

Quién tiene qué:

- Un **rol de inquilino** concede permisos de inquilino **solo en ese inquilino**.
- Un **rol de producto** concede permisos de producto y permisos de inquilino **en todos los
  inquilinos del producto**.
- Un **rol de plataforma** concede sus permisos en todos los productos.
- Quien solo es miembro de un inquilino recibe igualmente `product:read` para el producto, para
  poder abrirlo y elegir su inquilino, y nada más a nivel de producto.
- Una **clave de API** tiene exactamente los permisos que figuran en ella, en su producto (y, si
  está vinculada, solo en su inquilino).

Studio oculta los botones, pestañas y diálogos que tus permisos no permiten. Las áreas de la barra
lateral siguen visibles; si te falta el permiso de lectura, la página muestra **No permitido** con
el permiso que falta (consulta [solución de problemas](help:troubleshooting#forbidden)).

> [!TIP]
> En Studio, abre [Permisos](app:permissions) para ver el catálogo completo de tu producto,
> incluidos los permisos que declaró el propio producto, con las descripciones del servidor.

## Permisos de plataforma {#platform-permissions}

| Permiso             | Descripción del servidor (en inglés)    | Qué permite en Studio                                                                                                                                                                                                             |
| ------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `products:create`   | Create products (multi-product mode)    | **Nuevo producto** en la página Productos (solo en el modo de varios productos)                                                                                                                                                   |
| `products:archive`  | Archive and restore products            | Archivar y restaurar en la página del producto (solo en el modo de varios productos)                                                                                                                                              |
| `users:read`        | List all users of the installation      | Abrir la página de detalle de cualquier usuario, también fuera de tus productos; listar todos los usuarios mediante la API                                                                                                        |
| `users:manage`      | Disable users and revoke their sessions | **Desactivar usuario** / **Activar usuario** y **Cerrar sesión en todas partes** en la página de un usuario, y su lista **Sesiones activas**. Cambiar un **Rol de plataforma** requiere además ser administrador de la plataforma |
| `platform:settings` | Read installation settings              | La página [Configuración](app:settings); el estado del proveedor de facturación y la configuración de almacenamiento que se muestran en las páginas de producto                                                                   |
| `platform:audit`    | Read installation-wide audit events     | El [Registro de auditoría](app:audit) de todos los productos, incluidos eventos de plataforma como los inicios de sesión                                                                                                          |

## Permisos de producto {#product-permissions}

| Permiso                  | Descripción del servidor (en inglés)                                     | Qué permite en Studio                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product:read`           | View the product and its overview                                        | Abrir el producto y su panel                                                                                                                                                                                                  |
| `product:manage`         | Edit product details and settings                                        | Editar el nombre, la descripción y la configuración en la página del producto (incluida la política de almacenamiento); también permite leer la página [Configuración](app:settings) y el estado del proveedor de facturación |
| `product_members:read`   | View product operators                                                   | La pestaña **Miembros** de la página del producto                                                                                                                                                                             |
| `product_members:manage` | Add, change and remove product operators                                 | Añadir, cambiar y quitar miembros del producto (dentro del [techo de roles](help:security#role-ceiling))                                                                                                                      |
| `permissions:manage`     | Declare and retire the product's own permissions over the API            | Nada que pulsar en Studio (la página Permisos es de solo lectura); permite leer el catálogo de permisos. La declaración está disponible a través de la API                                                                    |
| `product_users:read`     | View users who belong to the product's tenants                           | La página [Usuarios](app:users) del producto y las páginas de detalle de usuarios                                                                                                                                             |
| `tenants:read`           | List tenants                                                             | La lista de [Inquilinos](app:tenants) y las páginas de inquilinos; los selectores de inquilino en otras áreas                                                                                                                 |
| `tenants:create`         | Create tenants                                                           | **Nuevo inquilino** (página Inquilinos y panel)                                                                                                                                                                               |
| `tenants:update`         | Edit and suspend tenants                                                 | Editar, suspender y reactivar un inquilino; establecer la cuota de almacenamiento de un inquilino                                                                                                                             |
| `tenants:delete`         | Delete tenants and all their data                                        | Eliminar un inquilino (irreversible)                                                                                                                                                                                          |
| `roles:read`             | View roles                                                               | La página [Roles](app:roles) y el catálogo de permisos; permite a Studio mostrar qué roles puedes asignar                                                                                                                     |
| `roles:manage`           | Create, edit and delete custom roles                                     | **Nuevo rol personalizado**, editar y eliminar roles personalizados                                                                                                                                                           |
| `api_keys:read`          | View API keys (never their secrets)                                      | La lista de [Claves de API](app:apiKeys) y el catálogo de permisos                                                                                                                                                            |
| `api_keys:manage`        | Create, rotate and revoke API keys                                       | **Nueva clave de API**, **Rotar secreto**, **Revocar clave**                                                                                                                                                                  |
| `audit:read`             | Read the product's audit events                                          | El [Registro de auditoría](app:audit) de este producto                                                                                                                                                                        |
| `collections:read`       | View record collection statistics                                        | Estadísticas de colecciones en el [Resumen de datos](app:dataOverview)                                                                                                                                                        |
| `jobs:read`              | View background jobs and events                                          | [Tareas](app:jobs), [Programaciones](app:schedules), [Eventos](app:events), incluida la vista en directo                                                                                                                      |
| `jobs:manage`            | Enqueue, retry and cancel jobs                                           | **Poner tarea en cola**, reintentar y cancelar tareas; crear, editar y eliminar programaciones                                                                                                                                |
| `webhooks:read`          | View webhooks and deliveries                                             | [Webhooks](app:webhooks) y sus entregas                                                                                                                                                                                       |
| `webhooks:manage`        | Create, edit and delete webhooks                                         | Crear, editar y eliminar webhooks; rotar el secreto de firma, enviar una prueba, volver a entregar                                                                                                                            |
| `usage:manage`           | Define meters and quotas                                                 | Crear y editar medidores; establecer cuotas de uso de los inquilinos                                                                                                                                                          |
| `billing:manage`         | Manage plans, prices and subscriptions                                   | Crear y editar planes; crear y cambiar suscripciones de inquilinos                                                                                                                                                            |
| `notify:manage`          | Manage notification templates and send tests                             | [Notificaciones](app:notifications): plantillas, historial de mensajes, estadísticas, el buzón local                                                                                                                          |
| `notify:send_external`   | Send notifications to email addresses that are not members of the tenant | Enviar una prueba a cualquier dirección de correo electrónico, no solo a miembros del inquilino                                                                                                                               |

## Permisos de inquilino {#tenant-permissions}

Cuando un rol de producto tiene un permiso de inquilino, este se aplica en todos los inquilinos del
producto.

| Permiso              | Descripción del servidor (en inglés)                           | Qué permite en Studio                                                                                                                    |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant:read`        | View the tenant                                                | Abrir el inquilino al que perteneces                                                                                                     |
| `members:read`       | View tenant members and invitations                            | Las pestañas **Miembros** e **Invitaciones** de un inquilino; la página [Invitaciones](app:invitations)                                  |
| `members:manage`     | Invite, change and remove tenant members                       | Añadir miembros, invitar, cambiar roles, quitar miembros, revocar invitaciones (dentro del [techo de roles](help:security#role-ceiling)) |
| `records:read`       | Read records                                                   | [Registros](app:records) del inquilino                                                                                                   |
| `records:write`      | Create, change and delete records                              | Crear, editar y eliminar registros                                                                                                       |
| `files:read`         | List and download files                                        | [Archivos](app:files) del inquilino, descarga                                                                                            |
| `files:write`        | Upload and delete files                                        | Subir, editar y eliminar archivos                                                                                                        |
| `events:publish`     | Publish events and enqueue jobs for the tenant                 | **Publicar evento** en la página Eventos                                                                                                 |
| `usage:read`         | View usage and quotas                                          | [Uso](app:usage) del inquilino, cuotas, widgets de uso en el panel                                                                       |
| `usage:record`       | Record usage                                                   | Registrar uso y confirmar o liberar reservas de un inquilino                                                                             |
| `billing:read`       | View subscription and entitlements                             | [Planes](app:plans), [Suscripciones](app:subscriptions) y la facturación de un inquilino                                                 |
| `notify:send`        | Send notifications                                             | Enviar notificaciones de prueba a miembros del inquilino; ver los mensajes del inquilino                                                 |
| `notify:preferences` | Manage notification preferences                                | Tus propias preferencias de notificación para un inquilino                                                                               |
| `search:query`       | Search the tenant's search index                               | [Búsqueda](app:search) en el inquilino                                                                                                   |
| `search:index`       | Add, replace and remove documents in the tenant's search index | **Quitar del índice** en la pantalla [Búsqueda](app:search)                                                                              |

## Roles integrados {#built-in-roles}

| Rol (clave)                                           | Nivel      | Finalidad                                                                                                            |
| ----------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| **Administrador de la plataforma** (`platform_admin`) | Plataforma | Todos los permisos en todas partes; exento del techo de roles                                                        |
| **Observador de la plataforma** (`platform_viewer`)   | Plataforma | Todos los permisos de lectura, además de `platform:settings`, `platform:audit` y `search:query`                      |
| **Product owner** (`product_owner`)                   | Producto   | Control total del producto, incluidos los operadores y el rango de propietario                                       |
| **Product admin** (`product_admin`)                   | Producto   | Todo salvo gestionar operadores de producto y declarar permisos del producto                                         |
| **Support** (`product_support`)                       | Producto   | Lo lee todo y gestiona miembros de inquilinos hasta el límite de sus propios permisos (en la práctica: observadores) |
| **Product viewer** (`product_viewer`)                 | Producto   | Acceso de solo lectura al producto                                                                                   |
| **Owner** (`tenant_owner`)                            | Inquilino  | Todos los permisos de inquilino, además del rango de propietario                                                     |
| **Admin** (`tenant_admin`)                            | Inquilino  | Todos los permisos de inquilino, sin rango de propietario                                                            |
| **Member** (`member`)                                 | Inquilino  | Trabaja con los datos del inquilino                                                                                  |
| **Viewer** (`viewer`)                                 | Inquilino  | Acceso de solo lectura al inquilino                                                                                  |

## Matriz de roles {#role-matrix}

✓ = el rol tiene el permiso. Abreviaturas: **AP** Administrador de la plataforma, **OP** Observador
de la plataforma, **PP** Product owner, **AdP** Product admin, **Sop** Support, **ObP**
Product viewer, **PI** Owner (inquilino), **AI** Admin (inquilino), **M** Member, **O** Viewer.

| Permiso                  | AP  | OP  | PP  | AdP | Sop | ObP | PI  | AI  | M   | O   |
| ------------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `products:create`        | ✓   |     |     |     |     |     |     |     |     |     |
| `products:archive`       | ✓   |     |     |     |     |     |     |     |     |     |
| `users:read`             | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `users:manage`           | ✓   |     |     |     |     |     |     |     |     |     |
| `platform:settings`      | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `platform:audit`         | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `product:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `product_members:read`   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product_members:manage` | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `permissions:manage`     | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `product_users:read`     | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:create`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:update`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:delete`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `roles:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `roles:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `api_keys:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `api_keys:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `audit:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `collections:read`       | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:read`              | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:manage`            | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `webhooks:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `webhooks:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `usage:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `billing:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:manage`          | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:send_external`   | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenant:read`            | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:manage`         | ✓   |     | ✓   | ✓   | ✓   |     | ✓   | ✓   |     |     |
| `records:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `records:write`          | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `files:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `files:write`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `events:publish`         | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `usage:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `usage:record`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `billing:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `notify:send`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `notify:preferences`     | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `search:query`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `search:index`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   |     |     |

> [!NOTE]
> El **Owner** y el **Admin** de un inquilino tienen los mismos permisos. La
> diferencia es el rango de propietario: solo un propietario (o un operador de producto o un
> administrador de la plataforma) puede hacer propietario a alguien, o cambiar o quitar a un
> propietario. Consulta [techo de roles](help:security#role-ceiling).

## Permisos que declara el propio producto {#product-defined}

Además del catálogo integrado, un producto puede declarar sus propios permisos, con nombres
`<namespace>.<resource>:<action>`, por ejemplo `crm.deals:approve`. Aparecen en la página
[Permisos](app:permissions) en **Permisos del producto**, y puedes concederlos en roles
personalizados y claves de API igual que los integrados.

- **Product owner**, **Product admin** y **Administrador de la plataforma** los tienen todos;
  el **Owner** y el **Admin** de un inquilino tienen
  los de ámbito de inquilino.
- **Product viewer**, **Support** y **Observador de la plataforma** tienen los de solo
  lectura.
- **Member** y **Viewer** solo tienen los que el producto les asigna (columna **También
  concedido a**).
- Un permiso _retirado_ ya no tiene ningún efecto, aunque siga apareciendo en una lista.

## Claves de API y permisos {#api-keys}

Una [clave de API](help:api-keys) solo tiene los permisos seleccionados al crearla, y solo en su
producto (y en su inquilino, si está vinculada). Solo puedes dar a una clave permisos que tú tengas a
nivel de producto. Los permisos de plataforma nunca están disponibles para las claves.

## Solución de problemas {#troubleshooting}

| Situación                                                                  | Qué hacer                                                                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **No permitido** con `missing permission …`                                | Busca el permiso más arriba y pide un rol que lo tenga.                                                                                                |
| Un miembro de un inquilino ve el producto, pero ninguna página de producto | Es lo esperado: los miembros de inquilino solo reciben `product:read` a nivel de producto. Trabajan en su inquilino.                                   |
| No se puede seleccionar un rol (**«… (por encima de tus permisos)»**)      | El rol tiene permisos que te faltan, o es un rol de propietario. Consulta [techo de roles](help:security#role-ceiling).                                |
| Falta un permiso en el editor de roles                                     | Los roles de inquilino solo ofrecen permisos de inquilino; los permisos de plataforma nunca se ofrecen; los permisos de producto retirados se ocultan. |
| El campo de rol es un simple cuadro de texto                               | No puedes leer los roles (`roles:read`); Studio no puede listarlos. Escribe la clave del rol; el servidor la comprueba.                                |

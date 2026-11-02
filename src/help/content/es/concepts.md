---
title: Conceptos clave
summary: Los componentes básicos de Axentra explicados con sencillez, desde la plataforma y el producto hasta el inquilino, el rol, el permiso y la clave de API.
keywords: términos, terminología, conceptos básicos, modelo, jerarquía, plataforma, producto, inquilino, tenant, cliente, organización, usuario, miembro, operador, invitación, rol, permiso, módulo, clave de API, producto único, multiproducto, modo
---

Este artículo explica los términos que encontrarás por todo Studio y cómo encajan entre sí. Léelo
una vez antes de empezar; el [glosario](help:glossary) contiene definiciones breves para consultar
más adelante.

```diagram
hierarchy
```

## Plataforma (instalación) {#platform}

La **plataforma** es un servidor Axentra con su base de datos. Las cuentas de usuario existen una
sola vez por plataforma y pueden pertenecer a varios productos. Las páginas de toda la plataforma en
Studio son **Productos**, **Registro de auditoría**, **Estado del sistema**, **Monitorización** y
**Configuración**.

### Roles de plataforma {#platform-roles}

Un usuario puede tener un rol de plataforma, que se aplica a **todos los productos** del servidor:

| Rol de plataforma                                 | Qué permite                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Administrador de la plataforma (`platform_admin`) | Control total de la instalación: crear y archivar productos, gestionar a todos los usuarios y sus roles de plataforma, leerlo todo. |
| Observador de la plataforma (`platform_viewer`)   | Acceso de lectura a toda la instalación.                                                                                            |

El primer administrador de la plataforma se crea durante la
[configuración inicial](help:first-run-setup). Los demás roles de plataforma se asignan en la página
de un usuario (consulta [usuarios](help:users)). El último administrador de la plataforma no se
puede desactivar ni perder el rol.

## Producto {#product}

Un **producto** es una aplicación que se ejecuta en la plataforma, por ejemplo «Example CRM». Cada
producto tiene sus propios inquilinos, roles, claves de API, datos, planes y plantillas, aislados de
todos los demás productos. La mayoría de las páginas de Studio pertenecen a un producto; la dirección
empieza entonces por `/p/<product id>/` y el
[selector de producto](help:interface#product-switcher) muestra de cuál se trata.

Las personas que gestionan un producto en su conjunto son los **operadores de producto**. Tienen un
rol de producto:

| Rol de producto integrado                  | En resumen                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Product owner (propietario del producto)   | Control total del producto. Quien crea un producto se convierte en su propietario.                                       |
| Product admin (administrador del producto) | Gestiona inquilinos, roles, claves y datos; no puede gestionar operadores de producto ni declarar permisos del producto. |
| Support (soporte)                          | Lee todo el contenido del producto y gestiona los miembros de los inquilinos hasta el límite de sus propios permisos.    |
| Product viewer (observador del producto)   | Acceso de solo lectura al producto.                                                                                      |

Un rol de producto que contiene permisos de inquilino los concede en **todos** los inquilinos del
producto. Consulta [productos](help:products).

## Inquilino {#tenant}

Un **inquilino** es un cliente u organización dentro de un producto, por ejemplo «Acme Ltd». Los
datos de distintos inquilinos están estrictamente separados, también dentro de la base de datos
(seguridad a nivel de fila). Un inquilino está **activo** o **suspendido**; suspenderlo bloquea a
sus miembros y sus claves de API vinculadas al inquilino sin eliminar datos. Consulta
[inquilinos](help:tenants).

## Usuario {#user}

Un **usuario** es una persona con una cuenta en la plataforma, normalmente identificada por una
dirección de correo electrónico. La misma cuenta puede ser miembro de varios inquilinos y operador de
varios productos. Un usuario puede estar **activo** o **desactivado**; desactivarlo cierra todas sus
sesiones de inmediato.

Las cuentas no se crean en Studio. Provienen de la [configuración inicial](help:first-run-setup), de
un inicio de sesión mediante [inicio de sesión único](help:signing-in#sso) o del propio código de tu
producto (Axentra usado como biblioteca). Consulta [usuarios](help:users).

## Miembro {#member}

Un **miembro** es un usuario con un **rol de inquilino** en un inquilino. La membresía es lo que da
a una persona acceso a los datos de un inquilino. Roles de inquilino integrados:

| Rol de inquilino integrado | En resumen                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Owner (propietario)        | Control total del inquilino.                                                       |
| Admin (administrador)      | Gestiona los miembros y los datos del inquilino.                                   |
| Member (miembro)           | Trabaja con los datos del inquilino. Es el rol predeterminado de las invitaciones. |
| Viewer (observador)        | Acceso de solo lectura al inquilino.                                               |

No confundas a los miembros de un inquilino con los **operadores de producto** (miembros del
producto), que tienen un rol de producto. Consulta
[miembros e invitaciones](help:members-invitations).

## Invitación {#invitation}

Una **invitación** pide a una persona, mediante su dirección de correo electrónico, que se una a un
inquilino con un rol determinado. Contiene un token de un solo uso, es válida durante 7 días y se
puede revocar. La persona invitada la acepta con la sesión iniciada en una cuenta que tenga **la
misma dirección de correo electrónico**. No existen invitaciones para operadores de producto.
Consulta [miembros e invitaciones](help:members-invitations).

## Rol {#role}

Un **rol** es un conjunto de permisos con nombre. Axentra incluye roles integrados (los anteriores)
que no se pueden modificar. Un producto puede añadir **roles personalizados** con un **ámbito**:

- Ámbito **Inquilino**: se asigna a miembros de inquilinos y solo contiene permisos de inquilino.
- Ámbito **Producto**: se asigna a operadores de producto y puede contener permisos de producto y
  de inquilino.

Consulta [roles y permisos](help:roles-permissions).

## Permiso {#permission}

Un **permiso** es un derecho individual escrito como `resource:action`, por ejemplo `tenants:create`
o `records:write`. El acceso se deniega salvo que un rol o una clave de API conceda el permiso de
forma explícita. Cada permiso tiene un ámbito:

| Ámbito     | Significado                                                                                     | Ejemplos                                            |
| ---------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Plataforma | Abarca toda la instalación; solo los conceden los roles de plataforma, nunca las claves de API. | `products:create`, `users:manage`                   |
| Producto   | Se refiere a un producto en su conjunto.                                                        | `tenants:create`, `api_keys:manage`, `roles:manage` |
| Inquilino  | Se refiere a los datos de un inquilino.                                                         | `members:manage`, `records:read`, `files:write`     |

Los productos también pueden declarar sus **propios permisos**, con un espacio de nombres y un
punto, por ejemplo `crm.deals:approve`. La lista completa está en la
[referencia de permisos](help:permissions-reference).

### Techo de roles {#role-ceiling}

Poder gestionar miembros no significa que puedas asignar cualquier rol. Solo puedes asignar un rol
si tú mismo tienes **todos los permisos de ese rol**; los roles de propietario requieren además
rango de propietario. Los administradores de la plataforma están exentos. Studio marca como no
seleccionables los roles que están por encima de tu nivel. La misma regla se aplica a las claves de
API: una clave solo puede recibir permisos que tú tengas.

## Módulo {#modules}

Un **módulo** es un bloque funcional del servidor que el operador activa o desactiva en la
configuración del servidor. `identity`, `tenancy`, `access`, `data` y `audit` están siempre
habilitados. Entre los módulos opcionales están `storage` (archivos), `events` (tareas,
programaciones, eventos, webhooks), `usage`, `billing` y `notify` (notificaciones).

En Studio, una entrada de la barra lateral cuyo módulo no está habilitado sigue visible y muestra
**Inactivo**. Al abrirla aparece **Módulo no habilitado en este servidor** junto con el id del
módulo que el operador debe habilitar. La tarjeta **Servidor** del panel enumera todos los módulos y
su estado. Consulta la [referencia de módulos](help:modules-reference).

## Clave de API {#api-key}

Una **clave de API** permite que una máquina (el backend de tu producto, una integración, un script)
llame a la API sin un usuario. Cada clave pertenece exactamente a un producto, tiene una lista
explícita de permisos y opcionalmente puede estar vinculada a un inquilino. Su secreto se muestra
**una sola vez**; Axentra solo almacena un hash. Consulta [claves de API](help:api-keys).

## Registros y archivos {#records-files}

- Los **registros** son documentos JSON almacenados en colecciones con nombre dentro de un
  inquilino, por ejemplo una colección `contacts`. Consulta [registros](help:records) y el
  [resumen de datos](help:data-overview).
- Los **archivos** son objetos binarios subidos (documentos, imágenes) con metadatos, almacenados
  por inquilino (módulo `storage`). Consulta [archivos](help:files).

## Eventos y tareas {#events-jobs}

Con el módulo `events`, Axentra ejecuta trabajo en segundo plano e informa a otros sistemas de lo
que ha ocurrido:

- **Tareas**: unidades de trabajo en segundo plano con estado, reintentos y resultados. Consulta
  [tareas](help:jobs).
- **Programaciones**: tareas que se ejecutan según una programación cron. Consulta
  [programaciones](help:schedules).
- **Eventos**: constancia de cosas que han ocurrido, por ejemplo «se creó un contacto». Consulta
  [eventos](help:events).
- **Webhooks**: llamadas HTTP que entregan eventos a tus endpoints, firmadas con un secreto.
  Consulta [webhooks](help:webhooks).

## Uso y facturación {#usage-billing}

- **Uso** (módulo `usage`) contabiliza el consumo por inquilino con **medidores**, por ejemplo
  llamadas a la API o almacenamiento, y puede imponer **cuotas**. Consulta [uso](help:usage).
- **Facturación** (módulo `billing`) define **planes** con precios y prestaciones y los asigna a
  inquilinos como **suscripciones**. Studio nunca maneja datos de tarjetas. Consulta
  [planes y suscripciones](help:plans-subscriptions).

## Registro de auditoría {#audit-log}

Cada cambio, y cada intento rechazado, se escribe en el **registro de auditoría** en la misma
transacción que el cambio: quién (actor), qué (acción, por ejemplo `tenancy.tenant.create`), sobre
qué (objetivo), cuándo y con qué resultado (permitido o denegado). Consulta
[registro de auditoría](help:audit).

## Modo de producto único y multiproducto {#single-multi-product}

El servidor funciona en uno de dos **modos**, que establece el operador:

|                            | Producto único                                                                           | Multiproducto                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Productos                  | Exactamente uno, creado a partir de la configuración del servidor en el primer arranque. | Cualquier número, creados por administradores de la plataforma. |
| Crear o archivar productos | No es posible (`mode_not_supported`).                                                    | Con `products:create` y `products:archive`.                     |
| Selector de producto       | Una etiqueta fija **Producto** con el nombre del producto.                               | Un menú con tus productos.                                      |

Todo lo demás (inquilinos, roles, rutas de la API, permisos) funciona igual en ambos modos. Pasar de
producto único a multiproducto es un cambio de configuración sin migración de datos. La tarjeta
**Servidor** del panel muestra el **Modo** actual.

## ID de solicitud {#request-id}

Cada solicitud a la API recibe un **ID de solicitud** único. Studio lo muestra junto a los mensajes
de error; dáselo a tu operador, que podrá encontrar la entrada de log correspondiente y los eventos
de auditoría.

## Solución de problemas {#troubleshooting}

| Ves                                                | Significado y solución                                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No permitido**                                   | A tus roles les falta el permiso. Pide ayuda a alguien con un rol superior o consulta [roles y permisos](help:roles-permissions).                                   |
| Un rol aparece como «(por encima de tus permisos)» | El [techo de roles](help:concepts#role-ceiling) lo bloquea. Debe asignarlo alguien que tenga todos los permisos de ese rol.                                         |
| **No encontrado** para algo que existe             | Axentra responde «no encontrado» cuando no tienes ningún acceso, para no revelar qué existe. Comprueba que estás en el producto correcto y que tienes un rol en él. |
| **No disponible en este modo**                     | El servidor funciona en modo de producto único; no se pueden crear ni archivar productos.                                                                           |

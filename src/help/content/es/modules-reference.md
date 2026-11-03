---
title: Referencia de módulos
summary: Los módulos del servidor de Axentra, qué áreas de Studio hace posible cada uno y qué ves cuando un módulo está desactivado.
keywords: módulo, módulos, activado, desactivado, habilitado, inactivo, función, configuración del servidor, identity, tenancy, access, data, audit, storage, events, usage, billing, notify, search, realtime
---

El servidor de Axentra se compone de _módulos_: piezas como el almacenamiento de archivos, las
tareas en segundo plano o la facturación. Un operador decide en la configuración del servidor qué
módulos se ejecutan. Studio lee la lista de módulos activados al arrancar y se adapta: las áreas de
los módulos desactivados siguen en la barra lateral con la etiqueta **Inactivo**, para que veas qué
existe y qué tendría que activar un operador.

## ¿Qué módulos están activados? {#check-modules}

- El [Panel](app:dashboard) lista todos los módulos en **Módulos**, en la tarjeta del servidor; los
  módulos activados aparecen resaltados y los desactivados, en gris.
- La página [Configuración](app:settings) (con `platform:settings` o `product:manage`) muestra la
  configuración efectiva del servidor, incluida la lista de módulos.
- En la barra lateral, el área de un módulo desactivado lleva la etiqueta **Inactivo**; los lectores
  de pantalla anuncian «módulo no habilitado».

Por defecto, todos los módulos están activados. Cambiar la lista es un cambio en la configuración
del servidor (`modules`, consulta [configuración del servidor](help:server-configuration)); surte
efecto cuando se reinicia el servidor. Studio lee la lista una vez por carga de página, así que
recarga Studio después.

## Resumen de módulos {#overview}

| ID del módulo | Se puede desactivar | Áreas de Studio que hace posibles                                                                                                |
| ------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `identity`    | No                  | Inicio y cierre de sesión, [Perfil](help:profile), [Usuarios](help:users), sesiones                                              |
| `tenancy`     | No                  | [Productos](help:products), [Inquilinos](help:tenants), [miembros e invitaciones](help:members-invitations)                      |
| `access`      | No                  | [Roles](help:roles-permissions), [Permisos](help:permissions-reference), [Claves de API](help:api-keys)                          |
| `audit`       | No                  | [Registro de auditoría](help:audit)                                                                                              |
| `data`        | Sí                  | [Resumen de datos](help:data-overview), [Registros](help:records)                                                                |
| `storage`     | Sí                  | [Archivos](help:files), cuotas de almacenamiento de los inquilinos, la política de almacenamiento del producto                   |
| `events`      | Sí                  | [Tareas](help:jobs), [Programaciones](help:schedules), [Eventos](help:events) con la vista en directo, [Webhooks](help:webhooks) |
| `usage`       | Sí                  | [Uso](help:usage): medidores, uso por inquilino, cuotas, reservas                                                                |
| `billing`     | Sí                  | [Planes y suscripciones](help:plans-subscriptions), facturación de los inquilinos                                                |
| `notify`      | Sí                  | [Notificaciones](help:notifications): plantillas, historial de mensajes, buzón, preferencias                                     |
| `search`      | Sí                  | [Búsqueda](help:search): el índice de texto completo de un inquilino                                                             |
| `realtime`    | Sí                  | Se acepta en la configuración, pero no tiene efecto en esta versión                                                              |

[Estado del sistema](help:health-monitoring), Monitorización y [Configuración](help:settings) no
pertenecen a ningún módulo y están siempre disponibles.

## Qué pasa cuando un módulo está desactivado {#when-disabled}

Cuando un módulo está desactivado, el servidor no ofrece en absoluto su parte de la API. En Studio:

- La página del área muestra **Módulo no habilitado en este servidor** e indica el ID del módulo que
  hay que activar, por ejemplo `storage`. No se elimina nada: los datos guardados mientras el módulo
  estaba activado siguen en la base de datos y vuelven a aparecer cuando se activa de nuevo.
- Desaparecen los accesos directos y widgets que dependen del módulo, por ejemplo los widgets de uso
  y facturación del panel o el botón **Explorar registros** en la página de un inquilino.
- Una acción que aún llegue a un módulo desactivado responde
  [Módulo no habilitado](help:troubleshooting#module-disabled) o **No encontrado**.

Notas por módulo:

### data {#data}

**Resumen de datos** y **Registros** muestran el estado «no habilitado». Los productos que guardan
sus propios datos en sus propias tablas no se ven afectados.

### storage {#storage}

**Archivos** muestra el estado «no habilitado»; las cuotas de almacenamiento y la política de
almacenamiento no se pueden leer ni cambiar.

### events {#events}

**Tareas**, **Programaciones**, **Eventos** y **Webhooks** muestran el estado «no habilitado», y no
hay vista de eventos en directo. Dentro del servidor, otros módulos siguen usando la cola de tareas;
solo desaparecen las pantallas y la API correspondiente.

### usage y billing {#usage-billing}

Sin `usage`, **Uso** está inactivo y el panel no muestra widgets de uso. Sin `billing`, **Planes** y
**Suscripciones** están inactivos. Los límites de los planes solo alimentan las cuotas de uso cuando
**ambos** módulos están activados.

### notify {#notify}

**Notificaciones** muestra el estado «no habilitado». Las invitaciones siguen funcionando, pero el
servidor no envía correos de invitación: comparte el enlace o el token de invitación que Studio
muestra una sola vez tras crear la invitación (consulta
[Miembros e invitaciones](help:members-invitations)).

### search y realtime {#search-realtime}

Sin `search`, **Búsqueda** muestra «módulo no habilitado». Studio no tiene pantallas para `realtime`;
activarlo o desactivarlo no cambia nada en Studio.

## Aún no disponible en Studio {#not-in-studio}

Si un módulo está activado en el servidor, pero esta versión de Studio no tiene pantallas para él,
el área muestra **Aún no disponible en Studio**. Usa directamente la API o una versión más reciente
de Studio.

## Solución de problemas {#troubleshooting}

| Situación                                                                        | Qué hacer                                                                                                             |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Un área muestra **Inactivo**                                                     | Pide a un operador que añada el ID del módulo al ajuste `modules` del servidor y lo reinicie; después recarga Studio. |
| Un operador activó un módulo, pero Studio sigue mostrando **Inactivo**           | Recarga la página; Studio solo lee la lista de módulos al cargarse.                                                   |
| La configuración se niega a desactivar `identity`, `tenancy`, `access` o `audit` | Estos módulos son obligatorios y no se pueden desactivar.                                                             |
| Las invitaciones se crean, pero no llega ningún correo                           | ¿Está activado `notify` y hay un proveedor de correo configurado? Si no, comparte el enlace manualmente.              |

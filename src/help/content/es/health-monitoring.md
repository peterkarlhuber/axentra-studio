---
title: Estado del sistema y monitorización
summary: Comprueba si el servidor de Axentra está activo y disponible, lee sus métricas y consulta la configuración de retención, trazas y registros que informa.
keywords: estado del sistema, estado, salud, disponibilidad, readiness, actividad, liveness, tiempo de actividad, 503, monitorización, métricas, Prometheus, scrape, OpenTelemetry, trazas, nivel de registro, retención, purga, versión
---

Dos páginas muestran cómo está el servidor de Axentra. **Estado del sistema** responde a «¿está el
servidor activo y puede atender solicitudes?» e indica qué versiones del servidor y de Studio se
están ejecutando. **Monitorización** añade las métricas propias del servidor (número de
solicitudes, errores, tiempos de respuesta) y la configuración de mantenimiento, retención, trazas
y registros que informa. Los operadores las usan para echar un vistazo rápido; para alertas e
historial, conecta un sistema de monitorización de verdad (consulta
[Para operadores](#for-operators)).

> [!IMPORTANT]
> Ambas páginas están abiertas a todos los usuarios con sesión iniciada y no dependen de ningún
> módulo. Las tarjetas **Mantenimiento y retención** y **Trazas y registros** requieren
> `platform:settings` (roles de plataforma) o `product:manage` en al menos un producto
> (**Product owner**, **Product admin**). La tarjeta **Métricas** depende
> de la configuración de métricas del servidor, no de tu rol (consulta [Métricas](#metrics)).

## Comprobar si el servidor está en buen estado {#check-health}

1. Abre **Auditoría y monitorización** › **Estado del sistema** ([abrir](app:health)).
2. Lee la tarjeta **Disponibilidad (readiness)**: el estado general y una línea por comprobación.
3. Lee la tarjeta **Actividad (liveness)**: **OK** significa que el proceso del servidor responde.
4. Elige **Actualizar** para volver a comprobarlo en el momento. Ambas tarjetas se actualizan
   también cada 30 segundos; **Actualizado …** te indica cuándo se obtuvo el resultado de
   disponibilidad.

### Disponibilidad (readiness) {#readiness}

La disponibilidad pregunta al servidor si puede atender solicitudes en este momento
(`GET /v1/health/ready`). El servidor ejecuta cada comprobación y responde **OK** solo si todas se
superan; si no, responde con HTTP `503` y el estado **No disponible**, y Studio sigue listando todas
las comprobaciones para que veas cuál falla.

| Comprobación      | Presente cuando                                         | Se supera cuando                                                                                                                   |
| ----------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `database`        | siempre                                                 | El servidor llega a su base de datos PostgreSQL                                                                                    |
| `notify_provider` | el módulo de notificaciones está activado               | La configuración del proveedor de correo está completa (dirección del remitente, ajustes del proveedor). No se envía ningún correo |
| `schema`          | el operador configuró `database.require_current_schema` | No hay migraciones de base de datos pendientes ni desconocidas para el servidor                                                    |

Los backends de producto construidos sobre Axentra pueden registrar más comprobaciones; aparecen
aquí con sus propios nombres.

### Actividad (liveness) {#liveness}

La actividad (`GET /v1/health/live`) solo te indica que el proceso del servidor responde. Studio
muestra **Caído** cuando la solicitud falla, por ejemplo porque el servidor o el proxy que tiene
delante no es accesible. Un servidor puede estar activo pero no disponible: el proceso se ejecuta,
pero falta una dependencia, como la base de datos.

### Versiones {#versions}

La tarjeta **Versiones** de **Estado del sistema** muestra el nombre y la versión del
**Servidor**, la **Versión de API del servidor**, el **Entorno** (`development`, `test` o
`production`), la **Versión de Studio** y la **Versión de API requerida** por esta compilación de
Studio. Studio se niega a arrancar contra un servidor cuya versión de API no encaja; consulta
[Comprobación de compatibilidad](help:server-configuration#compatibility).

## Usar la página Monitorización {#monitoring}

Abre **Auditoría y monitorización** › **Monitorización** ([abrir](app:monitoring)). Muestra las
mismas tarjetas **Disponibilidad (readiness)** y **Actividad (liveness)** que **Estado del
sistema**, además de:

- **Mantenimiento y retención** y **Trazas y registros** (consulta [más abajo](#retention)),
- **Métricas** del proceso de la API (consulta [Métricas](#metrics)).

**Actualizar** las vuelve a cargar todas. Las métricas también se actualizan cada 30 segundos
mientras se cargan sin errores.

## Métricas {#metrics}

La tarjeta **Métricas** lee el endpoint de Prometheus del servidor, `GET /metrics`, y lo muestra en
forma de cifras clave y tablas.

| Cifra clave                                                                                          | Se cuenta a partir de                                                                            |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Solicitudes HTTP**                                                                                 | Todas las solicitudes (`axentra_http_requests_total`)                                            |
| **Errores del servidor (5xx)** / **Errores del cliente (4xx)**                                       | Solicitudes con esa clase de estado                                                              |
| **Tiempo medio de respuesta**                                                                        | Tiempo total de las solicitudes dividido por su número (`axentra_http_request_duration_seconds`) |
| **Rechazadas (401/403)**                                                                             | Rechazos de autenticación y de permisos (`axentra_auth_failures_total`)                          |
| **Notificaciones en cola** / **Notificaciones entregadas** / **Entregas de notificaciones fallidas** | Contadores de notificaciones (solo los informan los procesos que gestionan notificaciones)       |

Debajo de las cifras clave, las métricas se agrupan en **HTTP**, **Autenticación**, **Pool de la
base de datos**, **Notificaciones**, **Tareas y eventos** y **Otras métricas**. Cada tabla muestra
una fila por combinación de etiquetas (por ejemplo, por método, ruta y estado) con su valor; para
los histogramas, el **Recuento** y el **Promedio**. Las métricas grandes muestran las 50 primeras
filas.

> [!WARNING]
> Los valores cuentan **desde que se inició este proceso de la API** y pertenecen **al único
> proceso que respondió a la solicitud de Studio**. Con varios procesos o réplicas de la API, cada
> uno lleva sus propias cifras, y el despachador de notificaciones y los workers de tareas también
> tienen las suyas. Un reinicio pone las cifras a cero. Para tener una visión completa, deja que
> Prometheus haga scrape de todos los procesos.

### Token de métricas {#metrics-token}

Que `/metrics` responda depende de la configuración del servidor:

| Configuración del servidor                          | Qué muestra Studio                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `observability.metrics_enabled = false`             | **Las métricas no están disponibles**                                                                    |
| `observability.metrics_token_ref` está configurado  | **Se requiere un token de métricas** y un formulario **Token de métricas**                               |
| Sin token configurado, `environment = "production"` | **Las métricas no están disponibles** (las métricas siguen desactivadas hasta que se configure un token) |
| Sin token configurado, desarrollo o pruebas         | Las métricas, sin token                                                                                  |

Para ver métricas protegidas:

1. Pide el token de métricas a tu operador (el secreto al que apunta
   `observability.metrics_token_ref`).
2. Introdúcelo en **Bearer token** y elige **Cargar métricas**.

> [!NOTE]
> Studio guarda el token solo en la página abierta. Nunca se almacena y desaparece cuando sales de
> la página o la recargas. Si el servidor no lo acepta, Studio muestra **El servidor no aceptó este
> token.**

## Retención, trazas y registros {#retention}

**Mantenimiento y retención** lista durante cuánto tiempo conserva el servidor los datos, según
informa `GET /v1/settings`:

| Línea                                                            | Ajuste del servidor                                               | Predeterminado                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Eventos de auditoría**                                         | `observability.audit_retention_days`                              | 365 días                                                                |
| **Tareas finalizadas**                                           | `observability.job_retention_days`                                | 30 días                                                                 |
| **Contenido de notificaciones** / **Mensajes de notificaciones** | `notify.content_retention_days` / `notify.message_retention_days` | no lo informa la versión del servidor con la que se compiló este Studio |

Un valor que el servidor no informa aparece como **el servidor no lo informa**; Studio nunca lo
adivina.

> [!IMPORTANT]
> La retención no se ejecuta sola. Los datos más antiguos que el período solo se eliminan cuando el
> operador ejecuta `axentra maintenance purge` (normalmente una vez al día desde cron o un
> planificador). El comando también elimina las sesiones y los tokens de configuración inicial
> caducados.

**Trazas y registros** muestra si las **Trazas de OpenTelemetry** están activadas, el **Nivel de
registro**, el **Proveedor de notificaciones** (`local` o `smtp`) y el **Entorno**. Son de solo
lectura; se cambian en la configuración del servidor.

## Para operadores {#for-operators}

- **Sondas**: usa `GET /v1/health/live` como sonda de actividad (liveness) y `GET /v1/health/ready`
  como sonda de disponibilidad (readiness) de tu orquestador. Ninguna de las dos requiere
  autenticación y nunca tienen límite de frecuencia.
- **Prometheus**: haz scrape de `/metrics` en cada proceso de la API. En producción, configura
  `observability.metrics_token_ref` (por ejemplo `file:/run/secrets/axentra_metrics_token`) y da a
  Prometheus el mismo token como credencial bearer.
- **Studio en el mismo origen**: el contenedor de Studio redirige `/metrics` a la API junto con
  `/v1`, así que la página Monitorización funciona detrás de la misma dirección.
- **Registros**: son JSON por defecto y llevan el ID de solicitud; los secretos se ocultan.
- **Trazas**: `observability.otel_enabled = true` junto con el extra `otel` del paquete del servidor
  exporta un span por solicitud mediante OTLP/HTTP.

El repositorio del backend documenta todo esto en `docs/operations/OBSERVABILITY.md`.

## Solución de problemas {#troubleshooting}

- **Disponibilidad (readiness): No disponible** con `database` **No superada**: el servidor no
  llega a PostgreSQL. Comprueba la base de datos y la URL de base de datos del servidor; las
  solicitudes que necesitan datos fallan hasta que vuelva.
- **`notify_provider` No superada**: la configuración de correo está incompleta, por ejemplo falta
  la dirección del remitente o no es válida, o faltan los ajustes SMTP. Corrige `[notify]` en la
  configuración del servidor.
- **`schema` No superada**: hay migraciones pendientes. El operador ejecuta `axentra migrate`.
- **Actividad (liveness): Caído** o **Servidor no accesible**: no se puede llegar al servidor o al
  proxy entre Studio y el servidor. Comprueba que el servidor se esté ejecutando y que la dirección
  de la API de Studio sea correcta (consulta
  [Configuración de Studio](help:server-configuration#studio-config)).
- **Las métricas no están disponibles**: las métricas están desactivadas, o es un servidor de
  producción sin token de métricas. Pide al operador que configure
  `observability.metrics_token_ref`.
- **El servidor no aceptó este token.**: el token es incorrecto o se ha rotado. Pide el actual al
  operador.
- **La configuración de retención y trazas solo se muestra a los administradores de la plataforma y
  a los gestores de productos**: no tienes ni `platform:settings` ni `product:manage`. El resto de
  la página sigue funcionando.
- **Las métricas parecen demasiado bajas o vuelven a cero**: respondió otro proceso de la API, o el
  proceso se reinició (consulta la advertencia en [Métricas](#metrics)).

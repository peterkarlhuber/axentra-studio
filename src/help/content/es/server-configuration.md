---
title: Configuración del servidor para Studio
summary: Qué configuran los operadores para que Studio funcione - la dirección de la API en config.json, los orígenes permitidos, los módulos, el modo de uno o varios productos y la comprobación de versión.
keywords: operador, administrador, despliegue, instalación, configuración, config.json, apiBaseUrl, proxy inverso, CORS, orígenes permitidos, mismo sitio, módulos, activar módulo, un solo producto, varios productos, modo, compatibilidad, versión, Docker, copia de seguridad, restauración, observabilidad
---

Este artículo es para quienes administran Axentra y Studio. Solo trata lo que importa para Studio:
cómo encuentra Studio la API, qué debe permitir la API, cómo los módulos y el modo de despliegue
cambian lo que muestra Studio y cómo comprueba Studio que encaja con la versión del servidor. La
configuración completa del servidor está documentada en el repositorio del backend (consulta
[Más información](#further-reading)).

Studio es una aplicación web estática. No tiene servidor, base de datos ni secretos propios; todo lo
que muestra viene de la API de Axentra, y la API toma todas las decisiones sobre permisos.

```diagram
architecture
```

## Indicar a Studio dónde está la API con config.json {#studio-config}

Cuando Studio arranca, carga `/config.json` desde su propia dirección, antes que cualquier otra
cosa. Por eso una misma compilación funciona en todos los entornos.

```json
{ "apiBaseUrl": "" }
```

| `apiBaseUrl`                | Significado                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `""` (predeterminado)       | **Mismo origen** (recomendado): un proxy inverso sirve Studio y reenvía `/v1` (y `/metrics`) a la API en la misma dirección |
| `"https://api.example.com"` | La API se ejecuta en otra dirección. Indica solo el origen; se eliminan una `/` o un `/v1` finales                          |

Si `/config.json` falta o no es válido, Studio usa el mismo origen.

Con la imagen de contenedor de Studio no escribes el archivo tú mismo:

| Variable                  | Efecto                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `AXENTRA_API_URL`         | El contenedor redirige `/v1` y `/metrics` a esta dirección de la API (configuración de mismo origen)                      |
| `AXENTRA_PUBLIC_API_URL`  | Se escribe en `config.json` como `apiBaseUrl` y se permite en la Content-Security-Policy (dirección de API independiente) |
| `AXENTRA_CSP_CONNECT_SRC` | Direcciones adicionales a las que puede conectarse Studio                                                                 |

## Hacer que la API acepte Studio {#allowed-origins}

La API rechaza las solicitudes de navegador con sesión iniciada que vienen de orígenes desconocidos.
Configura en el servidor de Axentra:

- `security.allowed_origins`: añade la dirección pública de Studio, por ejemplo
  `["https://studio.example.com"]`, salvo que Studio se ejecute en el propio `public_url` de la API.
  En producción solo se aceptan orígenes `https://` explícitos; `*` nunca está permitido.
- `security.public_url`: la dirección `https://` externa de la API. Activa las cookies seguras.
- `security.trusted_proxies`: los proxies situados delante de la API, para que la IP del cliente en
  el registro de auditoría y en los límites de frecuencia sea la del usuario y no la del proxy.

> [!WARNING]
> Con una dirección de API independiente, Studio y la API deben estar en el **mismo sitio** (por
> ejemplo `studio.example.com` y `api.example.com`). La cookie de sesión es `SameSite=Lax`, así que
> una configuración entre sitios distintos no puede iniciar sesión. El mismo origen es la
> configuración probada y recomendada.

Para el inicio de sesión único, el proveedor de identidad vuelve a una dirección absoluta de Studio,
que la API debe aceptar como destino de redirección.

## Activar módulos {#modules}

El ajuste del servidor `modules` decide qué partes de Axentra se ejecutan. Los módulos `identity`,
`tenancy`, `access` y `audit` están siempre activados. Los demás son opcionales:

| Módulo               | Secciones de Studio                                          |
| -------------------- | ------------------------------------------------------------ |
| `data`               | **Resumen de datos**, **Registros**                          |
| `storage`            | **Archivos**                                                 |
| `events`             | **Tareas**, **Programaciones**, **Eventos**, **Webhooks**    |
| `usage`              | **Uso**                                                      |
| `billing`            | **Planes**, **Suscripciones**                                |
| `notify`             | **Notificaciones**                                           |
| `search`, `realtime` | Sin pantallas en Studio; solo disponibles a través de la API |

Studio lee la lista de módulos de `GET /v1/meta` una vez, al cargarse:

- Una sección cuyo módulo está desactivado se mantiene en la barra lateral, marcada como
  **Inactivo**, y abre **Módulo no habilitado en este servidor**.
- Un módulo activado que no tiene pantallas en esta versión de Studio muestra **Aún no disponible
  en Studio**.

Para cambiar los módulos, edita la configuración del servidor (por ejemplo
`modules = ["identity", "tenancy", "access", "audit", "data", "storage", "events"]` o la variable
de entorno `AXENTRA__MODULES`), reinicia la API y después recarga Studio. La lista activa aparece
en `modules` en la página [Configuración](help:settings#settings-tree). Consulta
[Referencia de módulos](help:modules-reference).

> [!NOTE]
> Desactivar un módulo retira sus endpoints; sus datos se quedan en la base de datos y vuelven a
> estar disponibles cuando activas de nuevo el módulo.

## Despliegue de uno o varios productos {#deployment-modes}

El `mode` del servidor decide cuántos productos sirve. Studio lo lee de `GET /v1/meta`.

|                                            | `single` (predeterminado del servidor)                                                            | `multi`                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Productos                                  | Exactamente uno, creado en el primer arranque a partir de la sección `[product]` (`slug`, `name`) | Cualquier número, creados por administradores de la plataforma |
| Página de inicio                           | El panel del producto                                                                             | El último producto usado o, si no, la lista de productos       |
| Barra superior                             | El nombre del producto, sin selector                                                              | Selector de productos                                          |
| **Nuevo producto**, archivar, restaurar    | No se ofrecen (la API responde `409 mode_not_supported`)                                          | Con `products:create` / `products:archive`                     |
| ID de producto desconocido en la dirección | Redirección a la misma sección del único producto                                                 | **No encontrado**                                              |

Todo lo demás (inquilinos, usuarios, roles, datos, auditoría) funciona igual en ambos modos. Las
cuentas de usuario pertenecen a la instalación en los dos modos. Pasar una instalación de `single`
a `multi` es un cambio de configuración sin migración de datos.

## Comprobación de compatibilidad entre Studio y la API {#compatibility}

Cada compilación de Studio declara la versión de API que necesita (**Versión de API requerida**,
actualmente `1.0`). Al arrancar, Studio lee `api_version` de `GET /v1/meta`:

| Versión de API del servidor                                          | Resultado                                                                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Misma mayor, menor igual o superior (por ejemplo `1.0`, `1.3`)       | Studio arranca                                                                           |
| Menor inferior (por ejemplo, servidor `1.0` y Studio necesita `1.2`) | **Versión del servidor incompatible**: actualiza el servidor o usa un Studio más antiguo |
| Mayor distinta (por ejemplo `2.0`)                                   | **Versión del servidor incompatible**: usa una versión de Studio para esa versión mayor  |
| No legible                                                           | **Versión del servidor incompatible** con el valor sin procesar                          |

Si se rechaza, no se carga nada más, así que un servidor inadecuado nunca recibe escrituras de
Studio. Ambas versiones aparecen en [Estado del sistema](help:health-monitoring#versions). Las
combinaciones probadas juntas figuran en `docs/COMPATIBILITY.md` de Studio.

> [!TIP]
> Después de actualizar el servidor, recarga las pestañas de Studio abiertas: la comprobación solo
> se ejecuta cuando Studio se carga.

Si en su lugar Studio muestra **No se puede conectar con Axentra**, es que no pudo cargar
`GET /v1/meta` en absoluto; consulta [Solución de problemas](#troubleshooting).

## Ajustes del servidor que cambian lo que ven los usuarios {#user-visible-settings}

| Ajuste del servidor                                   | Efecto en Studio                                                                                                                                                                                             | Predeterminado                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `security.password_login`                             | Formulario de inicio de sesión con contraseña en la página de inicio de sesión                                                                                                                               | activado                                      |
| Proveedores `[[oidc]]`                                | Botones de inicio de sesión único en la página de inicio de sesión                                                                                                                                           | ninguno                                       |
| `security.session_ttl_hours` / `session_idle_minutes` | Cuándo deben volver a iniciar sesión los usuarios                                                                                                                                                            | 12 h / 120 min                                |
| `security.password_min_length`                        | Longitud mínima de las contraseñas nuevas                                                                                                                                                                    | 12                                            |
| `security.first_password` / `fresh_login_minutes`     | Si los usuarios de inicio de sesión único pueden establecer una contraseña en su [perfil](help:profile#set-password) y en cuánto tiempo                                                                      | permitido en 5 min                            |
| `security.max_body_bytes`, `storage.max_file_bytes`   | Solicitud y subida de archivo más grandes                                                                                                                                                                    | 10 MiB / 50 MiB                               |
| `observability.metrics_enabled` / `metrics_token_ref` | Si **Métricas** en Monitorización muestra datos o pide un token                                                                                                                                              | activado; desactivado en producción sin token |
| `observability.audit_retention_days`                  | Hasta dónde llega el registro de auditoría después de `axentra maintenance purge`                                                                                                                            | 365                                           |
| `notify.invitation_accept_url`                        | Adónde llevan los enlaces de invitación (prevalece la `invitation_accept_url` propia del producto). Defínelo como `https://<your Studio address>/invitations/accept` cuando Studio tenga su propia dirección | `/accept-invitation` en `security.public_url` |

Cámbialos en el archivo TOML del servidor o como variables de entorno
`AXENTRA__<SECTION>__<KEY>` (por ejemplo `AXENTRA__SECURITY__SESSION_TTL_HOURS=8`) y reinicia la
API. Los secretos se indican siempre como referencias (`env:NAME` o `file:/path`), nunca en línea en
producción.

## Más información {#further-reading}

En el repositorio del backend de Axentra:

- `docs/operations/CONFIGURATION.md`: cada ajuste con su valor predeterminado y su variable de
  entorno.
- `docs/operations/DEPLOYMENT.md`: imagen de contenedor, stacks de compose y lista de comprobación
  para producción.
- `docs/architecture/DEPLOYMENT_MODELS.md`: los modos de uno y varios productos en profundidad.
- `docs/operations/BACKUP_RESTORE.md`: copia de seguridad y restauración de la base de datos, y
  cómo verificar una restauración. Studio no guarda datos, así que basta con hacer copia de
  seguridad de la base de datos.
- `docs/operations/OBSERVABILITY.md`: métricas, trazas, registros, comprobaciones de estado y
  retención.
- `docs/architecture/VERSIONING.md`: números de versión y reglas de compatibilidad.

En el repositorio de Studio: `README.md` (configuración e imagen de contenedor) y
`docs/COMPATIBILITY.md` (combinaciones probadas).

## Solución de problemas {#troubleshooting}

- **No se puede conectar con Axentra**: Studio no pudo cargar `GET /v1/meta`. Comprueba que la API
  se esté ejecutando, que `apiBaseUrl` en `/config.json` sea correcto (o que el proxy reenvíe
  `/v1`) y, con una dirección de API independiente, que la Content-Security-Policy la permita.
- El inicio de sesión falla con **No permitido** o todos los cambios fallan con **No permitido**:
  la API rechaza el origen de Studio. Añade la dirección de Studio a `security.allowed_origins` y
  reinicia la API.
- El inicio de sesión parece funcionar, pero se cierra la sesión de inmediato: Studio y la API están
  en sitios distintos, o el `public_url` de la API es `https://` mientras que los usuarios acceden
  por `http://`. Usa el mismo origen o una configuración en el mismo sitio con HTTPS.
- **Versión del servidor incompatible**: consulta
  [Comprobación de compatibilidad](#compatibility).
- **Módulo no habilitado en este servidor**: activa en el servidor el módulo indicado en el mensaje
  y recarga Studio.
- **No disponible en este modo**: la acción requiere el modo `multi`; el servidor se ejecuta en modo
  `single`.
- El registro de auditoría muestra la dirección del proxy como **Dirección IP**: añade el proxy a
  `security.trusted_proxies`.
- Los enlaces de invitación abren una página de la API o **Página no encontrada**: Studio tiene su
  propia dirección. Define `notify.invitation_accept_url` como
  `https://<your Studio address>/invitations/accept` y reinicia la API. Los enlaces ya enviados
  siguen apuntando a la API; envía a esas personas el token o una invitación nueva. Consulta
  [Miembros e invitaciones](help:members-invitations#delivery).

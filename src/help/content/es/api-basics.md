---
title: Conceptos básicos de la API para desarrolladores
summary: Cómo llamar a la API HTTP de Axentra desde tu propio código - URL base, autenticación, errores, ID de solicitud, paginación, concurrencia, límites de frecuencia, SDK y versiones.
keywords: API, REST, HTTP, desarrollador, integración, URL base, clave de API, bearer token, sesión, CSRF, error, problem details, RFC 9457, ID de solicitud, paginación, cursor, If-Match, ETag, 412, 429, límite de frecuencia, Retry-After, idempotencia, SDK, Python, TypeScript, OpenAPI, versión
---

Todo lo que hace Studio lo hace a través de la API HTTP pública de Axentra, y tus propios servicios
pueden hacer lo mismo. Este artículo explica las reglas que se aplican a todos los endpoints. El
contrato completo y legible por máquina es el documento OpenAPI del servidor
(`openapi/axentra-v1.json` en el repositorio del backend; en un servidor en marcha,
`/v1/openapi.json` y la referencia interactiva en `/v1/docs`, si el operador los activó; consulta
[Referencia de la API](#api-reference)).

> [!IMPORTANT]
> Para llamar a la API desde un programa necesitas una clave de API para tu producto. Crea una en
> **Acceso y claves de API** › **Claves de API** ([abrir](app:apiKeys)); consulta
> [Claves de API](help:api-keys).

## URL base y formato {#base-url}

- Todos los endpoints están bajo `/v1` en la dirección pública del servidor, por ejemplo
  `https://api.example.com/v1/...`. Pide la dirección a tu operador (es `public_url` en la página
  [Configuración](help:settings#settings-tree)).
- El producto y el inquilino forman parte de la ruta:
  `/v1/products/{product_id}/tenants/{tenant_id}/...`. Los ID son cadenas opacas con un prefijo
  (`prd_`, `ten_`, `usr_`, `key_`, `rec_`, ...); no los analices.
- Las solicitudes y respuestas son JSON (`application/json`, UTF-8) con campos en `snake_case`.
  Las marcas de tiempo siguen RFC 3339 en UTC, por ejemplo `2026-11-02T09:30:00Z`.
- Los clientes deben ignorar los campos de respuesta que no conozcan: pueden aparecer campos nuevos
  en cualquier versión menor.

```http
GET /v1/products/prd_01EXAMPLE/tenants?limit=20 HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01EXAMPLE_secretEXAMPLE
Accept: application/json
```

## Autenticarse {#authentication}

| Quién llama                                                      | Cómo                                                                                                        | CSRF                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Un servicio, script o tarea                                      | Clave de API: `Authorization: Bearer axk_<id>_<secret>` (también funciona la cabecera `X-API-Key: axk_...`) | No es necesario                          |
| Una aplicación de navegador en un origen permitido (como Studio) | Cookie de sesión del inicio de sesión, que envía el navegador                                               | Obligatorio en solicitudes que modifican |
| Una CLI o herramienta que actúa como un usuario                  | El token de sesión como `Authorization: Bearer <token>`                                                     | No es necesario                          |

### Claves de API {#api-keys}

Una clave de API pertenece a un producto, opcionalmente a un inquilino, y tiene una lista explícita
de permisos. Solo se muestra una vez, al crearla o rotarla. Guárdala en un almacén de secretos,
nunca en un navegador ni en un repositorio. Las solicitudes con una clave se registran con **Tipo de
actor** `api_key` en el [registro de auditoría](help:audit#event-detail). Detalles:
[Claves de API](help:api-keys).

### Sesiones de navegador y CSRF {#csrf}

Iniciar sesión (`POST /v1/auth/login/password` o inicio de sesión único) establece una cookie de
sesión `HttpOnly`. Cuando una solicitud se autentica con esa cookie y modifica algo (`POST`, `PUT`,
`PATCH`, `DELETE`), también debe enviar:

- `X-Axentra-CSRF: <csrf_token>`, donde el token viene de `GET /v1/auth/session` (o de la
  respuesta del inicio de sesión); guárdalo solo en memoria;
- un `Origin` que sea el `public_url` del servidor o figure en `security.allowed_origins`.

De lo contrario, el servidor responde `403` (`missing or invalid CSRF token` o
`cross-origin request refused`). Las solicitudes autenticadas con un bearer token no necesitan token
CSRF, porque los navegadores nunca las envían automáticamente.

### 401, 403 y 404 {#auth-errors}

- `401 unauthenticated`: no hay credenciales o no son válidas (clave incorrecta, clave revocada,
  sesión caducada).
- `403 forbidden`: estás autenticado, pero te falta el permiso.
- `404 not_found`: también para recursos **fuera de tu ámbito**, por ejemplo el inquilino de otro
  producto. El servidor nunca revela si existe algo que no puedes ver.

## Errores {#errors}

Cada error es un documento de problema según RFC 9457 con
`Content-Type: application/problem+json` ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):

```json
{
  "type": "urn:axentra:problem:validation_failed",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "detail": "The request is invalid.",
  "request_id": "req_01EXAMPLE",
  "errors": [{ "loc": ["body", "slug"], "msg": "String should have at least 2 characters" }]
}
```

`type` es una URN (`urn:axentra:problem:<code>`), no una dirección web.
Usa `code` en tu programa; es estable. `title` y `detail` son para personas y pueden cambiar.

| Estado | `code`                                   | Significado                                                                          |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| 400    | `bad_request`                            | Solicitud mal formada                                                                |
| 401    | `unauthenticated`                        | Inicia sesión o envía una clave válida                                               |
| 403    | `forbidden`, `reauthentication_required` | Falta un permiso; o la acción requiere un inicio de sesión reciente                  |
| 404    | `not_found`, `module_disabled`           | No existe, no es tuyo o el módulo está desactivado                                   |
| 409    | `conflict`, `mode_not_supported`         | Choca con datos existentes; o no es posible en modo de un solo producto              |
| 412    | `precondition_failed`                    | La versión de `If-Match` está desactualizada (consulta [Concurrencia](#concurrency)) |
| 413    | `payload_too_large`                      | Cuerpo mayor que `max_body_bytes` (o archivo mayor que el límite de almacenamiento)  |
| 415    | `unsupported_media_type`                 | Tipo de contenido no aceptado                                                        |
| 422    | `validation_failed`                      | Datos no válidos; `errors` indica cada campo (`loc`) y el motivo (`msg`)             |
| 429    | `rate_limited`, `quota_exceeded`         | Demasiadas solicitudes, o se ha agotado una cuota de uso                             |
| 500    | `internal`                               | Error del servidor; comunica el ID de solicitud                                      |

Los problem details nunca contienen secretos, tokens, SQL ni trazas de pila.

## ID de solicitud {#request-ids}

Cada respuesta lleva una cabecera `X-Request-ID`, y cada documento de problema su `request_id`.
Puedes enviar tu propio ID en `X-Request-ID` (de 1 a 64 caracteres de `A-Z a-z 0-9 . _ -`); si no,
el servidor crea uno (`req_…`). El mismo ID aparece en los registros del servidor, en las trazas y
como **ID de solicitud** en los [eventos de auditoría](help:audit#request-id). Regístralo con cada
llamada fallida y cítalo cuando pidas ayuda. Studio lo muestra en **Detalles técnicos** en cada
mensaje de error.

## Paginar listas {#pagination}

Las listas usan cursores:

```http
GET /v1/audit?limit=100 HTTP/1.1
```

```json
{ "items": [ ... ], "next_cursor": "eyJ..." }
```

- `limit` va de 1 a 200; el valor predeterminado es 50.
- Cuando `next_cursor` no es `null`, pide la página siguiente con `?cursor=<next_cursor>` y los
  mismos filtros. Cuando es `null`, ya lo tienes todo.
- Los cursores son opacos; no los construyas ni los modifiques. Los filtros son parámetros de
  consulta normales documentados en cada endpoint.

## Evitar actualizaciones perdidas {#concurrency}

Los recursos que tienen un número de `version` (por ejemplo productos, inquilinos, registros,
medidores de uso, plantillas de notificación) admiten concurrencia optimista:

1. Lee el recurso y anota su `version` (las respuestas de registros y medidores también la envían
   como `ETag`, por ejemplo `"3"`).
2. Envía el cambio con `If-Match: 3`.
3. Si alguien lo modificó entretanto, el servidor responde `412 precondition_failed`. Vuelve a
   leerlo, aplica de nuevo tu cambio y reintenta.

Sin `If-Match`, gana la última escritura. `If-Match` debe ser el número de versión; cualquier otra
cosa da `422`.

## Reintentar con seguridad: claves de idempotencia {#idempotency}

Los endpoints que crean algo con efectos secundarios aceptan una cabecera `Idempotency-Key` (hasta
200 caracteres), por ejemplo al registrar uso, poner tareas en cola, publicar eventos y enviar
notificaciones. Repetir una solicitud con la misma clave devuelve el resultado original en lugar de
hacer el trabajo dos veces. Usa tu propia clave de negocio (un ID de pedido, un ID de mensaje) y
reutilízala en cada reintento. Para registrar uso, la clave es obligatoria.

## Límites de frecuencia {#rate-limits}

Si el operador activó los límites de frecuencia (`limits.rate_limit_per_minute`,
`rate_limit_ip_per_minute`, consulta [Configuración](help:settings#settings-tree)), un cliente que
envía demasiadas solicitudes recibe `429 rate_limited` con una cabecera `Retry-After` en segundos.
Espera ese tiempo y reintenta. Los límites cuentan por credencial (clave de API o sesión), por IP
del cliente y por proceso del servidor. Las comprobaciones de estado y `/metrics` nunca están
limitadas. Los intentos de inicio de sesión tienen su propio límite (`login_rate_per_minute`).

`429 quota_exceeded` es distinto: se ha agotado una cuota de uso del inquilino o del plan (consulta
[Uso](help:usage)). Esperar unos segundos no sirve de nada.

## Usar un SDK {#sdks}

El repositorio del backend contiene dos clientes oficiales, ambos en fase alfa y aún no publicados
en un registro de paquetes. Los dos envían las cabeceras correctas, convierten los documentos de
problema en excepciones con `status`, `code`, `request_id` y `retry_after`, paginan por ti y
comprueban la versión del servidor. Ninguno reintenta automáticamente: reintenta tú, con una clave
de idempotencia.

### Python {#sdk-python}

Paquete `axentra-client` en `sdk/python` (Python 3.11+, clientes síncrono y asíncrono). Instálalo
desde una copia del repositorio con `pip install ./sdk/python`.

```python
from axentra_client import AxentraClient, AxentraApiError

with AxentraClient("https://api.example.com", api_key="axk_01EXAMPLE_secretEXAMPLE") as ax:
    ax.check_compatibility()
    pid = "prd_01EXAMPLE"
    for tenant in ax.tenants.iter(pid, page_size=100):
        print(tenant.slug)
    try:
        ax.tenants.create(pid, slug="acme", name="Acme")
    except AxentraApiError as e:
        print(e.status, e.code, e.request_id)
```

### TypeScript {#sdk-typescript}

Paquete `@axentra/sdk` en `sdk/typescript` (ESM, Node 20+ o un navegador moderno). Sus tipos se
generan a partir del contrato OpenAPI, así que cada ruta, parámetro y cuerpo está tipado.

```ts
import { AxentraApiError, createAxentraClient } from '@axentra/sdk';

const ax = createAxentraClient({
  baseUrl: 'https://api.example.com',
  apiKey: process.env.AXENTRA_KEY,
});
await ax.checkCompatibility();

const product_id = 'prd_01EXAMPLE';
for await (const t of ax.paginate((cursor) =>
  ax.GET('/v1/products/{product_id}/tenants', {
    params: { path: { product_id }, query: { cursor, limit: 100 } },
  }),
)) {
  console.log(t.slug);
}
```

En un navegador sin clave, el cliente de TypeScript usa la cookie de sesión y gestiona por sí mismo
el token CSRF. El repositorio del backend documenta ambos clientes en `docs/sdk/PYTHON.md` y
`docs/sdk/TYPESCRIPT.md`.

## Versiones y compatibilidad {#versioning}

- La versión de la ruta, `/v1`, solo cambia con cambios incompatibles. Un nuevo `/v2` se serviría
  junto a `/v1` durante al menos una versión menor.
- La versión **menor** de la API crece con los cambios aditivos (endpoints nuevos, campos opcionales
  nuevos, valores nuevos). `GET /v1/meta` la devuelve como `api_version: {"major": 1, "minor": 0}`,
  y cada respuesta lleva `Axentra-API-Version: 1.0`.
- Llama a `GET /v1/meta` al arrancar y niégate a ejecutarte si la versión mayor es distinta o si la
  menor del servidor es inferior a la que necesitas. Una menor más reciente no es problema. Ambos
  SDK lo hacen en `check_compatibility()` / `checkCompatibility()`, y Studio hace lo mismo
  (consulta [Comprobación de compatibilidad](help:server-configuration#compatibility)).
- Si quieres, envía `Axentra-Client: <name>/<version>; api=<major.minor>` para que los registros
  del servidor muestren qué cliente llamó.

## Referencia de la API {#api-reference}

El servidor puede servir su documento OpenAPI en `/v1/openapi.json` y una referencia interactiva en
`/v1/docs`. El operador lo controla con `security.api_docs` (se muestra como `limits.api_docs` en
[Configuración](help:settings#settings-tree)): `public`, `authenticated` (requiere una sesión o una
clave de API) o `disabled` (el valor predeterminado en producción). El archivo
`openapi/axentra-v1.json` confirmado en el repositorio del backend describe siempre el contrato
actual.

## Solución de problemas {#troubleshooting}

- **`401 unauthenticated` con una clave de API**: la clave es incorrecta, está revocada o caducada, o se rotó y su período de gracia ha terminado.
  Comprueba el estado de la clave en **Claves de API** y envíala como `Authorization: Bearer axk_...`.
- **`403 forbidden` con «missing or invalid CSRF token»**: una solicitud de navegador autenticada
  por cookie sin `X-Axentra-CSRF`, o con un token obsoleto. Vuelve a leer `GET /v1/auth/session`.
- **`403` con «cross-origin request refused»**: el origen de tu aplicación no está en
  `security.allowed_origins`. Pide al operador que lo añada.
- **`404` aunque el ID es correcto**: el recurso pertenece a otro producto o inquilino distinto del
  de tu clave, o el módulo está desactivado (`module_disabled`).
- **`412 precondition_failed`**: alguien modificó el recurso desde que lo leíste. Vuelve a leerlo y
  reintenta con la nueva versión.
- **`429 rate_limited`**: espera los segundos indicados en `Retry-After` y después reduce el ritmo.
- **`413 payload_too_large`**: el cuerpo supera `security.max_body_bytes` (10 MiB por defecto). Sube
  los archivos mediante los endpoints de archivos, que tienen su propio límite.
- **Tu cliente rechaza la versión del servidor**: el servidor es más antiguo de lo que necesita tu
  cliente, o tiene otra versión mayor. Usa una versión del cliente que encaje.

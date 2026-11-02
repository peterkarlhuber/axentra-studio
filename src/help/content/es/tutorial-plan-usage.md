---
title: Planes y uso de principio a fin
summary: Define un medidor y un plan con un límite de uso, suscribe un inquilino, registra uso a través de la API y sigue la cuota en Studio.
keywords: tutorial, guía paso a paso, ejemplo, medición, cuota, límite del plan, prestación, suscripción, clave de API, registrar uso, 429, cuota superada
---

En este tutorial limitas las llamadas a la API de un cliente a través de su plan. Creas un medidor
`api_calls`, un plan gratuito **Starter** que permite 1000 llamadas al mes y activa una función de
exportación, suscribes a él al inquilino `acme`, registras uso con una clave de API y ves cómo se
llena la cuota en Studio. Al final provocas a propósito una solicitud rechazada. Lleva unos 15
minutos.

> [!IMPORTANT]
> Necesitas: los módulos `usage` y `billing` en el servidor; un rol de producto con `usage:manage`,
> `billing:manage` y el derecho a crear claves de API (por ejemplo **Product owner** o
> **Product admin**); un inquilino con el que trabajar (aquí `acme`, consulta
> [Inquilinos](help:tenants)); y un terminal con `curl`. Todos los ID, claves y direcciones que
> aparecen a continuación son ejemplos: usa los tuyos.

## Paso 1: Crear el medidor {#step-meter}

1. Abre [Uso](app:usage), pestaña **Medidores**, y elige **Nuevo medidor**.
2. Introduce:

   | Campo                           | Valor                      |
   | ------------------------------- | -------------------------- |
   | **Clave**                       | `api_calls`                |
   | **Nombre**                      | Llamadas a la API          |
   | **Unidad**                      | llamadas                   |
   | **Agregación**                  | **Suma**                   |
   | **Período de restablecimiento** | **Período de facturación** |
   | **Límite predeterminado**       | `100`                      |
   | **Aplicación**                  | **Límite estricto**        |

3. Elige **Crear medidor**.

El límite predeterminado de 100 se aplica a los inquilinos sin límite del plan, por ejemplo los
inquilinos sin suscripción. **Período de facturación** hace que el contador siga el ciclo de
suscripción de cada inquilino. Detalles: [Uso y cuotas](help:usage#create-meter).

## Paso 2: Crear un plan con prestaciones {#step-plan}

1. Abre [Planes](app:plans) y elige **Nuevo plan**.
2. **Nombre**: Starter, **Clave**: `starter`, **Días de prueba**: `0`, **Activo** encendido.
3. Deja **Precios** vacío. El plan es gratuito, así que la suscripción empieza de inmediato con
   cualquier proveedor de pagos.
4. En **Prestaciones**, elige **Añadir prestación** dos veces:
   - **Tipo** **Límite**, **Clave del medidor** `api_calls`, **Límite** `1000`;
   - **Tipo** **Función**, **Nombre de la función** `export`, **Activada** encendido.
5. Elige **Crear plan**.

El plan lleva ahora `limit.api_calls: 1000` y `feature.export: true`. Detalles:
[Prestaciones](help:plans-subscriptions#entitlements).

> [!NOTE]
> Un plan de pago funciona igual, pero para suscribirse hace falta un checkout en el proveedor de
> pagos (salvo que el servidor use el proveedor manual). Consulta
> [Suscribir a un inquilino](help:plans-subscriptions#subscribe).

## Paso 3: Suscribir al inquilino {#step-subscribe}

1. Abre [Suscripciones](app:subscriptions). En **Facturación de un inquilino**, elige `acme` y
   selecciona **Abrir**.
2. En **Suscripción**, elige **Suscribir a un plan**, después **Starter (starter)** y elige
   **Suscribir**.
3. La suscripción aparece como **Activa**. **Prestaciones efectivas** lista `export: on` en
   **Funciones** y `api_calls` 1000 en **Límites**.

## Paso 4: Crear una clave de API para registrar uso {#step-api-key}

1. Abre [Claves de API](app:apiKeys) y elige **Nueva clave de API**.
2. **Nombre**: `usage-demo`. En **Ámbito de inquilino**, elige `acme`, para que la clave solo pueda
   acceder a este inquilino.
3. En **Permisos**, selecciona `usage:record` y `usage:read`.
4. Crea la clave y copia el secreto. Solo se muestra una vez.

Guarda en tu terminal los valores que necesitas (valores de ejemplo):

```bash
export AX=https://axentra.example.com
export PID=prd_01EXAMPLE
export TID=ten_01EXAMPLE
export KEY=axk_EXAMPLE_secret
```

El ID del producto aparece en la página del producto; el ID del inquilino, en la página del
inquilino y en su página de facturación. Consulta [Claves de API](help:api-keys) y
[Conceptos básicos de la API](help:api-basics).

## Paso 5: Registrar uso {#step-record}

Registra una llamada a la API. Cada evento distinto necesita su propia `Idempotency-Key`; tu
producto usaría su ID de solicitud.

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0001" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 1, "properties": {"endpoint": "/reports"}}'
```

La respuesta (`201 Created`, abreviada) contiene el evento y la cuota resultante:

```json
{
  "event": {
    "id": "uev_01EXAMPLE",
    "meter": "api_calls",
    "quantity": 1,
    "idempotency_key": "demo-0001"
  },
  "replayed": false,
  "quota": {
    "meter": "api_calls",
    "used": 1,
    "reserved": 0,
    "limit": 1000,
    "remaining": 999,
    "enforcement": "hard",
    "source": "plan",
    "over_limit": false
  }
}
```

Ejecuta de nuevo el mismo comando: la respuesta es `200` con `"replayed": true` y el uso sigue
contando una sola vez. Eso es lo que hace seguros los reintentos tras un error de red.

Ahora registra un lote más grande con una clave nueva:

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0002" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 950}'
```

`remaining` vale ahora 49.

## Paso 6: Seguir la cuota en Studio {#step-watch}

1. Abre [Uso](app:usage), pestaña **Uso por inquilino**, y elige `acme` (o selecciona **Uso** en la
   cabecera de la página de facturación del inquilino).
2. La tarjeta `api_calls` muestra 951 llamadas, una barra al 95 %, los distintivos **Del plan** y
   **Límite estricto**, y **Restante** 49 llamadas.
3. **Eventos de uso** lista los dos eventos con sus claves de idempotencia y la propiedad
   `endpoint`.
4. **Uso diario** muestra la barra de hoy, y la pestaña **Resumen** muestra `acme` en **Totales por
   inquilino**.

## Paso 7: Superar el límite {#step-exceed}

Intenta registrar 50 llamadas más (951 + 50 > 1000):

```bash
curl -sS -i -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0003" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 50}'
```

El servidor responde `429` con una cabecera `Retry-After` y un cuerpo de problema como este
(abreviado):

```json
{
  "code": "quota_exceeded",
  "status": 429,
  "detail": "the api_calls limit of this period would be exceeded",
  "meter": "api_calls",
  "limit": 1000,
  "used": 951,
  "reserved": 0,
  "requested": 50,
  "period_end": "2026-12-02T00:00:00+00:00"
}
```

No se registró nada. Ahora tu producto rechazaría la solicitud del cliente u ofrecería una mejora
de plan.

## Paso 8: Dar más margen al inquilino {#step-override}

Supón que acuerdas dar a `acme` 2000 llamadas en este período:

1. En **Uso por inquilino**, elige **Establecer excepción** en la tarjeta `api_calls`.
2. Introduce **Límite** `2000`, mantén **Límite estricto** y elige **Guardar excepción**.
3. El distintivo cambia a **Excepción del inquilino**. Repite la solicitud del paso 7: se acepta
   con `"source": "quota"`.

Elige **Quitar excepción** para volver al límite del plan. Para cambiar el límite de todos los
inquilinos del plan, edita en su lugar la prestación del plan. Detalles: [De dónde viene el límite
efectivo](help:usage#limit-source).

## Qué hace tu producto con esto {#in-your-product}

- Antes de una acción que consume un recurso medido, registra el uso. Trata `429 quota_exceeded`
  como «límite alcanzado» y muestra al cliente un mensaje claro.
- Lee las funciones del inquilino con
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements` y activa la exportación
  solo cuando `features.export` sea `true`.
- Para trabajos que llevan tiempo, reserva primero y confirma después; consulta
  [Reservas](help:usage#reservations).

## Limpieza {#clean-up}

- Revoca la clave `usage-demo` en [Claves de API](app:apiKeys).
- Cancela la suscripción en la página de facturación del inquilino con **Cancelar ahora** si no la
  necesitas.
- El medidor no se puede eliminar porque tiene uso. **Desactívalo** si no lo quieres.
- El plan no se puede eliminar porque lo usó una suscripción. **Desactívalo**.

## Solución de problemas {#troubleshooting}

| Qué ves                                                        | Por qué                                                                    | Qué hacer                                                                           |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `401`                                                          | La clave es incorrecta, está revocada o ha caducado                        | Comprueba `$KEY`; crea una clave nueva                                              |
| `403`                                                          | A la clave le falta `usage:record`, o está vinculada a otro inquilino      | Comprueba los permisos y el **Ámbito de inquilino** de la clave                     |
| `404`                                                          | ID de producto o de inquilino incorrecto, o la clave del medidor no existe | Compara los ID con Studio; comprueba la clave del medidor                           |
| `409` «el medidor está inactivo»                               | Se desactivó el medidor                                                    | **Actívalo** en **Medidores**                                                       |
| `409` por la clave de idempotencia                             | La clave ya se usó antes con otro cuerpo                                   | Usa una `Idempotency-Key` nueva                                                     |
| `422`                                                          | Falta `Idempotency-Key`, o la cantidad no es válida                        | Envía la cabecera; usa una cantidad igual o mayor que 0 con 6 decimales como máximo |
| La tarjeta muestra **Predeterminado del medidor** y límite 100 | La suscripción no está activa, o el plan no tiene `limit.api_calls`        | Revisa los pasos 2 y 3                                                              |
| `429` antes de lo esperado                                     | Las reservas u otros eventos también cuentan                               | Mira **Reservado** y **Eventos de uso**                                             |

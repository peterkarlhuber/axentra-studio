---
title: Planes y suscripciones
summary: Crea planes con precios y prestaciones, suscribe inquilinos, gestiona sus suscripciones y entiende el proveedor de pagos.
keywords: facturación, plan, tarifas, precio, nivel, suscripción, prestación, función, feature flag, límite, prueba, cancelar, pago vencido, Stripe, checkout, proveedor de pagos, facturación manual
---

Un **plan** describe lo que recibe un inquilino: sus precios, la duración de la prueba y sus
**prestaciones** (funciones activadas o desactivadas y límites de uso por medidor). Una
**suscripción** vincula un inquilino con un plan y tiene un estado, como **En prueba**, **Activa** o
**Pago vencido**. Tu producto consulta a Axentra las prestaciones efectivas de un inquilino para
decidir qué puede hacer; el módulo de uso toma de ellas sus cuotas predeterminadas. Los operadores
del producto usan estas pantallas para configurar planes y ayudar a los clientes con sus
suscripciones.

> [!IMPORTANT]
> Estas pantallas necesitan el módulo `billing` en el servidor; sin él, **Planes** y
> **Suscripciones** no aparecen. **Planes** y **Suscripciones** requieren `billing:read` mediante
> un rol de producto; la página de facturación de un inquilino requiere `billing:read` en ese
> inquilino. Cualquier cambio requiere `billing:manage`. Consulta
> [Roles y permisos](help:roles-permissions).

> [!CAUTION]
> Studio nunca pide datos de tarjeta ni bancarios, y Axentra no guarda ninguno. Los datos de pago
> solo se introducen en la página de checkout alojada del proveedor de pagos. Las facturas, los
> impuestos, los recibos y los reembolsos los gestionan el proveedor y el operador, no Axentra.

## Crear un plan {#create-plan}

1. Abre [Planes](app:plans) (grupo **Uso y facturación**) y elige **Nuevo plan**.
2. Introduce un **Nombre** y una **Clave**, por ejemplo `pro`. La clave no se puede cambiar
   después; tu producto y la API se refieren al plan con ella.
3. Opcional: **Descripción** y **Días de prueba** (de 0 a 365). Las suscripciones nuevas a un plan
   con días de prueba empiezan en **En prueba**.
4. Deja **Activo** encendido para que el plan se pueda elegir en suscripciones nuevas.
5. En **Precios**, elige **Añadir precio** para cada precio (consulta
   [Precios](help:plans-subscriptions#prices)). Sin precios, el plan es gratuito.
6. En **Prestaciones**, añade funciones y límites (consulta
   [Prestaciones](help:plans-subscriptions#entitlements)).
7. Elige **Crear plan**.

### Configuración del plan {#plan-settings}

| Ajuste             | Qué hace                                                                           | Valores permitidos / predeterminado                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Nombre**         | Nombre visible                                                                     | De 1 a 200 caracteres; obligatorio                                                                             |
| **Clave**          | Identificador del plan                                                             | Letras minúsculas, dígitos, `_` y `-`, empezando por una letra, como máximo 63 caracteres; no se puede cambiar |
| **Descripción**    | Texto libre                                                                        | Como máximo 2000 caracteres                                                                                    |
| **Días de prueba** | Duración de la prueba de las suscripciones nuevas                                  | De 0 a 365; predeterminado 0 (sin prueba)                                                                      |
| **Activo**         | Solo los planes activos se pueden elegir en suscripciones nuevas y cambios de plan | Activado por defecto                                                                                           |
| **Precios**        | Importe, moneda, intervalo e ID de precio del proveedor                            | Como máximo 20 por plan                                                                                        |
| **Prestaciones**   | Funciones y límites                                                                | Como máximo 200 entradas                                                                                       |

### Precios {#prices}

Cada precio tiene un **Importe**, una **Moneda**, un **Intervalo** y un **ID de precio del
proveedor** opcional.

- Introduce el importe en unidades monetarias normales, por ejemplo `19.90`. Axentra lo guarda como
  un número entero en unidades menores (céntimos); Studio muestra el valor guardado debajo del campo
  («Se guarda como 1990 unidades menores»). Las monedas sin unidades menores (como JPY) admiten
  solo números enteros.
- **Moneda** es un código ISO 4217 de tres letras, como `EUR` o `USD`.
- **Intervalo**: **mes** o **año**. También determina la duración del período de facturación de la
  suscripción.
- **ID de precio del proveedor**: con Stripe, el ID del precio que creaste en Stripe (letras,
  dígitos y `_`, por ejemplo `price_1EXAMPLE`). Axentra asigna con él las actualizaciones de Stripe
  al plan.

Un plan sin precios, o solo con precios cero, es **Gratuito**. Un plan puede tener varios precios
(por ejemplo, mensual y anual); en ese caso eliges uno al suscribir a un inquilino. Las
suscripciones existentes conservan una copia del precio con el que se iniciaron, así que los
cambios de precio posteriores no les afectan.

### Prestaciones {#entitlements}

Las prestaciones son una lista plana de claves. En el editor, elige el **Tipo** de cada fila:

| Tipo        | Se guarda como                                     | Valor                                                    |
| ----------- | -------------------------------------------------- | -------------------------------------------------------- |
| **Función** | `feature.<name>`, por ejemplo `feature.sso`        | **Activada** encendido o apagado                         |
| **Límite**  | `limit.<meter key>`, por ejemplo `limit.api_calls` | Un número igual o mayor que 0; vacío significa ilimitado |

Los nombres usan letras minúsculas, dígitos, `_` y `.`, empezando por una letra. Un **Límite**
establece la cuota del medidor de uso con esa clave por período de restablecimiento; si el módulo
`usage` es legible, Studio sugiere las claves de medidor existentes. Un límite para una clave sin
medidor no tiene efecto. Los límites del plan usan la aplicación del medidor (estricta o flexible).
Consulta [Uso y cuotas](help:usage#limit-source).

Qué significa una función como `feature.sso` lo decide tu producto: Axentra solo la guarda y la
devuelve.

## Editar, desactivar o eliminar un plan {#edit-plan}

En el menú de acciones de la fila (**Acciones para el plan …**):

- **Editar** cambia todo salvo la clave. Las prestaciones modificadas se aplican de inmediato a
  todos los inquilinos del plan. Los precios modificados solo se aplican a suscripciones nuevas.
- **Desactivar** oculta el plan para suscripciones nuevas y cambios de plan. Las suscripciones
  existentes continúan. **Activar** lo revierte.
- **Eliminar plan** borra un plan que no usa ninguna suscripción; lo confirmas escribiendo la clave
  del plan. Los planes en uso (también por suscripciones canceladas) no se pueden eliminar;
  desactívalos en su lugar.

## Resumen de suscripciones {#subscriptions}

[Suscripciones](app:subscriptions) lista las suscripciones de todos los inquilinos, las más
recientes primero, con **Inquilino**, **Plan**, **Estado**, **Precio**, **Fin del período**, **Fin
de la prueba** y **Proveedor**. Filtra por **Estado** y **Plan**. Selecciona un inquilino para abrir
su página de facturación.

Para abrir un inquilino que aún no tiene suscripción, elígelo en **Facturación de un inquilino** y
selecciona **Abrir**.

### Estados de la suscripción {#status}

| Estado           | Significado                              | Se aplican las prestaciones |
| ---------------- | ---------------------------------------- | --------------------------- |
| **Incompleta**   | Esperando el checkout en el proveedor    | No                          |
| **En prueba**    | Los días de prueba están en curso        | Sí                          |
| **Activa**       | Suscripción en curso                     | Sí                          |
| **Pago vencido** | El pago está atrasado; período de gracia | Sí                          |
| **Cancelada**    | Terminada; definitivo                    | No                          |

Cambios permitidos: Incompleta → En prueba, Activa o Cancelada; En prueba → Activa, Pago vencido o
Cancelada; Activa → Pago vencido o Cancelada; Pago vencido → Activa o Cancelada. Una suscripción
cancelada no se puede reactivar: vuelve a suscribir al inquilino.

## Suscribir a un inquilino {#subscribe}

1. Abre la página de facturación del inquilino (desde **Suscripciones** o **Facturación de un
   inquilino**).
2. En **Suscripción**, elige **Suscribir a un plan**.
3. Elige el plan en **Elige un plan**, y el **Precio** si el plan tiene varios.
4. Elige **Suscribir**.

Lo que ocurre depende del plan y del proveedor de pagos:

- Los **planes gratuitos**, y cualquier plan con el proveedor **Manual**, empiezan de inmediato en
  **En prueba** (si el plan tiene días de prueba) o **Activa**.
- Los **planes de pago con el proveedor de prueba o con Stripe** necesitan un checkout. El botón
  dice **Iniciar checkout**. Studio crea una sesión de checkout y muestra **Abrir página de
  checkout**, que abre la página alojada del proveedor en una pestaña nueva. La suscripción sigue
  **Incompleta** hasta que el proveedor confirma el pago mediante su webhook.
- Cuando los **Pagos reales** están activados, Studio no inicia checkouts con dinero real. Usa el
  flujo de checkout de tu propio producto.

Un inquilino tiene como máximo una suscripción vigente (no cancelada).

## Cambiar el plan {#change-plan}

**Cambiar de plan** pasa al inquilino a otro plan activo (o a otro precio del mismo plan). No hay
prorrateo: Axentra no calcula abonos ni cargos adicionales. Las prestaciones del nuevo plan se
aplican de inmediato.

- Las suscripciones de Stripe se cambian en Stripe (por ejemplo, en el portal de clientes de
  Stripe); después, el webhook actualiza Axentra. Studio oculta **Cambiar de plan** para ellas.
- Una suscripción creada sin pago (manual) no se puede cambiar a un plan de pago mientras haya un
  proveedor real configurado; cancélala y vuelve a suscribir con un checkout.
- Las suscripciones **Incompleta** no pueden cambiar de plan; termina o reinicia el checkout.

## Cancelar o reanudar {#cancel}

- **Cancelar al final del período**: la suscripción sigue siendo utilizable hasta el final del
  período actual y después termina. **Reanudar** retira la cancelación programada.
- **Cancelar ahora**: la suscripción termina de inmediato y sus prestaciones dejan de aplicarse.
  Lo confirmas escribiendo la clave del plan. No se puede deshacer.

En las suscripciones de Stripe, Axentra transmite primero la cancelación a Stripe.

> [!IMPORTANT]
> Con el proveedor **Manual**, las pruebas terminan, los períodos avanzan y «cancelar al final del
> período» surte efecto solo cuando el operador ejecuta la tarea de facturación programada
> (`advance_periods`, por ejemplo cada hora). Si las pruebas nunca terminan, pide a tu operador que
> la programe.

## Establecer el estado (proveedor manual) {#set-status}

Con el proveedor **Manual** cobras fuera de Axentra y registras el resultado. Elige **Establecer
estado** y después el **Nuevo estado**: por ejemplo, **Pago vencido** cuando una factura no está
pagada, o **Activa** cuando se ha pagado. Solo se ofrecen las transiciones permitidas. Establecer
**Activa** durante una prueba termina la prueba en ese momento. Las suscripciones de otros
proveedores reciben su estado de los webhooks del proveedor.

## Prestaciones efectivas y excepciones {#overrides}

**Prestaciones efectivas**, en la página de facturación del inquilino, muestra lo que el inquilino
recibe ahora: el **Plan** (con su estado), **Funciones**, **Límites** y **Excepciones**. Son las
prestaciones del plan mientras la suscripción está en **En prueba**, **Activa** o **Pago vencido**,
combinadas con las excepciones del inquilino. Sin una suscripción así, el inquilino solo recibe sus
excepciones (**Sin suscripción con prestaciones**).

Para dar a un inquilino algo distinto de su plan, elige **Editar excepciones**, añade o cambia
filas en el mismo editor que para los planes y elige **Guardar excepciones**.

> [!WARNING]
> Al guardar se sustituyen todas las excepciones del inquilino. Una fila que quites de la lista se
> quita del inquilino. Las excepciones se mantienen cuando cambia el plan o termina la suscripción.

Para subir solo un límite de uso, una excepción de cuota en la pantalla **Uso** suele ser más
clara; consulta [Uso y cuotas](help:usage#quota-override). **Uso**, en la cabecera de la página,
abre el uso del inquilino.

## Proveedor de pagos {#payment-provider}

La tarjeta **Proveedor de pagos** en **Planes** y **Suscripciones** muestra la configuración del
servidor:

| Proveedor                  | Comportamiento                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manual**                 | El pago se cobra fuera de Axentra. Las suscripciones se crean directamente y un operador establece su estado.                                  |
| **Doble de prueba (fake)** | Proveedor de prueba determinista sin acceso a la red; los planes de pago pasan por un checkout simulado. El servidor lo rechaza en producción. |
| **Stripe**                 | Los planes de pago pasan por Stripe Checkout; los webhooks de Stripe actualizan las suscripciones.                                             |

**Pagos reales** indica si están activados los pagos con dinero real (solo Stripe). **Checkout
desde Studio** indica si Studio puede iniciar un checkout alojado: solo con el proveedor de prueba
o con Stripe con los pagos reales desactivados.

El proveedor lo elige el operador en la configuración del servidor (`billing.provider`); no se
puede cambiar en Studio. La tarjeta requiere `platform:settings` o `product:manage`; de lo
contrario, indica que la configuración no es visible para ti. Consulta
[Configuración](help:settings) y [Configuración del servidor](help:server-configuration).

## Para desarrolladores {#developers}

- Lee las prestaciones efectivas de un inquilino con
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements`
  (`billing:read`). La respuesta contiene `features` (nombre → true/false), `limits` (clave de
  medidor → número, o `null` si es ilimitado), `plan_key`, `subscription_status` y `overrides`.
- Las compras de autoservicio de los inquilinos pasan por el backend de tu producto con una clave
  de API que tiene `billing:manage`; no existe ningún permiso de inquilino para el checkout de
  autoservicio.
- Las direcciones de retorno del checkout (`success_url`, `cancel_url`) deben empezar por la URL
  pública del servidor o por uno de sus orígenes permitidos. Studio usa la dirección de su propia
  página.
- Los cambios de suscripción se auditan (`billing.subscription.*`) y, si el módulo de eventos está
  activado, se publican como eventos con el mismo nombre, para que un webhook pueda reaccionar a
  ellos. Consulta [Eventos](help:events).
- Los webhooks de Stripe se verifican por firma y se procesan una sola vez por ID de evento; los
  eventos obsoletos se ignoran.

## Conviene saber {#good-to-know}

- No hay prorrateo, cupones, impuestos, facturas, cantidades de puestos ni precios basados en el
  uso.
- No hay endpoint de portal de clientes; los cambios de plan de Stripe se hacen en Stripe.
- `past_due` mantiene las prestaciones; decide en tu producto si quieres restringir algo.
- Consulta [Limitaciones conocidas](help:limitations).

## Solución de problemas {#troubleshooting}

| Qué ves                                                                              | Por qué                                                                                  | Qué hacer                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Sin acceso a la facturación**                                                      | Tu rol no tiene `billing:read` (a nivel de producto para **Planes** y **Suscripciones**) | Pide a un administrador del producto un rol adecuado                                            |
| **Conflicto** al eliminar un plan                                                    | Hay suscripciones que usan el plan                                                       | **Desactívalo** en su lugar                                                                     |
| **Conflicto** «a plan with this key exists»                                          | Las claves de plan son únicas por producto                                               | Elige otra clave                                                                                |
| Falta un plan en **Elige un plan**                                                   | Está inactivo                                                                            | Actívalo en **Planes**                                                                          |
| **Conflicto** «paid plans need a checkout …»                                         | Suscripción a un plan de pago con el proveedor de prueba o con Stripe                    | Usa **Iniciar checkout**, o el checkout propio del producto si los pagos reales están activados |
| «Este plan de pago necesita un checkout, que el servidor no ofrece aquí»             | Los pagos reales están activados, o no conoces el proveedor                              | Usa el checkout de tu producto                                                                  |
| **Conflicto** «the tenant already has a subscription»                                | Existe una suscripción vigente                                                           | Usa **Cambiar de plan** o cancela primero                                                       |
| **No disponible en este modo** al cambiar el plan                                    | Stripe gestiona la suscripción                                                           | Cámbiala en Stripe                                                                              |
| **Revisa los datos introducidos**: «redirect URLs must start with an allowed origin» | La dirección de Studio no es la URL pública del servidor ni un origen permitido          | Pide al operador que añada el origen de Studio a `security.allowed_origins`                     |
| La suscripción sigue **Incompleta**                                                  | No se terminó el checkout, o el webhook no llega al servidor                             | Vuelve a abrir el checkout; pide al operador que compruebe el endpoint y el secreto del webhook |
| La prueba no termina (manual)                                                        | La tarea de facturación no está programada                                               | Pide al operador que programe `advance_periods`                                                 |
| **Modificado mientras tanto**                                                        | Otra persona cambió el plan o la suscripción                                             | Recarga y repite                                                                                |
| Los límites no se aplican tras la cancelación                                        | Las suscripciones canceladas no conceden prestaciones                                    | Es lo esperado; se aplica el predeterminado del medidor o la excepción de cuota                 |

---
title: Uso y cuotas
summary: Define medidores, sigue el uso de cada inquilino, establece excepciones de cuota y consulta reservas.
keywords: uso, medición, medidor, cuota, límite, consumo, contador, reserva, límite estricto, límite flexible, exceso, llamadas a la API, período de restablecimiento
---

La medición de uso cuenta cuánto consume cada inquilino de algo que mide tu producto: llamadas a
la API, bytes almacenados, informes generados. Defines los **medidores** en Studio; tu producto
registra **eventos de uso** contra ellos a través de la API. Axentra suma los eventos por inquilino
y período, compara el resultado con el **límite** del inquilino (de una excepción de cuota, del
plan o del valor predeterminado del medidor) y rechaza o marca el uso que lo supera. Los operadores
del producto usan esta pantalla para definir medidores y vigilar el consumo; el equipo de soporte
la usa para responder a «¿por qué se rechazó mi solicitud?».

> [!IMPORTANT]
> La pantalla **Uso** necesita el módulo `usage` en el servidor. Sin él, **Uso** no aparece en la
> navegación. Para leer se necesita `usage:read`; para definir medidores y excepciones de cuota, el
> permiso de producto `usage:manage`; para confirmar o liberar reservas, `usage:record` en el
> inquilino. Consulta [Roles y permisos](help:roles-permissions).

## Qué muestra la pantalla {#overview}

Abre [Uso](app:usage) (grupo **Uso y facturación**). La página tiene tres pestañas:

| Pestaña               | Muestra                                                                                   | Quién la ve                                                          |
| --------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Resumen**           | Un gráfico diario de un medidor para todos los inquilinos y los **Totales por inquilino** | `usage:read` a nivel de producto (roles de producto y de plataforma) |
| **Medidores**         | Las definiciones de los medidores                                                         | `usage:read` a nivel de producto                                     |
| **Uso por inquilino** | Límites, gráfico, eventos y reservas de un inquilino                                      | `usage:read` en al menos un inquilino                                |

Quien solo tiene un rol de inquilino (por ejemplo, el rol de inquilino **Member**) ve únicamente
la pestaña **Uso por inquilino**, y solo para los inquilinos en los que tiene `usage:read`.

### Leer el resumen {#overview-chart}

1. Elige un **Medidor** y un **Intervalo de tiempo** (**Últimos 7 días**, **Últimos 30 días** o
   **Últimos 90 días**).
2. **Uso diario, todos los inquilinos** muestra una barra por día UTC. **Mostrar tabla de datos**,
   debajo del gráfico, presenta cada día en una tabla, que también funciona con lectores de
   pantalla.
3. **Totales por inquilino** lista cada inquilino con uso en el intervalo, su **Valor** y el número
   de **Eventos**. Selecciona el nombre de un inquilino para abrir su pestaña **Uso por inquilino**.

Cómo se forma el total depende de la agregación del medidor: **Suma** suma los valores diarios,
**Máximo** toma el valor diario más alto y **Último valor** toma el valor del último día con uso.
Todos los días son días UTC, así que un día puede empezar por la tarde o por la mañana de tu hora
local.

El **Panel** del producto tiene una tarjeta **Uso este mes** con los totales por medidor desde el
primer día del mes UTC en curso.

## Crear un medidor {#create-meter}

Un medidor define _qué_ se mide. Por sí solo no registra nada.

1. Abre la pestaña **Medidores** y elige **Nuevo medidor**.
2. Introduce una **Clave**, por ejemplo `api_calls`. Tu producto envía el uso con esta clave.
3. Opcional: **Nombre**, **Unidad** (se muestra junto a los valores, por ejemplo `calls`) y
   **Descripción**.
4. Elige la **Agregación** y el **Período de restablecimiento** (consulta la tabla siguiente).
5. Opcional: un **Límite predeterminado** y su **Aplicación**.
6. Elige **Crear medidor**.

> [!WARNING]
> La **Clave**, la **Agregación** y el **Período de restablecimiento** no se pueden cambiar después
> de crear el medidor. Si te equivocaste, crea un medidor nuevo con otra clave.

### Configuración del medidor {#meter-settings}

| Ajuste                          | Qué hace                                                                                                                                                                                         | Valores permitidos / predeterminado                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Clave**                       | Identificador que usan las llamadas a la API de tu producto y las prestaciones de los planes (`limit.<key>`)                                                                                     | Letras minúsculas, dígitos, `_` y `.`, empezando por una letra, como máximo 63 caracteres |
| **Nombre**                      | Nombre visible                                                                                                                                                                                   | Como máximo 200 caracteres; opcional                                                      |
| **Unidad**                      | Se muestra detrás de los valores                                                                                                                                                                 | Texto libre; opcional                                                                     |
| **Agregación**                  | Cómo se combinan los eventos de un período: **Suma** suma las cantidades, **Máximo** conserva la más alta, **Último valor** conserva el valor del evento con la fecha de ocurrencia más reciente | `sum` (predeterminado), `max`, `last`                                                     |
| **Período de restablecimiento** | Cuándo vuelve a empezar el contador: **Nunca se restablece**, **Diario (UTC)**, **Mensual (UTC)**, **Período de facturación**                                                                    | Predeterminado **Mensual (UTC)**                                                          |
| **Límite predeterminado**       | Límite para los inquilinos sin excepción y sin límite del plan; vacío significa ilimitado                                                                                                        | Número igual o mayor que 0; vacío                                                         |
| **Aplicación**                  | **Límite estricto** rechaza el uso por encima del límite; **Límite flexible** lo registra e informa del exceso                                                                                   | Predeterminado **Límite estricto**                                                        |

Elige la agregación según lo que midas: los eventos que se acumulan (llamadas, mensajes) usan
**Suma**; un nivel que muestreas (almacenamiento en bytes, puestos activos) usa **Máximo** o
**Último valor**.

### Períodos de restablecimiento y período de facturación {#reset-period}

**Período de facturación** sigue el ciclo de la suscripción del inquilino: el período empieza el
día en que empezó la suscripción (por ejemplo, el día 15) y dura un mes o un año, según el
intervalo del precio. Un día de inicio como el 31 se traslada al último día de los meses más
cortos. Si el módulo `billing` no está activado, o el inquilino no tiene ninguna suscripción en
**En prueba**, **Activa** o **Pago vencido**, el período es el mes natural (UTC). Consulta [Planes y
suscripciones](help:plans-subscriptions).

### Períodos fijos, no ventanas deslizantes {#fixed-periods}

Los límites se aplican por período, y los períodos tienen límites fijos: medianoche UTC para los
medidores diarios y el día 1 del mes (UTC) para los mensuales. Un inquilino puede consumir todo su
límite diario a las 23:50 UTC y de nuevo todo el límite a las 00:10 UTC. No hay ventanas de cuota
por horas ni deslizantes. Si necesitas una ventana más estrecha, usa un medidor `day` con un límite
menor o un medidor adicional.

Las cuotas no son lo mismo que el límite de frecuencia de solicitudes del servidor (solicitudes por
minuto por clave o IP). Ese límite lo configura el operador y está desactivado por defecto;
consulta [Configuración del servidor](help:server-configuration).

## Editar, desactivar o eliminar un medidor {#edit-meter}

En el menú de acciones de la fila (**Acciones para el medidor …**):

- **Editar** cambia **Nombre**, **Unidad**, **Descripción**, **Límite predeterminado** y
  **Aplicación**.
- **Desactivar** detiene el uso nuevo del medidor: se rechaza cualquier registro contra un medidor
  inactivo. Los medidores inactivos ya no aparecen en **Uso en el período** de un inquilino.
  **Activar** lo revierte.
- **Eliminar medidor** borra un medidor que nunca ha registrado uso. Lo confirmas escribiendo la
  clave. Un medidor con uso registrado no se puede eliminar; desactívalo en su lugar.

## Consultar el uso y los límites de un inquilino {#tenant-usage}

1. Abre la pestaña **Uso por inquilino** y elige el inquilino (o selecciona uno en **Totales por
   inquilino**).
2. **Uso en el período** muestra una tarjeta por cada medidor activo con:
   - el valor del período actual y, para los medidores con límite, una barra con
     «_usado_ de _límite_ usado (_n_ %), incluidas las reservas»;
   - de dónde viene el límite (ver más abajo) y **Límite estricto** o **Límite flexible**;
   - **Por encima del límite** cuando el uso con límite flexible superó el límite;
   - **Período**, **Eventos**, **Reservado** (si lo hay) y **Restante**.
3. Para ver un período anterior, elige una fecha en **Período que contiene**. Déjalo vacío para el
   período actual.

A continuación aparecen **Uso diario** (un gráfico por medidor, con los mismos intervalos que el
resumen), **Eventos de uso** (los más recientes primero, con filtro por **Medidor**) y **Reservas**.

### De dónde viene el límite efectivo {#limit-source}

Gana la primera coincidencia:

| Distintivo                     | Origen                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Excepción del inquilino**    | Una excepción de cuota establecida para este inquilino en esta pantalla                                                           |
| **Del plan**                   | La prestación `limit.<meter key>` del plan del inquilino, o una excepción de prestación en la página de facturación del inquilino |
| **Predeterminado del medidor** | El **Límite predeterminado** del medidor                                                                                          |
| **Sin límite**                 | Ninguno de los anteriores: ilimitado                                                                                              |

Un límite del plan solo se aplica mientras la suscripción está en **En prueba**, **Activa** o
**Pago vencido**. Los límites del plan usan la **Aplicación** del medidor; solo una excepción de
cuota define la suya propia.

> [!NOTE]
> Hay dos tipos de excepciones de inquilino. Una **excepción de cuota** (esta pantalla) sustituye el
> límite de un medidor, incluida su aplicación, y siempre gana. Una **excepción de prestación** en
> la página de facturación del inquilino sustituye una prestación del plan y aparece como **Del
> plan**. Usa un solo mecanismo por medidor para que sea fácil de entender.

## Establecer o quitar una excepción de cuota {#quota-override}

Requiere el permiso de producto `usage:manage`.

1. En **Uso en el período**, elige **Establecer excepción** en la tarjeta del medidor.
2. Introduce un **Límite**. Déjalo vacío para una excepción ilimitada (el inquilino no tendrá
   límite aunque su plan lo tenga).
3. Elige la **Aplicación** y **Guardar excepción**.

El distintivo cambia a **Excepción del inquilino**. **Quitar excepción** (solo aparece en tarjetas
con una excepción del inquilino) hace que vuelva a aplicarse el límite del plan o el predeterminado
del medidor. Las excepciones surten efecto a partir del siguiente uso registrado; el uso ya
registrado se mantiene. Los cambios de cuota quedan reflejados en el registro de auditoría.

## Límites estrictos y flexibles {#enforcement}

- **Límite estricto**: una solicitud que superaría el límite se rechaza con HTTP `429` y el código
  de error `quota_exceeded`, que incluye el medidor, el límite, las cantidades usada, reservada y
  solicitada, y cuándo termina el período. Para los medidores de **Suma** la comprobación es
  _usado + reservado + solicitado > límite_; para los de **Máximo** y **Último valor** es
  _solicitado > límite_.
- **Límite flexible**: el uso siempre se registra. La respuesta y Studio indican **Por encima del
  límite**, para que tu producto pueda avisar o facturar el exceso.

Las solicitudes simultáneas nunca sobrepasan un límite estricto: Axentra serializa las escrituras
de un mismo inquilino, medidor y período.

## Registrar uso (API) {#record-usage}

Studio no registra uso. Tu producto llama a la API con una clave que tiene `usage:record`
(consulta [Claves de API](help:api-keys)):

```http
POST /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/usage/events
Authorization: Bearer axk_EXAMPLE_secret
Idempotency-Key: req-7f3a9c
Content-Type: application/json

{"meter": "api_calls", "quantity": 1}
```

- La cabecera `Idempotency-Key` es obligatoria (de 1 a 200 caracteres ASCII imprimibles). Repetir
  la misma clave con el mismo cuerpo devuelve el evento original (`200`, `replayed: true`) y cuenta
  una sola vez. La misma clave con un cuerpo distinto se rechaza con `409`.
- `quantity`: un número de 0 a 10^15 con 6 decimales como máximo.
- `occurred_at` (opcional): como máximo 5 minutos en el futuro y 400 días en el pasado. Los eventos
  con fecha anterior cuentan en el período al que pertenecen, aunque ya haya terminado.
- `properties` (opcional): un objeto JSON de 4 KB como máximo, que se muestra en **Eventos de uso**.
- `"enforce": false` registra sin la comprobación del límite estricto; requiere el permiso de
  producto `usage:manage`, que las claves vinculadas a un inquilino nunca tienen.

El tutorial [Planes y uso de principio a fin](help:tutorial-plan-usage) recorre un ejemplo
completo.

## Reservas {#reservations}

Para trabajos de larga duración, un producto puede **reservar** una cantidad antes de empezar (API:
`POST …/usage/reservations` con `meter`, `quantity` y `ttl_seconds` de 1 a 86 400, predeterminado
300). Una reserva activa cuenta contra el límite, de modo que varias tareas en paralelo no pueden
superarlo entre todas. Cuando el trabajo termina, el producto **confirma** la cantidad real, lo que
registra un evento de uso, o **libera** la reserva. Las reservas solo existen para medidores de
**Suma**.

La API no tiene una lista de reservas, así que Studio busca cada una por su ID:

1. En **Reservas**, pega el **ID de la reserva** y elige **Buscar**.
2. Studio muestra **Estado**, medidor, **Cantidad reservada**, **Caduca** y, una vez confirmada, la
   **Cantidad confirmada** y el **Evento de uso**.
3. Con `usage:record` en el inquilino, puedes terminar aquí una reserva **Activa**:
   - **Confirmar** registra la **Cantidad real** (déjala vacía para confirmar la cantidad
     reservada). El límite nunca rechaza una confirmación, porque el trabajo ya está hecho.
   - **Liberar** devuelve la cantidad sin registrar uso.

| Estado         | Significado                                                       |
| -------------- | ----------------------------------------------------------------- |
| **Activa**     | Cuenta contra el límite hasta que caduca                          |
| **Confirmada** | Se registró el uso                                                |
| **Liberada**   | Devuelta; no se registró uso                                      |
| **Caducada**   | No se confirmó antes de **Caduca**; dejó de contar en ese momento |

## Conviene saber {#good-to-know}

- Los eventos de uso no se pueden modificar ni eliminar, y las cantidades no pueden ser negativas,
  así que el uso registrado no se puede restar. Para dar más margen a un inquilino tras un error,
  establece una [excepción de cuota](help:usage#quota-override) para el resto del período.
- Los eventos de uso individuales no se auditan por su volumen; los cambios de medidores y cuotas,
  sí.
- Los datos de cada inquilino están aislados: el ID de un inquilino ajeno devuelve «no encontrado».
- Studio muestra las cantidades con hasta 6 decimales, con el formato de tu idioma.
- Las series temporales abarcan como máximo 400 días.
- Encontrarás más límites en [Limitaciones conocidas](help:limitations).

## Solución de problemas {#troubleshooting}

| Qué ves                                                         | Por qué                                                                                   | Qué hacer                                                                                                                                             |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sin acceso al uso**                                           | Tu rol no tiene `usage:read` para este producto o inquilino                               | Pide a un administrador del producto un rol con `usage:read`                                                                                          |
| Solo la pestaña **Uso por inquilino**                           | Tienes `usage:read` solo a través de un rol de inquilino                                  | Es lo esperado; el resumen requiere un rol de producto                                                                                                |
| **Aún no hay medidores**                                        | No hay ningún medidor definido                                                            | Crea uno en **Medidores** (requiere `usage:manage`)                                                                                                   |
| **Conflicto** al eliminar un medidor                            | El medidor tiene uso registrado                                                           | **Desactívalo** en su lugar                                                                                                                           |
| **Conflicto** «a meter with this key exists»                    | Las claves son únicas por producto, también para los medidores inactivos                  | Elige otra clave o activa el medidor antiguo                                                                                                          |
| **Modificado mientras tanto**                                   | Otra persona editó el medidor                                                             | Recarga y repite el cambio                                                                                                                            |
| Tu producto recibe `429 quota_exceeded`                         | Se superaría un límite estricto                                                           | Comprueba el origen del límite en la tarjeta; sube el límite del plan, establece una excepción de cuota o espera al final del período (`Retry-After`) |
| Tu producto recibe `409` «the meter is inactive»                | Se desactivó el medidor                                                                   | **Actívalo** en **Medidores**                                                                                                                         |
| Tu producto recibe `409` por una clave de idempotencia          | Se reutilizó la clave con un cuerpo distinto                                              | Usa una clave nueva para cada evento de uso distinto                                                                                                  |
| **Revisa los datos introducidos** al registrar                  | `quantity`, `occurred_at` o `properties` fuera de los límites anteriores                  | Corrige el valor; envía `occurred_at` con zona horaria                                                                                                |
| Se rechaza la confirmación: «the reservation is expired»        | El TTL se agotó antes de la confirmación                                                  | Registra el uso como un evento normal; elige un `ttl_seconds` más largo                                                                               |
| El uso aparece en el día equivocado                             | Los días son UTC                                                                          | Compara con horas UTC                                                                                                                                 |
| Un medidor de **Período de facturación** se restablece el día 1 | El inquilino no tiene una suscripción con prestaciones, o la facturación está desactivada | Suscribe al inquilino (consulta [Planes y suscripciones](help:plans-subscriptions#subscribe))                                                         |

---
title: Programaciones
summary: Ejecuta una tarea con regularidad, a un intervalo fijo o en horas cron en UTC, y activa, desactiva, edita o elimina programaciones.
keywords: programación, programar, cron, crontab, tarea recurrente, tarea periódica, temporizador, intervalo, periódico, UTC, zona horaria, próxima ejecución, cada día, cada hora
---

Una **programación** pone en cola una [tarea](help:jobs) una y otra vez: cada 15 minutos, cada noche
a las 02:00, el primer día de cada mes. Le das a la programación un **Tipo** de tarea y un
**Payload**, y la programación pone en la cola una tarea nueva de ese tipo en cada hora programada.
Después, un worker ejecuta la tarea como cualquier otra. Usa las programaciones para informes,
limpiezas, sincronizaciones y recordatorios.

> [!IMPORTANT]
> Las programaciones requieren el módulo del servidor `events`. Verlas requiere `jobs:read`;
> **Nueva programación**, editar, activar, desactivar y eliminar requieren `jobs:manage` (sin ese
> permiso, los botones y el menú de las filas están ocultos). Las programaciones solo se disparan
> mientras haya un proceso worker (`axentra worker`) en marcha, porque el worker también actúa como
> planificador.

## Leer la lista de programaciones {#schedules-list}

Abre [Programaciones](app:schedules) (también accesible con **Programaciones** en la pantalla
**Tareas**). Cada fila muestra:

- el **Nombre** y el tipo de tarea que pone en cola;
- la **Periodicidad**: un intervalo como _Cada 15 minutos_, o una expresión cron marcada como
  _cron, UTC_;
- el **Estado**: **Activo** o **Desactivado**;
- la **Próxima ejecución**: cuándo se dispara de nuevo la programación (se muestra como
  **Desactivada** en las programaciones desactivadas);
- la **Última ejecución**: la franja horaria que se disparó por última vez. Cuando existe una tarea
  para ella, la hora enlaza con esa tarea;
- el **Inquilino**, o **Nivel de producto**.

## Crear una programación {#create}

1. Abre [Programaciones](app:schedules) y elige **Nueva programación**.
2. Introduce un **Nombre** (de 1 a 200 caracteres) y el **Tipo** de tarea, por ejemplo
   `reports.send`.
3. En **Periodicidad**, elige **Intervalo fijo** o **Expresión cron** (consulta más abajo).
4. Opcional: introduce el **Payload** de la tarea, elige un **Inquilino** y establece **Prioridad**
   y **Máx. de intentos**.
5. Deja **Activada** encendido si la programación debe empezar a dispararse de inmediato.
6. Elige **Crear programación**.

El servidor calcula la **Próxima ejecución** al guardar. Studio no muestra una vista previa de las
horas de ejecución futuras.

## Elegir la periodicidad {#timing}

Una programación usa exactamente uno de los dos modos de periodicidad.

### Intervalo fijo {#interval}

Introduce un número en **Cada** y elige la **Unidad** (**Segundos**, **Minutos**, **Horas** o
**Días**). El intervalo debe estar entre 10 segundos y 366 días.

Las horas del intervalo se cuentan desde la medianoche UTC del 1 de enero de 1970, no desde el
momento en que guardaste. Así, todos los servidores calculan las mismas horas y las horas de
ejecución son predecibles:

- _Cada 15 minutos_ se dispara a las :00, :15, :30 y :45 de cada hora (UTC).
- _Cada día_ se dispara a las 00:00 UTC.
- _Cada 7 días_ se dispara los jueves a las 00:00 UTC (el 1 de enero de 1970 fue jueves).

Si necesitas una hora del día o un día de la semana concretos, usa en su lugar una expresión cron.

### Expresión cron {#cron-syntax}

Una expresión cron tiene exactamente **5 campos**, separados por espacios:

```text
┌──────── minuto            0-59
│ ┌────── hora              0-23
│ │ ┌──── día del mes       1-31
│ │ │ ┌── mes               1-12
│ │ │ │ ┌ día de la semana  0-7 (0 y 7 son domingo)
* * * * *
```

Cada campo admite:

| Sintaxis | Significado                                         | Ejemplo                                                    |
| -------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `*`      | cualquier valor                                     | `*` en el campo de la hora: cada hora                      |
| `n`      | un valor                                            | `30` en el campo del minuto                                |
| `a-b`    | un rango                                            | `1-5` en el campo del día de la semana: de lunes a viernes |
| `a,b,c`  | una lista (los elementos pueden ser rangos o pasos) | `0,30` en el campo del minuto                              |
| `*/n`    | uno de cada _n_ valores desde el inicio             | `*/10` en el campo del minuto: 0, 10, 20…                  |
| `a-b/n`  | uno de cada _n_ valores dentro de un rango          | `8-18/2` en el campo de la hora: 8, 10… 18                 |
| `a/n`    | uno de cada _n_ valores desde _a_ hasta el final    | `5/15` en el campo del minuto: 5, 20, 35, 50               |

**No se admiten:** nombres de meses o de días de la semana (`JAN`, `MON`), `L`, `W`, `#`, `?`, un
campo de segundos ni macros como `@daily` o `@hourly`. Una expresión puede tener como máximo 200
caracteres.

Cuando están restringidos **tanto** el día del mes como el día de la semana (ninguno es `*`), un día
coincide si coincide **cualquiera** de los dos. Por tanto, `0 0 1 * 1` se dispara el día 1 de cada
mes _y_ todos los lunes.

Una expresión que nunca coincide, como `0 0 31 2 *` (31 de febrero), se rechaza al guardar.

Studio comprueba la sintaxis mientras escribes, con las mismas reglas que el servidor, y muestra
mensajes como _Una expresión cron tiene 5 campos separados por espacios; esta tiene 6._ Los botones
de **Expresiones habituales** rellenan expresiones ya preparadas:

| Botón                           | Expresión     |
| ------------------------------- | ------------- |
| **Cada 5 minutos**              | `*/5 * * * *` |
| **Cada hora**                   | `0 * * * *`   |
| **Diariamente a las 00:00**     | `0 0 * * *`   |
| **Días laborables a las 09:00** | `0 9 * * 1-5` |
| **Los lunes a las 06:00**       | `0 6 * * 1`   |
| **El día 1 de cada mes**        | `0 0 1 * *`   |

### Zona horaria: siempre UTC {#timezone}

Todas las horas de las programaciones están en **UTC**. No hay ningún ajuste de zona horaria ni
ajuste automático al horario de verano. Convierte tú las horas locales: las 09:00 en Madrid o Berlín
son `0 8 * * *` en invierno (UTC+1) y `0 7 * * *` en verano (UTC+2). Si la hora local exacta importa
durante todo el año, ajusta la programación cuando cambie la hora o deja que el handler compruebe la
hora local.

Las columnas **Próxima ejecución** y **Última ejecución** se muestran en tu propia zona horaria, como
en todo Studio.

## Qué pone en cola una programación {#what-it-enqueues}

En cada franja horaria, la programación pone en cola una tarea con:

- el **Tipo**, el **Payload**, la **Prioridad**, el **Máx. de intentos** y el **Inquilino** de la
  programación;
- un enlace a la programación (los detalles de la tarea lo muestran en **Programación**);
- **Creada por** `schedule:<schedule id>`;
- una clave de idempotencia formada por el ID de la programación y la franja horaria.

Cada franja horaria se dispara **como máximo una vez**, aunque haya varios workers en marcha. La
tarea en sí se ejecuta después al menos una vez, con los [reintentos](help:jobs#retries) habituales.
Una programación no espera a que termine la tarea anterior: si una tarea tarda más que el intervalo,
la siguiente empieza igualmente.

## Ejecuciones perdidas y próxima ejecución {#missed-runs}

Si no había ningún worker en marcha cuando tocaban algunas franjas (por ejemplo, durante un
mantenimiento), las franjas perdidas se **agrupan**: la programación se dispara una vez por la franja
vencida y después continúa con la siguiente franja posterior a la hora actual. No recupera cada
ejecución perdida.

La **Próxima ejecución** se recalcula a partir de la hora actual cada vez que cambias la
periodicidad o activas la programación. Si solo cambias el nombre, el payload, la prioridad o los
intentos, la próxima ejecución se mantiene.

## Editar una programación {#edit}

1. Abre el menú de acciones de la fila y elige **Editar**.
2. Cambia los valores y elige **Guardar cambios**.

Studio envía solo los campos que has cambiado. El **Inquilino** no se puede cambiar después de la
creación; en su lugar, elimina la programación y crea una nueva. Las tareas ya puestas en cola
conservan su payload anterior.

## Activar o desactivar una programación {#enable-disable}

Abre el menú de acciones de la fila y elige **Desactivar** o **Activar**. Una programación
desactivada conserva toda su configuración, pero no se dispara. Cuando la vuelves a activar,
continúa con la siguiente franja posterior al momento actual; las franjas perdidas mientras estaba
desactivada no se ejecutan.

## Eliminar una programación {#delete}

Abre el menú de acciones de la fila, elige **Eliminar programación** y confirma. La programación
deja de dispararse. Las tareas que ya puso en cola se mantienen y se siguen ejecutando. La
eliminación no se puede deshacer; para detener una programación temporalmente, desactívala.

## Configuración {#settings}

| Ajuste               | Qué hace                                                                            | Valores permitidos / valor predeterminado                                        |
| -------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Nombre**           | Se muestra en la lista y en los mensajes.                                           | De 1 a 200 caracteres. Obligatorio.                                              |
| **Tipo**             | Tipo de tarea que se pone en cola; un worker necesita un handler para él.           | Como en las [tareas](help:jobs#enqueue); `axentra.` está reservado. Obligatorio. |
| **Periodicidad**     | **Intervalo fijo** o **Expresión cron**.                                            | Intervalo de 10 s a 366 días; cron: 5 campos, UTC.                               |
| **Payload**          | Entrada de cada tarea puesta en cola.                                               | Objeto JSON, como máximo 64 KB. Predeterminado: `{}`.                            |
| **Inquilino**        | Pone las tareas en cola en este inquilino.                                          | Un inquilino o **Nivel de producto**. Solo al crear.                             |
| **Prioridad**        | Prioridad de las tareas puestas en cola.                                            | De −100 a 100. Predeterminado: 0.                                                |
| **Máx. de intentos** | Intentos de cada tarea puesta en cola antes de pasar a **Fallida definitivamente**. | De 1 a 100. Predeterminado: 5.                                                   |
| **Activada**         | Si la programación se dispara.                                                      | Predeterminado: activada.                                                        |

## Para desarrolladores {#developers}

Las programaciones también están disponibles a través de la API:
`GET/POST /v1/products/{product_id}/schedules` y `GET/PATCH/DELETE /schedules/{id}` (con `If-Match`
para las actualizaciones y eliminaciones). Solo un worker actúa como planificador a la vez;
comprueba si hay programaciones pendientes cada 5 segundos de forma predeterminada
(`events.scheduler_interval_seconds`), así que una tarea puede ponerse en cola unos segundos después
de su franja.

## Solución de problemas {#troubleshooting}

**La programación no se dispara.** Comprueba que está **Activo** y que la **Próxima ejecución** está
en el pasado. Si es así, no hay ningún worker en marcha; pide a tus operadores que inicien uno. Si
las tareas se ponen en cola pero se quedan **En cola**, ningún worker gestiona el tipo; consulta
[Tareas](help:jobs#troubleshooting).

**Se dispara a una hora equivocada.** Las horas cron están en UTC. Convierte tu hora local, teniendo
en cuenta el horario de verano (consulta [Zona horaria](help:schedules#timezone)).

**«The cron expression never matches».** Los campos describen una fecha que no existe, como el 30
de febrero. Cambia el día o el mes.

**«Revisa los datos introducidos» con un mensaje sobre cron.** El servidor indica el campo, por
ejemplo `cron hour: values must be within 0-23` o `cron day of week: invalid value 'MON'`. Usa
números en lugar de nombres y quita las macros.

**«interval_seconds must be between 10 and 31622400».** El intervalo es inferior a 10 segundos o
superior a 366 días.

**«Modificado mientras tanto» al guardar, activar o eliminar.** Otra persona cambió la programación
después de que la cargaras. Cierra el diálogo, espera a que se actualice la lista (o recarga la
página) y repite el cambio sobre la versión actual.

**La programación se ejecutó una sola vez tras una interrupción, no por cada franja perdida.** Es
intencionado: las franjas perdidas se agrupan en una sola ejecución.

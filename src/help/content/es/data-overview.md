---
title: Resumen de datos
summary: Consulta qué colecciones de registros y archivos almacena un producto, cuánto almacenamiento usa cada inquilino y qué ajustes de almacenamiento y retención aplica el servidor.
keywords: datos, almacenamiento, colecciones, estadísticas, cuota, espacio en disco, uso de disco, retención, copia de seguridad, backup, política de tipos de contenido, tipos de archivo bloqueados, backend de almacenamiento, S3, almacenamiento local
---

El **Resumen de datos** muestra, para el producto actual, qué se almacena y con qué reglas: las
colecciones de registros en las que escriben los inquilinos, el almacenamiento de archivos que usa
cada inquilino frente a su cuota, la configuración de almacenamiento del servidor y los períodos de
retención que informa el servidor. Es una página de solo lectura: no cambia nada. Las cuotas se
cambian en la pantalla [Archivos](help:files#quota) y la política de tipos de contenido, en la
pestaña **Archivos** del producto (consulta
[Establecer la política de tipos de contenido](#content-type-policy)).

Los operadores de producto la usan para responder a preguntas como «¿qué inquilino está cerca de su
cuota de almacenamiento?», «¿qué colecciones existen?» y «¿cuánto tiempo conserva el servidor los
eventos de auditoría?».

> [!IMPORTANT]
> La página requiere el módulo del servidor `data` (registros). La tarjeta **Almacenamiento de
> archivos** requiere además el módulo `storage`. Las estadísticas requieren el permiso
> `collections:read`, que conceden los roles de producto **Product owner**, **Product admin**,
> **Support** y **Product viewer**, así como los roles de plataforma. Las tarjetas **Configuración
> de almacenamiento** y **Retención** requieren `platform:settings` o `product:manage`. Consulta
> [Roles y permisos](help:roles-permissions).

## Abrir el resumen de datos {#open}

1. Selecciona un producto.
2. En la barra lateral, abre **Datos y almacenamiento** y elige **Resumen de datos**
   ([abrir la pantalla](app:dataOverview)).

Si la barra lateral marca la entrada como **Inactivo**, el módulo `data` no está habilitado en el
servidor. Un operador habilita los módulos en la
[configuración del servidor](help:server-configuration).

## Qué muestra la página {#what-you-see}

| Tarjeta                             | Contenido                                                                                      | Se muestra cuando                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Colecciones de registros**        | Número de colecciones y de registros y, a continuación, una fila por colección                 | Tienes `collections:read`                                                           |
| **Almacenamiento de archivos**      | Bytes y archivos que usa todo el producto, las cuotas predeterminadas y una fila por inquilino | Tienes `collections:read` y el módulo `storage` está habilitado                     |
| **Configuración de almacenamiento** | Backend, tamaño máximo de archivo, tipos permitidos y bloqueados                               | Tienes `platform:settings` o `product:manage` y el módulo `storage` está habilitado |
| **Retención**                       | Cuánto tiempo conserva el servidor los eventos de auditoría y las tareas finalizadas           | Tienes `platform:settings` o `product:manage`                                       |

Sin `collections:read`, la página muestra **Estadísticas del producto no disponibles**. Los miembros
de los inquilinos (roles **Owner**, **Admin**, **Member** y **Viewer** de un inquilino) no tienen
este permiso, ya que revelaría datos de otros inquilinos. Trabajan con los datos de su propio
inquilino en [Registros](help:records) y [Archivos](help:files).

## Colecciones de registros {#collections}

Una _colección_ es un grupo con nombre de registros JSON, como `orders` o `contacts`. Las
colecciones no se crean ni se configuran por separado: una colección existe en cuanto se escribe en
ella un registro y desaparece cuando se elimina su último registro. Consulta
[Registros](help:records#collections).

La tabla enumera todas las colecciones del producto en todos los inquilinos:

| Columna           | Significado                                                                     |
| ----------------- | ------------------------------------------------------------------------------- |
| **Colección**     | Nombre de la colección. Selecciónala para abrirla en la pantalla **Registros**. |
| **Registros**     | Número de registros de esta colección, sumados en todos los inquilinos.         |
| **Inquilinos**    | Número de inquilinos que tienen al menos un registro en esta colección.         |
| **Último cambio** | Momento de la creación o actualización más reciente en esta colección.          |

Si la tabla está vacía (**Aún no hay colecciones**), todavía no se ha escrito ningún registro en este
producto.

## Almacenamiento por inquilino {#storage-per-tenant}

La tarjeta **Almacenamiento de archivos** empieza con cuatro cifras: **Almacenamiento usado** y
**Archivos** de todo el producto (solo archivos activos), y la **Cuota de almacenamiento
predeterminada** y la **Cuota de archivos predeterminada**, que se aplican a todos los inquilinos
sin cuota propia.

La tabla **Uso de almacenamiento por inquilino** tiene una fila por inquilino (50 por página;
**Cargar más** para el resto):

| Columna                                             | Significado                                                                                                                                                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inquilino**                                       | Selecciona el nombre para abrir los archivos del inquilino.                                                                                                                                                                        |
| **Almacenamiento** / **Archivos**                   | Bytes y número de archivos activos del inquilino.                                                                                                                                                                                  |
| **Cuota de almacenamiento** / **Cuota de archivos** | El límite efectivo y cuánto se ha usado. **Ilimitado** significa que no se aplica ningún límite. El distintivo **Inquilino** marca una cuota establecida para este inquilino; sin él, el inquilino hereda el valor predeterminado. |

### Cómo se determina la cuota efectiva {#quotas}

Cada uno de los dos límites (bytes y archivos) se resuelve por separado, en este orden:

1. La cuota propia del inquilino, establecida con **Editar cuota** en la pantalla
   [Archivos](help:files#quota).
2. El valor predeterminado del producto: `quota_bytes` / `quota_files` en la sección `storage` de la
   configuración del producto (página del producto, pestaña **Configuración**, campo
   **Configuración (JSON)**).
3. El valor predeterminado de la instalación: `storage.default_quota_bytes` /
   `storage.default_quota_files` en la configuración del servidor.
4. Si no hay ninguno: ilimitado.

```json
{ "storage": { "quota_bytes": 10737418240, "quota_files": 10000 } }
```

El ejemplo establece un valor predeterminado del producto de 10 GiB (en bytes) y 10 000 archivos.

> [!NOTE]
> El uso cuenta los archivos _activos_. Un archivo cuya fecha de caducidad ha pasado desaparece de
> inmediato, pero sus bytes siguen contando hasta que se ejecuta la purga del servidor (un operador
> programa `axentra storage purge`, por ejemplo cada 15 minutos).

## Configuración de almacenamiento {#storage-configuration}

Esta tarjeta muestra los ajustes efectivos del servidor. Forman parte de la configuración del
servidor y no se pueden cambiar en Studio.

| Ajuste                       | Qué hace                                                                                                                                             | Valor predeterminado |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **Backend**                  | Dónde se almacena el contenido de los archivos: `local` (un directorio en el servidor) o `s3` (Amazon S3 o un servicio compatible con S3).           | `local`              |
| **Tamaño máximo de archivo** | Límite estricto por archivo, que se comprueba mientras se transmite la subida.                                                                       | 50 MiB               |
| **Tipos permitidos**         | Lista de tipos de contenido permitidos (`image/png`, `image/*`). **Todos los tipos excepto los bloqueados** significa que la lista está vacía.       | vacía                |
| **Tipos bloqueados**         | Qué ocurre en este producto con ejecutables, HTML, SVG y scripts, y si eso está **Establecida para este producto** o **Heredada de la instalación**. | rechazar             |

Cambiar el backend no mueve los archivos existentes. Para desarrolladores y operadores, todas las
claves de la sección `[storage]` se describen en la
[configuración del servidor](help:server-configuration).

## Establecer la política de tipos de contenido {#content-type-policy}

Algunos tipos de archivo pueden ejecutar código cuando alguien los abre: ejecutables, HTML, XHTML,
SVG, JavaScript, scripts de shell y PHP. Axentra los _bloquea_. La política de tipos de contenido
decide, por producto, qué ocurre con una subida bloqueada: o se rechaza, o se guarda como _adjunto
inerte_, es decir, se conserva como `application/octet-stream` opaco que solo se descarga y nunca se
muestra.

1. Abre el producto: **Productos** y, a continuación, el nombre del producto.
2. Elige la pestaña **Archivos**. (La pestaña está oculta cuando el módulo `storage` no está
   habilitado.)
3. En **Política de tipos de contenido de archivos**, elige el comportamiento y las listas (tabla
   siguiente).
4. Elige **Guardar cambios**.

| Ajuste                                          | Qué hace                                                                                                                                                                                                                                                                                                                                    | Valores permitidos / valor predeterminado                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Tipos de archivo bloqueados**                 | **Rechazar la subida** (quien sube recibe un error) o **Guardar como adjunto inerte**. **Valor predeterminado de la instalación** sigue el ajuste del servidor `storage.store_blocked_as_inert`.                                                                                                                                            | Predeterminado: valor predeterminado de la instalación               |
| **Extensiones aceptadas como adjuntos inertes** | Extensiones bloqueadas que se conservan como adjuntos inertes aunque las subidas se rechacen en general. La decisión se basa en la extensión del nombre del archivo, también cuando lo bloqueado es el contenido (un script `#!` llamado `run.sh` se conserva si `sh` figura en la lista; el mismo contenido llamado `run.txt` se rechaza). | Separadas por comas, sin punto: `html, sh`. Como máximo 100 entradas |
| **Extensiones bloqueadas adicionales**          | Extensiones bloqueadas además de la lista integrada.                                                                                                                                                                                                                                                                                        | `py, rb`. Como máximo 100 entradas                                   |
| **Tipos de contenido bloqueados adicionales**   | Tipos de contenido bloqueados además de la lista integrada.                                                                                                                                                                                                                                                                                 | `text/x-python`. Como máximo 100 entradas                            |

La sección **Siempre bloqueados** enumera las extensiones y los tipos de contenido integrados. Un
producto puede bloquear más o conservar los archivos bloqueados como adjuntos inertes, pero nunca
puede desbloquearlos.

> [!IMPORTANT]
> Ver la política requiere `product:read`; cambiarla requiere `product:manage` (roles **Product
> owner** y **Product admin**). Los productos archivados son de solo lectura.

> [!NOTE]
> La lista **Tipos permitidos** de la instalación se sigue aplicando después de la política: si la
> lista de permitidos no contiene `application/octet-stream`, los archivos inertes también se
> rechazan.

La política se comprueba de tres maneras: por el tipo de contenido declarado, por la extensión del
nombre del archivo y por los primeros bytes del contenido (ejecutables, HTML, SVG y cualquier
archivo que empiece por `#!`). Cambiar el nombre de un archivo a una extensión bloqueada sigue la
misma política. Los cambios se registran en el registro de auditoría como `storage.policy.update`.
Detalles para quienes suben archivos: [Archivos](help:files#content-types).

## Retención {#retention}

| Ajuste                    | Qué significa                                                                                                                                                                                  | Valor predeterminado |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **Registro de auditoría** | Días que el servidor conserva los eventos de auditoría (`observability.audit_retention_days`).                                                                                                 | 365 días             |
| **Tareas finalizadas**    | Días que el servidor conserva las tareas finalizadas (correctas, fallidas, fallidas definitivamente o canceladas) y las entregas de webhooks finalizadas (`observability.job_retention_days`). | 30 días              |

Los registros y los archivos no tienen período de retención: se conservan hasta que alguien los
elimina, pasa la fecha de caducidad del propio archivo o se elimina el inquilino (lo que elimina
todos sus datos).

## Copias de seguridad {#backups}

La tarjeta **No se informa de las copias de seguridad** es intencionada: la API no informa ni del
estado de las copias de seguridad ni de cuánto tiempo se conservan los metadatos de los archivos
eliminados. Ambas cosas forman parte de la operación del servidor. De forma predeterminada, la purga
elimina las filas de metadatos de los archivos eliminados al cabo de 30 días; las copias de
seguridad de la base de datos y el registro de auditoría conservan durante más tiempo el nombre, el
tamaño y la suma de comprobación de un archivo eliminado.

## Solución de problemas {#troubleshooting}

**Estadísticas del producto no disponibles.** Tus roles no conceden `collections:read`. Pide a un
propietario del producto un rol de producto, o usa [Registros](help:records) y
[Archivos](help:files) para tu inquilino.

**Módulo de almacenamiento no habilitado.** El servidor no ejecuta el módulo `storage`, por lo que
no se pueden almacenar archivos. Un operador añade `storage` a los módulos habilitados; consulta la
[referencia de módulos](help:modules-reference).

**Faltan las tarjetas Configuración de almacenamiento y Retención.** Requieren `platform:settings` o
`product:manage`. Los observadores del producto y el personal de soporte no las ven.

**Un inquilino muestra más uso del que suman sus archivos.** Los archivos caducados cuentan hasta la
siguiente purga. Pregunta a un operador si `axentra storage purge` se ejecuta con regularidad.

**Guardar la política de tipos de contenido falla con «Modificado mientras tanto».** Otra persona
cambió el producto (su configuración, nombre o política) después de que abrieras la página. Recarga
la página y vuelve a aplicar tu cambio.

**Guardar la política falla con «Revisa los datos introducidos».** Una entrada no es una extensión
válida (letras minúsculas, dígitos, `_`, `+` o `-`, como máximo 16 caracteres, sin punto) ni un tipo
de contenido válido (`type/subtype`), o una lista tiene más de 100 entradas. El mensaje bajo el
campo indica el problema.

**No encontrado al abrir la página.** El módulo `data` está desactivado, o el producto está
archivado y no eres administrador de la plataforma.

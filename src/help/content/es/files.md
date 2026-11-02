---
title: Archivos
summary: Sube, encuentra, descarga, comparte y elimina los archivos de un inquilino, y gestiona su cuota de almacenamiento, los límites de tamaño y la política de tipos de contenido.
keywords: archivos, ficheros, subir, subida, descargar, descarga, adjuntos, documentos, almacenamiento, cuota, espacio en disco, tamaño de archivo, tipo de contenido, tipo MIME, enlace de descarga, enlace para compartir, URL firmada, URL prefirmada, S3, etiquetas, metadatos, caducidad, inerte, tipos bloqueados
---

La pantalla **Archivos** muestra los archivos que un inquilino ha guardado mediante el módulo de
almacenamiento de Axentra: documentos, imágenes, exportaciones o cualquier otro adjunto que suba tu
aplicación. Puedes subir archivos a mano, encontrarlos por nombre, tipo o etiqueta, descargarlos,
crear un enlace de descarga temporal, cambiarles el nombre y eliminarlos. La pantalla también muestra
cuánto de su cuota de almacenamiento usa el inquilino.

Un archivo siempre pertenece exactamente a un inquilino. Su contenido no se puede cambiar después de
la subida; para sustituir un archivo, sube uno nuevo y elimina el antiguo. El nombre y las etiquetas
sí se pueden cambiar.

> [!IMPORTANT]
> La pantalla requiere el módulo del servidor `storage`. Ver y descargar requiere `files:read` en el
> inquilino; subir, editar y eliminar requiere `files:write`. Los roles de inquilino **Owner**,
> **Admin** y **Member** conceden ambos; **Viewer** solo lee. Roles de producto: **Product owner** y
> **Product admin** pueden escribir en todos los inquilinos; **Support** y **Product viewer** leen.
> Cambiar la cuota de un inquilino requiere `tenants:update` (**Product owner**, **Product admin**).
> Consulta [Roles y permisos](help:roles-permissions).

## Explorar los archivos de un inquilino {#browse}

1. Abre **Datos y almacenamiento** › **Archivos** ([abrir la pantalla](app:files)).
2. Elige un **Inquilino**.

La página muestra el **Uso de almacenamiento** del inquilino y la lista **Archivos guardados**, del
más reciente al más antiguo, 50 por página. Solo aparecen los archivos activos y no caducados.
Selecciona los encabezados de columna **Nombre**, **Tamaño** o **Subido** para ordenar. Selecciona el
nombre de un archivo para abrir sus [detalles](#details); el menú **…** de cada fila ofrece
**Detalles**, **Descargar** y **Eliminar archivo**.

### Filtrar archivos {#filter}

| Filtro                                                               | Qué encuentra                                                                                                                               |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **El nombre contiene**                                               | Parte del nombre, sin distinguir mayúsculas y minúsculas.                                                                                   |
| **Tipo de contenido**                                                | Un tipo exacto (`application/pdf`) o una familia (`image/*`).                                                                               |
| **Subido por**                                                       | El ID del usuario (`usr_…`) o de la clave de API que subió el archivo.                                                                      |
| **Etiqueta** y **Es igual a**, después **Añadir filtro de etiqueta** | Archivos cuyas etiquetas contienen esta clave con este valor. `true`, `42` y `null` coinciden con su tipo; el resto del texto, como cadena. |

Deben cumplirse todos los filtros. Quita un filtro de etiqueta con la **×** de su etiqueta.

## Subir un archivo {#upload}

1. Elige el inquilino y selecciona **Subir archivo**.
2. En **Archivo**, elige el archivo. Studio muestra su nombre, tamaño y tipo, y las reglas que
   aplica el servidor (tamaño máximo, tipos permitidos y bloqueados).
3. Campos opcionales:
   - **Nombre visible**: el nombre que aparece en las listas y que se usa en las descargas. De forma
     predeterminada, el nombre del archivo.
   - **Etiquetas (metadatos)**: un objeto JSON plano como `{"kind": "invoice", "year": 2026}`
     (consulta [Etiquetas](#labels)).
   - **Caduca el**: pasado este momento, el archivo se oculta y más tarde se elimina (consulta
     [Caducidad](#expiry)).
4. Selecciona **Subir**. Una barra de progreso muestra la transferencia; **Cancelar subida** la
   detiene.

El servidor vuelve a comprobarlo todo, muestre lo que muestre Studio. Los archivos vacíos se
rechazan.

### Límite de tamaño {#size-limit}

Cada archivo puede tener como máximo el **Tamaño máximo de archivo** del servidor (50 MiB de forma
predeterminada; lo establece el operador en `storage.max_file_bytes`). El servidor deja de leer en
cuanto una subida lo supera. Studio avisa antes de subir si conoce el límite, y solo lo conoce si
puedes leer la configuración del servidor (`platform:settings` o `product:manage`). Si no, el diálogo
indica que el servidor comprueba el tamaño, el tipo y la cuota durante la subida.

### Tipos permitidos y bloqueados {#content-types}

Dos reglas deciden si se acepta un tipo de archivo:

- **Tipos bloqueados.** Los ejecutables, HTML, XHTML, SVG, JavaScript, scripts de shell y PHP y
  archivos similares están bloqueados; se reconocen por el tipo declarado, la extensión del archivo
  y el contenido (también cualquier archivo que empiece por `#!`). Según la política de tipos de
  contenido del producto, un archivo bloqueado se rechaza o se guarda como
  [adjunto inerte](#inert). Los responsables del producto establecen la política en la pestaña
  **Archivos** del producto; consulta
  [Establecer la política de tipos de contenido](help:data-overview#content-type-policy).
- **Tipos permitidos.** Si el operador ha configurado una lista de permitidos
  (`storage.allowed_content_types`), solo se aceptan esos tipos, por ejemplo
  `image/*, application/pdf`. Sin lista, se aceptan todos los tipos excepto los bloqueados.

El tipo que indica el navegador es solo una pista: el servidor examina los primeros bytes y usa el
tipo detectado cuando el declarado falta, es genérico o es claramente incorrecto.

### Adjuntos inertes {#inert}

Cuando la política conserva un archivo bloqueado en lugar de rechazarlo, el archivo se guarda como
`application/octet-stream` y se marca como **Guardado como inerte** en sus detalles, junto con el
tipo con el que se subió. Un archivo así solo se descarga como adjunto y nunca se abre en el
navegador. Cambiar el nombre de un archivo a una extensión bloqueada (por ejemplo, `.html`) sigue la
misma política: se rechaza o el archivo pasa a ser inerte.

### Etiquetas {#labels}

Las etiquetas son tus propios pares clave/valor para encontrar y agrupar archivos, como
`{"kind": "invoice"}`. Reglas: un objeto JSON plano, como máximo 64 claves; claves de 1 a 64
caracteres formadas por letras, dígitos y `_ . : -`; los valores son texto (como máximo 1024
caracteres), números, `true`/`false` o `null`; como máximo 8 KiB en total. No pongas secretos en los
nombres ni en las etiquetas: aparecen en el registro de auditoría.

## Cuota de almacenamiento {#quota}

La tarjeta **Uso de almacenamiento** compara los bytes y el número de archivos del inquilino con su
cuota efectiva. El indicador cambia a un color de advertencia al 80 % y a uno crítico al 95 %. La
línea inferior indica de dónde procede la cuota: **Cuota establecida para este inquilino**, **Cuota
heredada del producto o del valor predeterminado del servidor** o **Sin cuota: ilimitado**. Cómo se
resuelven los valores predeterminados se explica en el
[Resumen de datos](help:data-overview#quotas).

Cuando se alcanza una cuota, se rechazan las subidas posteriores; los archivos existentes se
conservan.

### Cambiar la cuota de un inquilino {#edit-quota}

1. En la tarjeta **Uso de almacenamiento**, selecciona **Editar cuota**.
2. Introduce un **Límite de almacenamiento** con su **Unidad** (MiB, GiB, TiB) o un **Límite de
   archivos**, o ambos. Deja un campo vacío para heredar el valor predeterminado del producto o del
   servidor; `0` bloquea todas las subidas.
3. Selecciona **Guardar cambios**.

Se permite un límite inferior al uso actual: los archivos existentes se conservan y las subidas
nuevas se rechazan. Si alguien cambió la cuota después de que abrieras el diálogo, el guardado se
rechaza con **Modificado mientras tanto**; recarga y vuelve a intentarlo. Los cambios de cuota se
auditan (`storage.quota.update`).

## Detalles del archivo {#details}

Selecciona el nombre de un archivo para abrir sus detalles: **Nombre**, **ID**, **Estado**, **Tipo de
contenido**, **Guardado como inerte** (solo en archivos inertes), **Tamaño**, suma de comprobación
**SHA-256**, **Versión**, **Subido por**, **Subido**, **Actualizado**, **Caduca** y las etiquetas.
El SHA-256 te permite comprobar que una copia descargada es idéntica al archivo almacenado.

El **Estado** de un archivo de la lista siempre es `active`. Internamente, un archivo está en
`pending` mientras se escriben sus bytes y en `deleted` tras eliminarse; ninguno de los dos aparece
en la lista.

## Descargar un archivo {#download}

Selecciona **Descargar** en los detalles o en el menú **…** de la fila. Studio pide al servidor un
enlace de descarga de corta duración e inicia la descarga con él. Los archivos siempre se descargan
como adjuntos y nunca se abren en el navegador. Las descargas no se registran en el registro de
auditoría.

## Compartir un enlace de descarga {#download-links}

1. Abre los detalles del archivo y selecciona **Crear enlace de descarga**.
2. Copia el **Enlace de descarga** y compártelo.

> [!CAUTION]
> Cualquiera que tenga el enlace puede descargar el archivo hasta que caduque, sin iniciar sesión.
> Un enlace no se puede revocar por sí solo; eliminar el archivo lo invalida. Comparte los enlaces
> solo con el destinatario previsto, por un canal de confianza.

### Cuánto tiempo funciona un enlace {#link-expiry}

El enlace caduca en el momento que aparece en **Caduca**. Studio siempre solicita la duración más
larga que permite el servidor: `storage.signed_url_ttl_seconds`, 300 segundos (5 minutos) de forma
predeterminada, configurable entre 10 segundos y 24 horas. Un enlace nunca dura más que la propia
fecha de caducidad del archivo.

Hay dos tipos de enlaces, según la configuración del servidor:

| Tipo                                                                            | URL                                                                                               | Deja de funcionar cuando                                                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Enlace firmado de Axentra (predeterminado)                                      | La URL pública del servidor + `/v1/files/download/…`                                              | Caduca, el archivo se elimina o caduca, o el inquilino o el producto se suspende o se archiva |
| Enlace prefirmado de S3 (marcado como **prefirmado por el almacén de objetos**) | Apunta directamente al bucket de S3; solo con el backend S3 y `s3_presigned_downloads` habilitado | Caduca o el archivo se elimina. Suspender el inquilino **no** lo invalida                     |

## Cambiar el nombre o las etiquetas de un archivo {#edit}

1. Abre los detalles y selecciona **Editar nombre y etiquetas**.
2. Cambia el **Nombre**, el JSON de **Etiquetas (metadatos)** o ambos. Las etiquetas que guardas
   sustituyen a todas las anteriores.
3. Selecciona **Guardar cambios**.

El contenido no se puede cambiar. Si otra persona editó el archivo entretanto, el guardado se
rechaza con **Modificado mientras tanto**.

## Eliminar un archivo {#delete}

1. Selecciona **Eliminar archivo** en los detalles o en el menú **…** de la fila.
2. Confirma con **Eliminar archivo**.

El archivo desaparece para todo el mundo a la vez, se libera su cuota y los enlaces de descarga
existentes dejan de funcionar. A continuación, el servidor elimina el objeto almacenado.

> [!CAUTION]
> La eliminación no se puede deshacer. Es una eliminación lógica a nivel de almacenamiento: según el
> backend, los bytes pueden permanecer en el disco hasta que se reutilice el espacio, o como
> versiones anteriores del objeto en un bucket de S3 con control de versiones. Las copias de
> seguridad de la base de datos y el registro de auditoría conservan el nombre, el tamaño y la suma
> de comprobación del archivo. Si los archivos eliminados deben ser irrecuperables, los operadores
> necesitan cifrado de disco o reglas de ciclo de vida del bucket; consulta
> [Seguridad](help:security).

## Caducidad {#expiry}

Un archivo con **Caduca el** establecido desaparece de las listas, los detalles y los enlaces de
descarga en el momento en que pasa esa hora. La purga del servidor (`axentra storage purge`,
programada por el operador) lo elimina más tarde; hasta entonces, sus bytes siguen contando para la
cuota. La fecha de caducidad solo se puede establecer al subir el archivo; después no se puede
cambiar en Studio.

## Backends de almacenamiento y análisis {#backends}

Dónde se guarda el contenido de los archivos es un ajuste del servidor, que se muestra en el
[Resumen de datos](help:data-overview#storage-configuration):

- `local`: un directorio en el servidor (de forma predeterminada, `./var/storage`).
- `s3`: Amazon S3 o un servicio compatible con S3, opcionalmente con cifrado del lado del servidor.

Cambiar el backend no migra los archivos existentes. Axentra calcula un SHA-256 para cada archivo,
pero **no** analiza los archivos en busca de malware ni inspecciona archivos comprimidos. Si
necesitas análisis, ejecútalo en tu aplicación o en una tarea después de la subida.

## Solución de problemas {#troubleshooting}

**Archivo demasiado grande.** El archivo supera el tamaño máximo de archivo del servidor. Comprímelo
o divídelo, o pide a un operador que aumente `storage.max_file_bytes`.

**Tipo de archivo no aceptado.** El archivo es de un tipo bloqueado (ejecutable, HTML, SVG, script),
su extensión o su contenido lo parecen, o no está en la lista de permitidos del servidor. Revisa las
reglas en el diálogo de subida. Un responsable del producto puede conservar los archivos bloqueados
como adjuntos inertes ([política de tipos de contenido](help:data-overview#content-type-policy)).

**Cuota de almacenamiento agotada.** El inquilino ha alcanzado su cuota de bytes o de archivos.
Elimina archivos o pide a un propietario o administrador del producto que
[aumente la cuota](#edit-quota). Los archivos caducados cuentan hasta la siguiente purga.

**Sin acceso a los archivos de este inquilino.** Tus roles no conceden `files:read` en este
inquilino. Pide un rol a un propietario del producto o al propietario del inquilino.

**Falta Subir archivo.** Te falta `files:write` en este inquilino o no hay ningún inquilino
seleccionado.

**Conflicto: la subida tardó demasiado.** La subida quedó sin terminar más tiempo del que permite el
servidor (una hora de forma predeterminada) y se descartó. Vuelve a subirla con una conexión más
rápida.

**Revisa los datos introducidos.** Las etiquetas no son un objeto JSON plano o incumplen las
[reglas de las etiquetas](#labels), o **Caduca el** está en el pasado.

**Modificado mientras tanto.** Otra persona cambió el nombre o las etiquetas del archivo, lo eliminó
o cambió la cuota después de que lo abrieras. Recarga y repite la acción.

**Un enlace de descarga devuelve «No encontrado».** Ha caducado, el archivo se eliminó o caducó, o el
inquilino o el producto se suspendió o se archivó. Crea un enlace nuevo. El servidor responde igual
en todos estos casos a propósito.

**El enlace copiado apunta al host equivocado.** Los enlaces firmados se construyen a partir de la URL
pública del servidor (`security.public_url`). Pide a un operador que la establezca en la dirección a
la que pueden acceder los destinatarios.

**El diálogo de subida no muestra el límite de tamaño ni los tipos permitidos.** No puedes leer la
configuración del servidor. El servidor los sigue aplicando; su error te indica qué regla ha fallado.

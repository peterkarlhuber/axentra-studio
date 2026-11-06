---
title: Búsqueda
summary: Buscar en el índice de texto completo de un inquilino, acotar los resultados por tipo, ver un documento indexado y quitar del índice una entrada errónea.
keywords: búsqueda, buscar, texto completo, índice, documento indexado, tipo, ID de referencia, resaltado, frase, excluir, search:query, search:index
---

La pantalla **Búsqueda** busca en el índice de texto completo que tu producto mantiene para cada
inquilino. El producto guarda en este índice el texto buscable de sus propios objetos (una factura,
un contacto, un ticket); en Studio puedes consultarlo igual que tus usuarios, comprobar qué está
indexado y quitar una entrada que no debería estar ahí.

El índice es una _copia_: tu producto lo escribe y sigue siendo la fuente de verdad. Axentra no lee
por sí mismo registros, archivos ni las tablas de tu producto, así que un objeto aparece en la
búsqueda solo después de que el producto lo haya indexado.

> [!IMPORTANT]
> La pantalla requiere el módulo del servidor `search`. Buscar requiere `search:query` en el
> inquilino; quitar un documento del índice requiere `search:index` (consulta
> [Quién puede hacer qué](#permissions)).

## Quién puede hacer qué {#permissions}

| Rol                                                         | Buscar (`search:query`) | Quitar del índice (`search:index`) |
| ----------------------------------------------------------- | ----------------------- | ---------------------------------- |
| Inquilino **Owner**, **Admin**                              | sí                      | sí                                 |
| Inquilino **Member**, **Viewer**                            | sí                      | no                                 |
| **Product owner**, **Product admin** (todos los inquilinos) | sí                      | sí                                 |
| **Support**, **Product viewer** (todos los inquilinos)      | sí                      | no                                 |
| **Administrador de la plataforma**                          | sí                      | sí                                 |
| **Observador de la plataforma**                             | sí                      | no                                 |

Por defecto, los miembros no pueden escribir en el índice, porque cada entrada se muestra a todos
los que pueden buscar en el inquilino. Un rol propio puede conceder ambos permisos; consulta
[Roles y permisos](help:roles-permissions).

## Buscar en un inquilino {#query}

1. Abre **Datos y almacenamiento** › **Búsqueda** ([abrir la pantalla](app:search)).
2. Elige un **Inquilino**. Cada inquilino tiene su propio índice; no hay búsqueda entre
   inquilinos.
3. En **Texto de búsqueda**, escribe tu búsqueda y elige **Buscar** (o pulsa Intro).

| Escribes           | La búsqueda encuentra                                        |
| ------------------ | ------------------------------------------------------------ |
| `invoice acme`     | documentos que contienen ambas palabras (en cualquier orden) |
| `"late payment"`   | documentos que contienen exactamente esta frase              |
| `invoice or offer` | documentos que contienen al menos una de las palabras        |
| `invoice -draft`   | documentos con `invoice` que no contienen `draft`            |

La búsqueda encuentra palabras completas y no distingue mayúsculas de minúsculas. No encuentra
partes de palabras (`inv` no encuentra `invoice`) ni corrige la ortografía. Que `invoices` también
encuentre `invoice` depende del idioma con el que indexa el servidor (consulta
[Conviene saber](#limits)).

La búsqueda y el inquilino forman parte de la dirección, así que puedes guardar una búsqueda en
marcadores o enviar el enlace a alguien que tenga acceso al mismo inquilino.

### Acotar por tipo {#kinds}

Cada documento indexado tiene un **tipo** que elige tu producto, por ejemplo `invoice` o `note`. En
**Tipos**, escribe uno o varios tipos separados por comas para ver solo esos. Los tipos usan
minúsculas, dígitos, puntos, guiones y guiones bajos y empiezan por una letra; como máximo 20 a la
vez. Deja el campo vacío para buscar en todos los tipos.

Debajo del campo, **Tipos indexados** muestra los tipos del índice del inquilino con su número de
documentos. Selecciona uno para añadirlo al campo, o vuelve a seleccionarlo para quitarlo.

## Leer los resultados {#results}

Los resultados se ordenan por relevancia: las coincidencias en el título cuentan más que las del
texto, más coincidencias cuentan más y, entre resultados iguales, el actualizado más recientemente
va primero. Cada resultado muestra:

- el **título** con las palabras coincidentes resaltadas (o el ID de referencia si el documento no
  tiene título),
- el **tipo** y el **ID de referencia**, que es el ID propio del objeto en tu producto,
- cuándo se **actualizó** el documento por última vez en el índice,
- hasta dos fragmentos breves del texto con las coincidencias resaltadas.

Primero se muestran veinte resultados; **Cargar más** trae los siguientes. El contador bajo la lista
indica cuántos se muestran y si hay más disponibles.

> [!NOTE]
> Los resultados no son una instantánea. Si el producto cambia el índice mientras pasas páginas, un
> documento puede moverse y aparecer dos veces o ninguna. Se rechaza paginar muy lejos (más allá de
> la posición 1000 de forma predeterminada); en su lugar, afina la búsqueda.

## Ver un documento indexado {#document}

Elige el título de un resultado. Un panel lateral muestra lo que el índice guarda de él: **Tipo**,
**ID de referencia**, **ID del documento** (`sdoc_…`), **Versión** (aumenta con cada nueva
indexación), **Idioma**, quién lo indexó (**Indexado por**, **Indexado por última vez por**) y
cuándo, el **Texto** completo y los **Metadatos** que tu producto guardó con él. Los metadatos se
muestran, pero no se buscan.

## Quitar un documento del índice {#remove}

Si un documento no debe aparecer en la búsqueda (por ejemplo, se indexó por error o pertenece a un
objeto eliminado), puedes quitarlo:

1. Abre el documento desde los resultados.
2. Elige **Quitar del índice** y confirma.

> [!WARNING]
> Esto quita solo la entrada del índice. El objeto original en tu producto no cambia, y el producto
> vuelve a añadir la entrada la próxima vez que indexe ese objeto. Para quitar algo de forma
> definitiva, elimínalo o cámbialo en tu producto.

## Cómo llegan los documentos al índice {#index}

Tu producto indexa sus objetos a través de la API (`PUT …/search/documents/{kind}/{ref_id}` con
`search:index`), normalmente justo después de guardar un objeto o en una [tarea](help:jobs) que se
reintenta. Volver a indexar el mismo tipo e ID de referencia reemplaza el documento. Studio no añade
documentos por sí mismo. Quién indexó un documento queda registrado en él y, salvo que el servidor
lo desactive, en el [registro de auditoría](help:audit) (`search.document.upsert`,
`search.document.delete`), sin su texto.

## Conviene saber {#limits}

| Aspecto           | Regla                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Alcance           | Un inquilino a la vez. Todos los que tienen `search:query` en el inquilino ven cada documento de ese inquilino.  |
| Texto de búsqueda | De 1 a 500 caracteres. Una búsqueda solo con signos de puntuación o palabras muy comunes no encuentra nada.      |
| Tipos             | `^[a-z][a-z0-9_.-]{0,62}$`, como máximo 20 por búsqueda                                                          |
| Coincidencia      | Palabras completas; sin prefijos, búsqueda aproximada ni insensibilidad a acentos (`café` no encuentra `cafe`)   |
| Idioma            | Uno por instalación (ajuste del servidor `search.language`, por defecto `simple`: sin raíces ni palabras vacías) |
| Paginación        | 20 por página en Studio, como máximo hasta la posición `search.max_offset` (por defecto 1000)                    |

## Solución de problemas {#troubleshooting}

### Sin coincidencias {#no-results}

Revisa la ortografía, usa palabras completas y menos palabras, y quita el filtro de tipos. Si el
objeto debería estar, tu producto (todavía) no lo ha indexado para este inquilino: el índice solo
contiene lo que el producto guarda en él.

### Otros mensajes {#messages}

**No puedes buscar en este inquilino.** Tu rol en este inquilino no incluye `search:query`. Pide
ayuda a un owner o admin del inquilino.

**La búsqueda aparece como «módulo no habilitado».** El servidor funciona sin el módulo `search`.
Consulta [Módulos](help:modules-reference#search-realtime).

**Revisa los datos introducidos.** La búsqueda tiene más de 500 caracteres, un tipo no es válido o
paginaste más lejos de lo que permite el servidor. Acorta o afina la búsqueda.

**No encontrado** al abrir un documento. El producto lo quitó del índice después de cargar los
resultados. Vuelve a buscar.

**Falta Quitar del índice.** Tu rol no incluye `search:index` en este inquilino.

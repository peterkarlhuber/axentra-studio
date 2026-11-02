---
title: Registros
summary: Explora, filtra, crea, edita y elimina los registros JSON que los inquilinos guardan en colecciones, y resuelve los conflictos de «modificado mientras tanto».
keywords: registros, datos, JSON, documentos, colección, entradas, filas, base de datos, filtro, filtrar, versión, conflicto, 412, If-Match, concurrencia optimista
---

Los _registros_ son pequeños objetos JSON que tu aplicación guarda a través de la API de Axentra,
por ejemplo pedidos, notas o ajustes, sin necesitar su propia tabla de base de datos. Cada registro
pertenece exactamente a un inquilino y a una _colección_ (un grupo con nombre, como `orders`). La
pantalla **Registros** te permite examinar estos datos, encontrar registros por su contenido y, con
permiso de escritura, corregir o añadir registros a mano.

> [!IMPORTANT]
> La pantalla requiere el módulo del servidor `data`. Leer requiere `records:read` en el inquilino;
> crear, cambiar y eliminar requiere `records:write`. Los roles de inquilino **Owner**, **Admin** y
> **Member** conceden ambos; **Viewer** solo lee. Los roles de producto **Product owner** y
> **Product admin** pueden escribir en todos los inquilinos; **Support** y **Product viewer** leen en
> todos los inquilinos. La lista de todas las colecciones requiere `collections:read` (solo roles de
> producto). Consulta [Roles y permisos](help:roles-permissions).

## Colecciones y registros {#collections}

- Una **colección** se crea al escribir en ella el primer registro y desaparece cuando se elimina su
  último registro. No hay nada que configurar. Los nombres usan letras minúsculas, dígitos y guiones
  bajos, empiezan por una letra y tienen como máximo 63 caracteres (`orders`, `support_notes`).
- Un **registro** tiene un **ID** (`rec_…`), sus **Datos** (un objeto JSON), una **Versión**
  (empieza en 1 y aumenta con cada cambio), las horas de **Creado**/**Actualizado** y el usuario o la
  clave de API que lo creó y lo cambió por última vez (**Creado por**, **Actualizado por**).
- El mismo nombre de colección en dos inquilinos contiene dos conjuntos de registros separados.
  Studio siempre muestra un inquilino cada vez; el servidor garantiza la separación.

## Explorar registros {#browse}

1. Abre **Datos y almacenamiento** › **Registros** ([abrir la pantalla](app:records)).
2. Elige un **Inquilino** en la parte superior.
3. Elige una colección en la lista **Colecciones** de la izquierda. El número que aparece junto a
   ella cuenta sus registros en todos los inquilinos.

La tabla muestra **ID**, una vista previa abreviada de los **Datos**, **Versión**, **Creado** y
**Actualizado**, del más reciente al más antiguo, 50 por página; **Cargar más** obtiene la página
siguiente. Selecciona el icono del ojo (**Ver registro …**) para abrir el registro con todos los
campos y el JSON completo y formateado.

> [!TIP]
> En la página de un inquilino, **Explorar registros** abre esta pantalla con el inquilino ya
> seleccionado. En el [Resumen de datos](help:data-overview#collections), al seleccionar una
> colección se abre aquí.

Si no tienes ningún rol de producto, Studio no puede listar las colecciones del producto. En su
lugar, introduce el nombre de la colección en **Nombre de la colección** y elige **Abrir**.

### Ordenar {#sort}

Selecciona los encabezados de columna **ID**, **Creado** o **Actualizado** para ordenar; vuelve a
seleccionarlos para invertir el orden. No se puede ordenar por **Datos**.

## Filtrar por contenido {#filter}

1. En **Campo**, introduce el nombre de un campo de primer nivel del JSON, por ejemplo `status`.
2. En **Es igual a**, introduce el valor, por ejemplo `open`.
3. Elige **Añadir filtro**. El filtro aparece como una etiqueta; la **×** de una etiqueta lo quita.

Si hay varios filtros, deben cumplirse todos. Los valores se interpretan como JSON siempre que es
posible: `true`, `42`, `null`, `"42"` o `{"city": "Graz"}` coinciden con su tipo; cualquier otra
cosa (`open`) coincide como texto. Así, `total` = `12` encuentra `{"total": 12}` pero no
`{"total": "12"}`.

Un filtro es una comprobación de _contención_: un valor de tipo objeto coincide cuando el campo del
registro contiene al menos esas claves. `address` = `{"city": "Graz"}` encuentra
`{"address": {"city": "Graz", "zip": "8010"}}`. Los nombres de campo solo pueden contener letras,
dígitos y guiones bajos, así que filtra los campos anidados mediante un valor de tipo objeto, como
se muestra.

## Crear un registro {#create}

1. Elige el inquilino (y, si quieres, la colección).
2. Elige **Nuevo registro**.
3. En **Colección**, mantén o introduce el nombre de la colección. Un nombre nuevo crea la
   colección.
4. En **Datos**, introduce un objeto JSON, por ejemplo:

   ```json
   { "status": "open", "total": 12, "customer": { "name": "Acme" } }
   ```

5. Elige **Crear registro**. Studio cambia a la colección del registro.

El ID, la versión y las horas los establece el servidor; no los incluyas en los datos.

## Editar un registro {#edit}

1. Abre el registro (icono del ojo) y elige **Editar**.
2. Cambia el JSON en **Datos** y elige **Guardar cambios**.

Guardar **sustituye todo el objeto**: los campos que quites del JSON se eliminan del registro. La
colección no se puede cambiar; para mover un registro, créalo en la otra colección y elimina el
antiguo.

### Versiones y conflictos {#versions}

Studio indica al servidor qué versión has editado (HTTP `If-Match`). Si otra persona o tu aplicación
cambió o eliminó el registro después de que lo abrieras, el servidor rechaza el cambio con
**Modificado mientras tanto** (HTTP 412) en lugar de sobrescribir sin avisar el otro cambio. Esto
también se aplica a la eliminación.

Para resolverlo: cierra el diálogo, recarga la lista, vuelve a abrir el registro, aplica tu cambio a
los datos actuales y guarda.

## Eliminar un registro {#delete}

1. Abre el registro y elige **Eliminar registro**.
2. Confirma con **Eliminar registro**.

> [!CAUTION]
> La eliminación es permanente; no hay papelera. El registro de auditoría guarda constancia de que el
> registro se eliminó (`data.record.delete`), pero no sus datos.

## Ajustes y límites {#limits}

| Elemento               | Regla                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Nombre de la colección | `^[a-z][a-z0-9_]{0,62}$`: minúsculas, dígitos y guiones bajos, empieza por una letra, como máximo 63 caracteres |
| Datos                  | Un objeto JSON (no un array ni un valor simple), como máximo 256 KiB serializado                                |
| Campo de filtro        | Letras, dígitos y guion bajo, empieza por una letra o un guion bajo, como máximo 63 caracteres                  |
| Orden                  | `id`, `created_at`, `updated_at`, ascendente o descendente                                                      |
| Tamaño de página       | 50 en Studio; la API acepta un `limit`                                                                          |

## Para desarrolladores {#api}

Studio usa la misma API que tu aplicación. `C = /v1/products/{product_id}/tenants/{tenant_id}/records/{collection}`:

| Método y ruta                               | Permiso            | Finalidad                                     |
| ------------------------------------------- | ------------------ | --------------------------------------------- |
| `GET /v1/products/{product_id}/collections` | `collections:read` | Colecciones con recuentos                     |
| `GET C?where=&sort=&limit=&cursor=`         | `records:read`     | Lista; `where` es un objeto JSON (contención) |
| `GET C/{record_id}`                         | `records:read`     | Un registro; `ETag` es la versión             |
| `POST C` (cuerpo: el objeto de datos)       | `records:write`    | Crear (201)                                   |
| `PUT C/{record_id}`, `If-Match`             | `records:write`    | Sustituir los datos                           |
| `DELETE C/{record_id}`, `If-Match`          | `records:write`    | Eliminar (204)                                |

```http
PUT /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/records/orders/rec_01EXAMPLE
If-Match: "3"
Content-Type: application/json

{"status": "shipped", "total": 12}
```

Sin `If-Match`, el servidor sobrescribe incondicionalmente. Cada creación, sustitución y eliminación
escribe un evento de auditoría (`data.record.create`, `data.record.replace`, `data.record.delete`)
con la colección y la versión, nunca con los datos. Para datos relacionales con muchas filas o
joins, los productos usan sus propias tablas en lugar de registros; consulta los
[fundamentos de la API](help:api-basics).

## Solución de problemas {#troubleshooting}

**Modificado mientras tanto.** Otra persona cambió o eliminó el registro después de que lo abrieras.
Recarga, vuelve a abrir el registro y repite el cambio. Consulta
[Versiones y conflictos](#versions).

**Revisa los datos introducidos** al guardar. El nombre de la colección o los datos no cumplen los
[límites](#limits). Studio ya comprueba el nombre y que los datos sean un objeto JSON; el mensaje del
servidor indica el problema.

**Demasiado grande.** Los datos del registro superan 256 KiB. Guarda el contenido grande como
[archivo](help:files) y conserva en el registro solo su ID de archivo.

**Revisa los datos introducidos** al filtrar: un nombre de campo contiene un punto u otros
caracteres no permitidos. Filtra los valores anidados con un valor de tipo objeto (consulta
[Filtrar por contenido](#filter)).

**La lista Colecciones muestra un error o «No permitido».** Listar colecciones requiere
`collections:read`, que solo tienen los roles de producto. En su lugar, introduce el nombre de la
colección en **Nombre de la colección**.

**Faltan Nuevo registro, Editar y Eliminar registro.** Tu rol no concede `records:write` en este
inquilino o todavía no has seleccionado ningún inquilino.

**No encontrado.** El registro se eliminó, el inquilino está suspendido (solo los administradores de
la plataforma pueden acceder a inquilinos suspendidos) o no tienes acceso a este inquilino.

**Ningún registro coincide.** Quita los filtros uno a uno. Recuerda que `12` y `"12"` son valores
distintos.

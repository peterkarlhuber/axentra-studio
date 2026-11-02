---
title: Productos
summary: Crea, configura, archiva y restaura productos, gestiona los operadores de producto y entiende el modo de producto único.
keywords: producto, aplicación, app, proyecto, operadores, miembros del producto, archivar, restaurar, configuración del producto, modo de producto único, modo multiproducto, slug
---

Un **producto** es una aplicación que se ejecuta en tu servidor Axentra, por ejemplo un CRM o un
servicio de reservas. Cada producto tiene sus propios inquilinos, usuarios, roles, claves de API y
datos, y los productos no comparten nada entre sí. Las personas que gestionan un producto (en lugar
de usarlo como clientes) son sus **operadores**: tienen un rol de producto, como **Product owner**
(propietario del producto), y aparecen en la pestaña **Miembros** del producto.

Abre la lista de productos con [Productos](app:products) en la barra lateral. **Abrir panel** te
lleva al interior de un producto; a partir de ahí, todas las demás pantallas de la barra lateral
funcionan dentro de ese producto.

> [!IMPORTANT]
> Todas las personas que pertenecen a un producto lo ven en la lista. Los administradores y los
> observadores de la plataforma ven todos los productos, incluidos los archivados. Crear, archivar
> y restaurar productos requiere los permisos de plataforma `products:create` y `products:archive`
> (administradores de la plataforma) y solo es posible en modo multiproducto. Consulta el
> [modo de producto único](#single-product-mode).

## Crear un producto {#create}

1. Abre [Productos](app:products) y elige **Nuevo producto**.
2. Introduce un **Nombre**.
3. Revisa el **Slug**. Studio lo deriva del nombre; puedes cambiarlo antes de crear el producto.
4. Si quieres, introduce una **Descripción**.
5. Elige **Crear producto**.

Studio abre la página del producto nuevo. Te conviertes en su **Product owner** (propietario), así que
puedes añadir más operadores de inmediato en la pestaña **Miembros**.

> [!NOTE]
> El slug no se puede cambiar más adelante. Elige uno que te parezca bien ver en URL, logs y
> archivos de configuración.

### Campos del producto {#fields}

| Campo           | Qué hace                                                                                  | Valores permitidos / valor predeterminado                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre**      | Nombre visible en Studio y en los correos electrónicos, por ejemplo en los de invitación. | De 1 a 200 caracteres. Se puede cambiar más adelante.                                                                           |
| **Slug**        | Identificador estable y apto para URL.                                                    | De 2 a 63 letras minúsculas, dígitos y guiones, empezando por una letra o un dígito; único en el servidor. No se puede cambiar. |
| **Descripción** | Texto libre que se muestra en la lista de productos.                                      | Hasta 2000 caracteres. Opcional.                                                                                                |
| **ID**          | Identificador generado (`prd_…`) que usa la API.                                          | Lo asigna el servidor.                                                                                                          |
| **Estado**      | **Activo** o **Archivado**.                                                               | Consulta [archivar un producto](#archive).                                                                                      |

## Cambiar la configuración del producto {#settings}

La pestaña **Configuración** de un producto contiene su nombre, su descripción y la **Configuración
(JSON)**: un objeto JSON con la configuración específica del producto. El código de tu producto
puede leerla, y algunos módulos de Axentra usan claves de ella.

1. Abre el producto desde [Productos](app:products) y selecciona la pestaña **Configuración**.
2. Cambia **Nombre**, **Descripción** o **Configuración (JSON)**.
3. Elige **Guardar cambios**.

Los cambios se aplican de inmediato a todos los inquilinos del producto.

| Clave en Configuración (JSON) | Usada por      | Qué hace                                                                                                                                                                                                                          |
| ----------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invitation_accept_url`       | Notificaciones | Enlace usado en los correos de invitación. `{token}` se sustituye por el token de invitación; si no aparece, se añade `?token=…`. Debe empezar por `http://` o `https://`. Consulta las [invitaciones](help:members-invitations). |
| `default_locale`              | Notificaciones | Idioma de reserva para las plantillas de notificación, por ejemplo `"en"`.                                                                                                                                                        |
| `storage`                     | Archivos       | Cuotas de almacenamiento y política de tipos de contenido para las subidas. Edita mejor la política en la pestaña **Archivos**. Consulta [archivos](help:files).                                                                  |

```json
{
  "invitation_accept_url": "https://studio.example.com/invitations/accept?token={token}",
  "default_locale": "en"
}
```

> [!WARNING]
> **Guardar cambios** sustituye todo el objeto de configuración. Si borras una clave del texto, se
> elimina del producto. El objeto puede tener hasta unos 32 000 caracteres.

> [!IMPORTANT]
> Cambiar la configuración requiere `product:manage` (propietarios y administradores del producto).
> Sin ese permiso, la pestaña muestra **Puedes ver esta configuración, pero no cambiarla.** Un
> producto archivado no se puede editar en Studio; restáuralo primero.

La pestaña **Archivos** (solo cuando el módulo de archivos está habilitado) contiene la política de
almacenamiento del producto. Se describe en [archivos](help:files).

## Gestionar los operadores del producto {#members}

La pestaña **Miembros** enumera los operadores del producto: usuarios con un rol de producto. Sus
permisos de inquilino se aplican en **todos** los inquilinos del producto. Los miembros de los
inquilinos se gestionan, en cambio, en cada inquilino; consulta
[miembros e invitaciones](help:members-invitations).

| Rol de producto integrado                                       | Qué puede hacer                                                                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Product owner** (propietario del producto, `product_owner`)   | Todo en el producto, incluida la gestión de operadores y la declaración de permisos del producto.                             |
| **Product admin** (administrador del producto, `product_admin`) | Gestiona inquilinos, roles, claves de API y datos; no puede gestionar operadores.                                             |
| **Support** (soporte, `product_support`)                        | Lo lee todo y gestiona los miembros de los inquilinos hasta el límite de sus propios permisos (en la práctica: observadores). |
| **Product viewer** (observador del producto, `product_viewer`)  | Acceso de solo lectura al producto.                                                                                           |

Los roles de producto personalizados también aparecen en la lista. Consulta
[roles y permisos](help:roles-permissions).

### Añadir un operador {#add-operator}

1. Abre la pestaña **Miembros** y elige **Añadir miembro**.
2. Introduce el **Correo electrónico** de la persona y elige un **Rol**.
3. Elige **Añadir miembro**.

> [!IMPORTANT]
> La pestaña **Miembros** requiere `product_members:read`; añadir, cambiar y quitar operadores
> requiere `product_members:manage` (propietarios del producto y administradores de la plataforma).

> [!NOTE]
> No existen invitaciones para operadores. La persona ya debe tener una cuenta que puedas ver: los
> administradores de la plataforma ven todas las cuentas, y los usuarios con `product_users:read`
> ven los usuarios de este producto (miembros de sus inquilinos y sus operadores). Para cualquier
> otra persona, el servidor responde **Usuario no encontrado**. Invita primero a la persona a uno de
> los inquilinos del producto o pide a un administrador de la plataforma que la añada.

Para cambiar el rol de un operador, elige uno nuevo en la columna **Rol**. Para quitar un operador,
elige el icono de la papelera en su fila y confirma. Los roles por encima de tu propio nivel se
muestran, pero no se pueden seleccionar (consulta el
[techo de roles](help:members-invitations#role-ceiling)).

## Archivar un producto {#archive}

Archivar retira un producto del servicio sin eliminar nada.

1. Abre el producto desde [Productos](app:products).
2. Elige **Archivar**.
3. Escribe el nombre del producto para confirmar y elige **Archivar**.

Mientras un producto está archivado:

- los operadores y los miembros de los inquilinos dejan de verlo en la lista de productos, y se
  rechaza cualquier solicitud que hagan en él;
- todas sus claves de API dejan de funcionar (las solicitudes fallan con **No permitido**);
- los administradores de la plataforma mantienen el acceso completo, y los observadores de la
  plataforma, el acceso de lectura;
- Studio muestra **Este producto está archivado. Restáuralo para realizar cambios.** y no ofrece
  **Abrir panel**.

> [!NOTE]
> Studio no puede eliminar un producto. Archivarlo es la forma de retirarlo del servicio.

## Restaurar un producto {#restore}

1. Abre el producto archivado (como administrador de la plataforma, sigue apareciendo con el estado
   **Archivado**).
2. Elige **Restaurar** y confirma.

El producto, sus miembros y sus claves de API vuelven a funcionar de inmediato. Las claves que han
caducado entretanto siguen caducadas.

## Modo de producto único {#single-product-mode}

Un servidor Axentra funciona en uno de dos modos, que el operador del servidor establece en la
configuración del servidor:

|                                                 | Modo de producto único (`single`)                                          | Modo multiproducto (`multi`)                             |
| ----------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| Productos                                       | Exactamente uno, creado a partir de la configuración en el primer arranque | Cualquier número, creados en Studio o a través de la API |
| **Nuevo producto**, **Archivar**, **Restaurar** | No se ofrecen; la API los rechaza con **No disponible en este modo**       | Con `products:create` / `products:archive`               |
| Lista de productos                              | Muestra el único producto y el aviso **Modo de producto único**            | Todos los productos a los que tienes acceso              |

En modo de producto único sigues pudiendo cambiar el nombre, la descripción, la configuración y los
miembros del producto en su página. Para ejecutar varios productos, el operador del servidor
establece `mode = "multi"` en la configuración del servidor; no hace falta migrar datos. Consulta la
[configuración del servidor](help:server-configuration).

## Conviene saber {#good-to-know}

- Las cuentas de usuario abarcan toda la instalación: una cuenta puede trabajar en varios
  productos.
- Los productos archivados conservan sus datos, eventos de auditoría y claves; nada caduca por el
  hecho de archivar.
- La configuración del producto no es un almacén de secretos. No pongas contraseñas ni tokens en
  **Configuración (JSON)**.

## Solución de problemas {#troubleshooting}

**Conflicto al crear un producto.** Otro producto ya usa el slug. Elige un slug distinto.

**Revisa los datos introducidos: «slug must be 2-63 lowercase letters, digits or dashes».** Quita
del slug las mayúsculas, los espacios y los caracteres especiales.

**No es un JSON válido. / La configuración debe ser un objeto JSON.** **Configuración (JSON)** debe
ser un único objeto entre llaves, por ejemplo `{"key": "value"}`. Se rechazan los arrays, las cadenas
sueltas y las comas finales.

**Revisa los datos introducidos: «settings are too large»** o un mensaje sobre `storage`. El objeto
supera unos 32 000 caracteres o la parte `storage` no es válida. Acórtalo o edita la política de
almacenamiento en la pestaña **Archivos**.

**Modificado mientras tanto.** Otra persona guardó el producto mientras lo editabas. Recarga la
página y vuelve a aplicar tu cambio.

**No disponible en este modo.** El servidor funciona en modo de producto único, en el que no se
pueden crear, archivar ni restaurar productos.

**Usuario no encontrado al añadir un operador.** La persona no tiene cuenta o no tiene una que
puedas ver. Consulta [añadir un operador](#add-operator).

**Conflicto: «the product needs at least one owner».** Has intentado quitar o degradar al último
**Product owner**. Haz antes propietario a otra persona.

**Falta un producto en la lista.** Está archivado (solo los administradores y observadores de la
plataforma ven los productos archivados) o no eres miembro de él. Pregunta a un administrador de la
plataforma.

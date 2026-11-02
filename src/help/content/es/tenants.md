---
title: Inquilinos
summary: Crea inquilinos para tus clientes, cámbiales el nombre, suspéndelos, reactívalos y elimínalos, y entiende qué efecto tiene cada acción sobre el acceso y los datos.
keywords: inquilino, tenant, cliente, organización, cuenta, espacio de trabajo, empresa, suspender, reactivar, eliminar inquilino, slug
---

Un **inquilino** es un cliente u organización dentro de un producto. Los datos de cada inquilino
(registros, archivos, uso, suscripciones, notificaciones) están estrictamente separados de los de
cualquier otro inquilino, también en la base de datos. Las personas obtienen acceso a un inquilino
mediante una **membresía** con un rol de inquilino; consulta
[miembros e invitaciones](help:members-invitations).

Crea un inquilino por cliente. Los operadores de producto (usuarios con un rol de producto) trabajan
en todos los inquilinos; los miembros de un inquilino solo ven su propio inquilino.

```diagram
hierarchy
```

> [!IMPORTANT]
> La pantalla **Inquilinos** requiere el módulo de inquilinos. Ver la lista requiere
> `tenants:read`; sin ese permiso solo ves los inquilinos de los que eres miembro. Crear requiere
> `tenants:create`; cambiar el nombre, suspender y reactivar, `tenants:update`; eliminar,
> `tenants:delete`. Los propietarios y administradores del producto los tienen todos.

## Buscar un inquilino {#find}

Abre [Inquilinos](app:tenants). Usa **Buscar inquilinos** para filtrar por nombre o slug y el filtro
**Estado** para mostrar solo los inquilinos con estado **Activo** o **Suspendido**. La columna **Miembros**
cuenta las membresías del inquilino.

## Crear un inquilino {#create}

1. Abre [Inquilinos](app:tenants) y elige **Nuevo inquilino**.
2. Introduce el **Nombre**, por ejemplo el nombre de la empresa del cliente.
3. Revisa el **Slug**. Studio lo deriva del nombre; puedes cambiarlo antes de crear el inquilino.
4. Elige **Crear inquilino**.

Studio abre el inquilino nuevo. Todavía no tiene miembros: añade a la primera persona del cliente en
la pestaña **Miembros** o invítala en la pestaña **Invitaciones**, normalmente con el rol **Owner**
(propietario). Consulta [miembros e invitaciones](help:members-invitations).

| Campo      | Qué hace                                                                                 | Valores permitidos / valor predeterminado                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Nombre** | Nombre visible en Studio y en los correos de invitación.                                 | De 1 a 200 caracteres. Se puede cambiar más adelante.                                                                                |
| **Slug**   | Identificador estable y apto para URL; también se escribe para confirmar la eliminación. | De 2 a 63 letras minúsculas, dígitos y guiones, empezando por una letra o un dígito; único dentro del producto. No se puede cambiar. |
| **ID**     | Identificador generado (`ten_…`) que usa la API.                                         | Lo asigna el servidor.                                                                                                               |
| **Estado** | **Activo** o **Suspendido**.                                                             | Los inquilinos nuevos tienen el estado **Activo**.                                                                                   |

> [!TIP]
> A través de la API se puede crear un inquilino con un propietario en un solo paso
> (`owner_user_id`), y puede llevar su propio objeto `settings`. Studio no los muestra.

## Cambiar el nombre de un inquilino {#rename}

1. Abre el inquilino y quédate en la pestaña **Detalles**.
2. Cambia el **Nombre** en **Editar inquilino**.
3. Elige **Guardar cambios**.

El slug y el ID no cambian nunca.

## Suspender un inquilino {#suspend}

Suspender bloquea todo acceso a un inquilino sin eliminar nada, por ejemplo cuando un cliente no ha
pagado o un contrato está en pausa.

1. Abre el inquilino.
2. Elige **Suspender inquilino** y confirma.

Mientras un inquilino está suspendido:

- sus miembros no pueden acceder a él; sus solicitudes se rechazan con **No permitido**;
- las claves de API vinculadas al inquilino, y las claves de todo el producto que trabajan en él,
  también se rechazan;
- los operadores de producto también pierden el acceso a los datos del inquilino y a su página; el
  inquilino sigue en la lista de [Inquilinos](app:tenants) con el estado **Suspendido**;
- los administradores de la plataforma mantienen el acceso completo y los observadores de la
  plataforma, el acceso de lectura;
- no se elimina ningún dato.

## Reactivar un inquilino {#reactivate}

1. Abre el inquilino suspendido.
2. Elige **Reactivar inquilino**.

Los miembros y las claves vuelven a funcionar de inmediato.

> [!WARNING]
> Solo los administradores de la plataforma (y los observadores de la plataforma, en modo de solo
> lectura) pueden abrir la página de un inquilino suspendido. Un propietario o administrador del
> producto que no sea administrador de la plataforma recibe ahí **No permitido** y no puede llegar a
> **Reactivar inquilino** en Studio. Pídeselo a un administrador de la plataforma o reactívalo a
> través de la API con `tenants:update`:
>
> ```http
> PATCH /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE
> Content-Type: application/json
>
> {"status": "active"}
> ```

## Eliminar un inquilino {#delete}

> [!CAUTION]
> Eliminar un inquilino no se puede deshacer. El inquilino se elimina junto con sus registros,
> archivos, membresías, invitaciones, claves de API vinculadas al inquilino, datos de uso,
> suscripción, notificaciones y búsqueda. Si tienes dudas, [suspende](#suspend) el inquilino en su
> lugar.

1. Abre el inquilino.
2. Elige **Eliminar inquilino**.
3. Escribe el **slug** del inquilino (no su nombre) para confirmar y elige **Eliminar inquilino**.

Studio vuelve a la lista de inquilinos. El registro de auditoría conserva la constancia de la
eliminación. El contenido de los archivos almacenados se borra del backend de almacenamiento durante
el mantenimiento periódico del almacenamiento del servidor.

## Explorar los datos de un inquilino {#records}

**Explorar registros** en la página del inquilino abre [Registros](app:records) filtrado por este
inquilino. Se muestra cuando el módulo de registros está habilitado y tienes `records:read` en el
inquilino. Consulta [registros](help:records).

## Conviene saber {#good-to-know}

- Un usuario puede ser miembro de varios inquilinos, del mismo producto o de productos distintos,
  con un rol diferente en cada uno.
- Los operadores de producto no necesitan una membresía: su rol de producto ya abarca todos los
  inquilinos.
- Los selectores de otras pantallas (por ejemplo, **Ámbito de inquilino** en las claves de API o la
  pantalla **Invitaciones**) muestran los primeros 200 inquilinos por nombre.

## Solución de problemas {#troubleshooting}

**Conflicto: «a tenant with this slug exists in the product».** Elige un slug distinto. Los slugs de
inquilinos eliminados se pueden reutilizar.

**Revisa los datos introducidos: «slug must be 2-63 lowercase letters, digits or dashes».** Quita
del slug las mayúsculas, los espacios y los caracteres especiales.

**No permitido al abrir un inquilino.** El inquilino está suspendido (consulta
[reactivar](#reactivate)), el producto está archivado o te falta `tenant:read` en él.

**No encontrado al abrir un inquilino.** El inquilino se eliminó o no tienes ninguna relación con él
(Axentra responde igual en ambos casos para que no se puedan sondear los ID de inquilino).

**Modificado mientras tanto.** Otra persona cambió el inquilino mientras lo editabas. Recarga la
página y repite el cambio.

**El botón de eliminar sigue desactivado.** Escribe el slug exactamente como aparece en el diálogo,
por ejemplo `acme`, no el nombre visible.

**No aparece el botón Nuevo inquilino.** Te falta `tenants:create`. Pídeselo a un propietario o
administrador del producto.

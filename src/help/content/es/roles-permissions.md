---
title: Roles y permisos
summary: Entiende los permisos y los roles integrados, crea roles personalizados para tu producto y consulta el catálogo de permisos del producto.
keywords: rol, permiso, rol personalizado, rol integrado, derechos de acceso, derechos, privilegios, ámbito, permiso de producto, permiso declarado, permiso retirado, RBAC, control de acceso
---

Un **permiso** permite una acción, por ejemplo `records:write` (crear, cambiar y eliminar
registros). Un **rol** es un conjunto de permisos con nombre que asignas a personas. Axentra lo
deniega todo de forma predeterminada: una persona o una clave de API solo puede hacer lo que un rol
o la lista de permisos de la clave concede de forma explícita.

Cada permiso tiene un **ámbito**:

| Ámbito         | Se aplica a                                                                 | Lo conceden                                                                                                                     |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **plataforma** | Toda la instalación, por ejemplo `products:create`                          | Solo los roles de plataforma; nunca los roles personalizados ni las claves de API                                               |
| **producto**   | Un producto en su conjunto, por ejemplo `tenants:create`, `api_keys:manage` | Los roles de producto y las claves de API                                                                                       |
| **inquilino**  | Los datos de un inquilino, por ejemplo `records:read`                       | Los roles de inquilino en ese inquilino; los roles de producto y las claves de API de todo el producto, en todos los inquilinos |

La lista completa está en la [referencia de permisos](help:permissions-reference).

> [!IMPORTANT]
> Las pantallas **Roles** y **Permisos** requieren el módulo de acceso y `roles:read` (la pantalla
> **Permisos** también se abre con `api_keys:read`). Crear, editar y eliminar roles personalizados
> requiere `roles:manage` (propietarios y administradores del producto).

## Roles integrados {#built-in-roles}

Los roles integrados los proporciona Axentra y no se pueden modificar. Abre [Roles](app:roles) y
elige el icono del ojo para ver exactamente qué permisos tiene un rol integrado en tu producto. Sus
nombres los proporciona el servidor y aparecen en inglés.

| Rol                                            | Ámbito    | Finalidad                                                                                                                   |
| ---------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Product owner** (propietario del producto)   | producto  | Control total del producto, incluidos los operadores y los permisos del producto                                            |
| **Product admin** (administrador del producto) | producto  | Gestiona inquilinos, roles, claves y datos; no puede gestionar operadores ni declarar permisos del producto                 |
| **Support** (soporte)                          | producto  | Lo lee todo; gestiona los miembros de los inquilinos hasta el límite de sus propios permisos (en la práctica: observadores) |
| **Product viewer** (observador del producto)   | producto  | Acceso de solo lectura al producto y a todos sus inquilinos                                                                 |
| **Owner** (propietario)                        | inquilino | Control total del inquilino, incluidos otros propietarios                                                                   |
| **Admin** (administrador)                      | inquilino | Los mismos permisos que Owner, pero sin rango de propietario                                                                |
| **Member** (miembro)                           | inquilino | Trabaja con los datos del inquilino                                                                                         |
| **Viewer** (observador)                        | inquilino | Acceso de solo lectura al inquilino                                                                                         |

Además existen dos roles de plataforma: **Administrador de la plataforma** y **Observador de la
plataforma**. Se asignan en la página de un usuario; consulta [usuarios](help:users#platform-role).

## Crear un rol personalizado {#create}

Crea un rol personalizado cuando ningún rol integrado encaje, por ejemplo para un agente de soporte
que puede leer registros pero no archivos.

1. Abre [Roles](app:roles) y elige **Nuevo rol personalizado**.
2. Introduce un **Nombre**.
3. Revisa la **Clave**. Studio la deriva del nombre.
4. Elige el **Ámbito**: **Inquilino** para roles que asignas a miembros de inquilinos, **Producto**
   para roles que asignas a operadores de producto.
5. Si quieres, introduce una **Descripción**.
6. Selecciona los **Permisos** (consulta [la lista de permisos](#checklist)).
7. Elige **Guardar cambios**.

El rol se ofrece a partir de ese momento en todos los lugares donde se añaden o invitan miembros de
su ámbito.

| Campo           | Qué hace                                                                                      | Valores permitidos / valor predeterminado                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nombre**      | Nombre visible en las listas de roles.                                                        | De 1 a 100 caracteres. Se puede cambiar.                                                                                                         |
| **Clave**       | Identificador estable que se guarda en las membresías, por ejemplo `support_agent`.           | De 2 a 41 letras minúsculas, dígitos o guiones bajos; única en el producto; no puede ser una clave integrada como `member`. No se puede cambiar. |
| **Ámbito**      | **Inquilino**: solo permisos de inquilino. **Producto**: permisos de producto y de inquilino. | Predeterminado: **Inquilino**. No se puede cambiar.                                                                                              |
| **Descripción** | Explica el rol a otros administradores.                                                       | Hasta 500 caracteres.                                                                                                                            |
| **Permisos**    | Lo que permite el rol.                                                                        | Hasta 100 permisos. Los permisos de plataforma nunca se ofrecen.                                                                                 |

## Editar un rol personalizado {#edit}

Elige el icono del lápiz de un rol personalizado, cambia el nombre, la descripción o los permisos y
elige **Guardar cambios**. La clave y el ámbito no cambian.

> [!WARNING]
> Los cambios se aplican de inmediato a todas las personas que tienen el rol, en todos los
> inquilinos del producto.

## Eliminar un rol personalizado {#delete}

1. Elige el icono de la papelera del rol.
2. Escribe el nombre del rol para confirmar y elige **Eliminar rol**.

Un rol que sigue asignado a un miembro o a un operador no se puede eliminar: el servidor responde
**Conflicto** con el número de asignaciones. Asigna antes otro rol a esas personas.

## Usar la lista de permisos {#checklist}

La lista de permisos aparece en el editor de roles y al crear una clave de API.

- Los permisos se agrupan por recurso (la parte antes de los dos puntos, por ejemplo `records`). La
  casilla del grupo selecciona o desmarca todo el grupo; el contador muestra cuántos están
  seleccionados.
- **Filtrar permisos…** busca en los nombres y las descripciones.
- Los grupos marcados como **Producto** contienen permisos que tu producto ha declarado.
- Cada permiso muestra su descripción y su ámbito. A un rol de inquilino solo se le ofrecen permisos
  de inquilino; los permisos de producto retirados nunca se ofrecen.

> [!NOTE]
> Un rol personalizado puede contener cualquier permiso de su ámbito. El [techo de
> roles](help:members-invitations#role-ceiling) se aplica cuando el rol se _asigna_: solo las
> personas que tienen todos sus permisos pueden dárselo a otra persona.

## Permisos definidos por el producto {#product-permissions}

Además del catálogo integrado, un producto puede declarar sus propios permisos para sus propias
funciones, por ejemplo `crm.deals:approve`. Sus nombres siempre contienen un punto:
`<namespace>.<resource>:<action>`. Una vez declarados, se pueden conceder mediante roles
personalizados y claves de API igual que los integrados, y el código de tu producto los comprueba.

Abre [Permisos](app:permissions) para ver el catálogo del producto. Con `permissions:manage` (propietarios del producto) también puedes declarar permisos allí.

| Columna                 | Significado                                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Permiso**             | Nombre y descripción.                                                                                                                                                                                                                                                    |
| **Ámbito**              | **producto** o **inquilino**.                                                                                                                                                                                                                                            |
| **También concedido a** | Roles integrados que lo tienen además de las concesiones automáticas. **Roles de solo lectura** significa que lo tienen Support, Product viewer y Observador de la plataforma; **Solo propietarios y administradores** significa que ningún otro rol integrado lo tiene. |
| **Declarado por**       | **Código del producto** (lo registra el código del producto al arrancar) o **API** (declarado a través de la API HTTP).                                                                                                                                                  |
| **Estado**              | **Activo**, o **Retirado** con la fecha. Activa **Mostrar retirados** para ver los retirados.                                                                                                                                                                            |

Los propietarios y administradores del producto y los administradores de la plataforma tienen
siempre todos los permisos de producto activos; los propietarios y administradores de los
inquilinos, todos los de ámbito de inquilino.

> [!NOTE]
> Elige **Declarar permiso** para declarar uno mediante la API. En los permisos declarados así, el
> lápiz cambia uno (o reactiva uno retirado) y la papelera lo retira después de que escribas su
> nombre. Los permisos que registra el código del producto se cambian en el código; Studio no ofrece
> acciones para ellos. Un producto puede declarar hasta 500 permisos.

### Permisos retirados {#retired}

Un permiso retirado no concede nada, aunque siga guardado en un rol personalizado o en una clave de
API. Si se vuelve a declarar, recupera su efecto para quienes lo tienen. Al guardar un rol
personalizado en Studio se conservan los nombres retirados que tiene (el editor los muestra debajo
de la lista) y no se pueden añadir otros nuevos, y al rotar una clave de API se eliminan de la clave
de sustitución.

## Solución de problemas {#troubleshooting}

**Conflicto: «a role with this key exists» / «this key belongs to a built-in role».** Elige una
clave distinta.

**Revisa los datos introducidos: «key must be 2-41 lowercase letters, digits or underscores».**
Quita de la clave las mayúsculas, los guiones y los espacios.

**Conflicto: «the role is assigned N times; reassign those members first».** Cambia el rol de esos
miembros (en las pestañas **Miembros** de los inquilinos y del producto) antes de eliminarlo.

**Revisa los datos introducidos: «permissions not allowed for a tenant role».** Un rol de inquilino
solo puede contener permisos de inquilino.

**No se pudo cargar el catálogo de permisos.** Te falta `roles:read` (o `api_keys:read`) o no se
puede acceder al servidor. Recarga la página o pregunta a un propietario del producto.

**Modificado mientras tanto.** Otra persona guardó el rol mientras lo editabas. Cierra el editor,
vuelve a abrir el rol y repite el cambio.

**Falta un permiso en la lista.** Es un permiso de plataforma (nunca se puede conceder aquí), un
permiso de producto del otro ámbito o un permiso retirado.

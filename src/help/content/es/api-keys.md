---
title: Claves de API
summary: Crea claves de API para los servicios que llaman a Axentra, envíalas correctamente, rótalas sin interrupciones y revócalas, incluidas las claves derivadas de ellas.
keywords: clave de API, API key, clave, token, secreto, credencial, acceso de máquinas, cuenta de servicio, integración, rotar, rotación, período de gracia, revocar, caducidad, axk, bearer, X-API-Key
---

Una **clave de API** permite que una máquina, como el backend de tu producto, un worker o un script
de importación, llame a la API de Axentra sin que una persona inicie sesión. Cada clave pertenece
exactamente a un producto, tiene una lista explícita de permisos y se puede vincular a un
inquilino. Una clave nunca tiene permisos de plataforma.

El secreto de la clave se muestra **una sola vez**, al crear o rotar la clave. Axentra solo
almacena un hash, así que nadie, ni siquiera un administrador, puede volver a mostrarlo.

> [!IMPORTANT]
> La pantalla **Claves de API** requiere el módulo de acceso y `api_keys:read`. Crear, rotar y
> revocar claves requiere `api_keys:manage` (propietarios y administradores del producto). Solo
> puedes conceder a una clave permisos que tú mismo tienes a nivel de producto.

## Crear una clave de API {#create}

1. Abre [Claves de API](app:apiKeys) y elige **Nueva clave de API**.
2. Introduce un **Nombre** que indique dónde se usa la clave, por ejemplo
   `billing-worker production`.
3. Si quieres, elige un **Ámbito de inquilino** (consulta las
   [claves vinculadas a un inquilino](#tenant-scope)). Deja **Todo el producto** para una clave que
   funcione en todos los inquilinos.
4. Si quieres, elige una **Caducidad**: **Nunca** (predeterminado), **En 30 días**, **En 90 días**,
   **En 365 días**, o **En una fecha…** y después una **Fecha de caducidad** (consulta
   [caducidad](#expiry)).
5. Selecciona los **Permisos** que necesita el servicio, y ninguno más. La lista funciona como se
   describe en [roles y permisos](help:roles-permissions#checklist).
6. Elige **Crear clave**.
7. Copia el secreto de **Secreto de la clave de API** en tu gestor de secretos.
8. Marca **He guardado el secreto de forma segura** y elige **Listo**.

> [!CAUTION]
> El diálogo del secreto no se puede cerrar con Escape ni haciendo clic fuera, y el secreto no se
> puede volver a mostrar. Si se pierde, [rota la clave](#rotate) para obtener un secreto nuevo.

| Campo                   | Qué hace                                              | Valores permitidos / valor predeterminado                                                                                         |
| ----------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre**              | Etiqueta en la lista y en el registro de auditoría.   | De 1 a 200 caracteres. No tiene que ser único.                                                                                    |
| **Ámbito de inquilino** | Vincula la clave a un inquilino.                      | **Todo el producto** (predeterminado) o un inquilino. Se muestra cuando el módulo de inquilinos está habilitado.                  |
| **Permisos**            | Lo que puede hacer la clave.                          | De 1 a 100 permisos de ámbito producto o inquilino, incluidos los definidos por el producto que estén activos.                    |
| **Caducidad**           | Momento a partir del cual la clave deja de funcionar. | **Nunca** (predeterminado), 30, 90 o 365 días desde la creación, o el final de un día elegido (posterior a hoy, tu zona horaria). |

### Caducidad {#expiry}

Una clave con caducidad deja de funcionar en ese momento: se rechaza como una clave revocada y
aparece como **Caducado**. Elige una caducidad para claves que solo se necesitan durante un tiempo,
por ejemplo para una migración o la prueba de un socio; los servicios permanentes suelen usar claves
sin caducidad y [rotarlas](#rotate) periódicamente.

La caducidad no se puede cambiar después de crear la clave, y la rotación la conserva: crea una
clave nueva antes de que caduque la antigua y cambia el servicio. Las claves que un servicio crea
con otra clave nunca sobreviven a la clave que las crea (consulta [claves
derivadas](#derived-keys)); las claves creadas en Studio pertenecen a tu cuenta, así que esa regla
no se les aplica.

### Claves vinculadas a un inquilino {#tenant-scope}

Una clave con **Ámbito de inquilino** solo funciona dentro de ese inquilino: puede usar allí sus
permisos de inquilino, y sus permisos de producto no tienen ningún efecto. Cualquier otro inquilino
responde **No encontrado**. Cuando se elimina el inquilino, la clave se elimina con él; mientras el
inquilino está suspendido, la clave se rechaza.

## Enviar la clave con una solicitud {#use}

Una clave tiene el aspecto `axk_<26 characters>_<secret>`. La lista solo muestra la primera parte
(el **prefijo**, por ejemplo `axk_01jdk7x3m9q2w8v5r4t6y0z1ab_`), que identifica la clave pero no
sirve para llamar a la API. Envía la clave completa en una de estas cabeceras:

```http
GET /v1/products/prd_01EXAMPLE/tenants HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01jdk7x3m9q2w8v5r4t6y0z1ab_EXAMPLEsecretEXAMPLEsecretEXAMPLEsec
```

```bash
curl -H "X-API-Key: $AXENTRA_API_KEY" https://api.example.com/v1/products/prd_01EXAMPLE/tenants
```

Las solicitudes con una clave no necesitan token CSRF ni cookie. Mantén la clave fuera de los
navegadores y del código fuente; cárgala desde una variable de entorno o un gestor de secretos.
Consulta los [fundamentos de la API](help:api-basics).

## Leer la lista de claves {#list}

| Columna                | Significado                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nombre**             | El nombre y el prefijo de la clave.                                                                                                        |
| **Estado**             | **Activo**, **Caducado** (ha pasado su fecha de caducidad) o **Revocado** (revocada, o sustituida por rotación tras el período de gracia). |
| **Ámbito**             | **Todo el producto** o **Inquilino** con el ID del inquilino.                                                                              |
| **Permisos**           | Número de permisos.                                                                                                                        |
| **Último uso**         | Última solicitud correcta; se actualiza como máximo una vez por minuto.                                                                    |
| **Caduca**, **Creada** | Marcas de tiempo.                                                                                                                          |

Las claves activas aparecen primero, de la más reciente a la más antigua. Las claves caducadas y
revocadas siguen en la lista como referencia.

## Rotar una clave {#rotate}

Rotar sustituye una clave por otra nueva, por ejemplo de forma periódica o después de que un secreto
haya quedado expuesto.

1. En la fila de la clave, abre el menú de acciones (**…**) y elige **Rotar secreto**.
2. Elige un **Período de gracia para el secreto anterior**.
3. Elige **Rotar secreto** y guarda el secreto nuevo, igual que al crear una clave.

La sustituta es una **clave nueva** con un ID y un prefijo nuevos, y con el mismo nombre, permisos,
ámbito de inquilino y caducidad. Los permisos de producto retirados no se incluyen. La clave
anterior se revoca cuando termina el período de gracia.

```diagram
key-rotation
```

### Período de gracia {#grace-period}

| Opción                                                          | Efecto                                                                                                                            |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Ninguno: el secreto anterior deja de funcionar de inmediato** | La clave anterior se revoca en el acto. Los servicios que todavía la usan fallan hasta que reciben el secreto nuevo.              |
| **1 hora**, **24 horas**, **7 días**                            | La clave anterior y la nueva funcionan ambas hasta que termina el período. Las dos aparecen como **Activo**, con el mismo nombre. |

> [!TIP]
> Rotación sin interrupciones: rota con **24 horas**, despliega el secreto nuevo en todos los
> servicios, comprueba que el **Último uso** de la clave nueva avanza y el de la anterior se
> detiene, y después revoca la clave anterior para terminar antes el período de gracia.

Las claves que un servicio creó _con_ la clave anterior no se revocan al rotar y siguen funcionando.

## Revocar una clave {#revoke}

1. Abre el menú de acciones de la clave (**…**) y elige **Revocar clave**.
2. Escribe el nombre de la clave para confirmar y elige **Revocar clave**.

La clave deja de funcionar de inmediato y de forma permanente. Revocar una clave que está en su
período de gracia termina ese período en el acto.

> [!CAUTION]
> Al revocar también se revocan a la vez todas las claves **creadas con esta clave**, y las claves
> creadas con estas. La confirmación no las enumera; consulta la entrada del
> [registro de auditoría](help:audit) de la revocación para ver las claves derivadas revocadas.

## Claves derivadas y caducidad {#derived-keys}

Un servicio cuya clave tiene `api_keys:manage` puede crear más claves a través de la API. Estas
**claves derivadas**:

- tienen como máximo los permisos de la clave que las crea;
- nunca la sobreviven: sin caducidad propia heredan la caducidad de la clave creadora, y se rechaza
  una caducidad posterior;
- se revocan junto con ella (consulta [revocar](#revoke)), pero no al rotarla.

Las claves creadas en Studio las crea tu cuenta de usuario, no una clave, así que estas reglas no se
les aplican. Las claves pertenecen al producto, pero solo actúan dentro de los permisos actuales de
la persona que las creó (consulta la sección siguiente).

### Las claves dependen de los permisos de su creador {#creator-permissions}

Una clave solo funciona mientras la persona que la creó siga teniendo los permisos que usa la clave.
El servidor lo comprueba en cada solicitud: si se cambió el rol de esa persona, se la quitó del
producto o se desactivó su cuenta, una solicitud que necesita un permiso que ya no tiene se rechaza
con `403 api_key_creator_lost_access`, y la respuesta indica ese permiso en `permission`. La lista
de claves marca esa clave con **El creador perdió el acceso** e indica los permisos que ya no puede
usar. Devuélvele el permiso a esa persona, o crea una clave nueva como alguien que lo tenga, cambia
tus servicios a ella y revoca la clave antigua.

Studio nunca recibe este rechazo: usa tu sesión de usuario, no una clave.

## Conviene saber {#good-to-know}

- Un producto archivado o un inquilino suspendido hace que todas sus claves fallen con **No
  permitido** hasta que se restaura o se reactiva.
- Quitar un permiso de un producto (retirarlo) elimina en silencio su efecto en todas las claves.
- Da a cada servicio su propia clave, para poder rotar o revocar una sin afectar a las demás.

## Solución de problemas {#troubleshooting}

**No permitido: «you cannot grant permissions you do not hold: …».** Has seleccionado un permiso
que tú no tienes. Quítalo o pide a un propietario del producto que cree la clave. Lo mismo se aplica
a la rotación: quien rota debe tener todos los permisos de la clave.

**Revisa los datos introducidos: «an API key needs at least one permission» / «unknown
permissions».** Selecciona al menos un permiso; puede que entretanto se haya retirado un permiso de
producto.

**Revisa los datos introducidos: «only active keys can be rotated».** La clave está caducada o
revocada. Crea una clave nueva en su lugar.

**Revisa los datos introducidos: «expires_at must not be later than the expiry of the creating
key».** Solo a través de la API: una clave derivada no puede sobrevivir a su clave madre.

**Inicia sesión (401) cuando el servicio llama a la API.** La clave es incorrecta, está incompleta,
revocada o caducada. Comprueba que se envía la clave completa (no solo el prefijo) y que el estado es
**Activo**.

**No permitido (403) con una clave válida.** A la clave le falta el permiso para esa solicitud, el
producto está archivado o el inquilino está suspendido.

**No encontrado (404) con una clave válida.** La clave pertenece a otro producto o está vinculada a
otro inquilino.

---
title: Primeros pasos
summary: Una primera sesión guiada en Studio - crea un producto y un inquilino, invita a un miembro, crea una clave de API y comprueba que cada paso ha funcionado.
keywords: primeros pasos, empezar, inicio rápido, tutorial, principiante, primer producto, primer inquilino, primera clave de API, primera invitación, hola mundo, guía paso a paso
---

En este tutorial montas una estructura de trabajo pequeña pero real: un producto, un cliente
(inquilino) en ese producto, una invitación para una persona y una clave de API que puede usar una
máquina. Después de cada paso compruebas el resultado, para saber que ha funcionado. Se tarda unos
15 minutos.

Por el camino aprendes los términos más importantes. Si alguno te resulta nuevo, consulta los
[conceptos clave](help:concepts).

## Antes de empezar {#before-you-start}

> [!IMPORTANT]
>
> - Has iniciado sesión en Studio, idealmente como **administrador de la plataforma** (por ejemplo,
>   con la cuenta de la [configuración inicial](help:first-run-setup)).
> - Para crear un producto necesitas el permiso de plataforma `products:create` y un servidor en
>   **modo multiproducto**. En modo de producto único el producto ya existe: sáltate el
>   [paso 1](help:first-steps#create-product).
> - Para el [paso 4](help:first-steps#create-api-key) y su comprobación necesitas una línea de
>   comandos con `curl`.

Usa nombres de ejemplo. Este tutorial usa el producto «Example CRM» y el inquilino «Acme Ltd».

## Paso 1: Crear un producto {#create-product}

Un **producto** es tu aplicación en el servidor Axentra. Todo lo demás de este tutorial está dentro
de él.

1. Abre [Productos](app:products).
2. Elige **Nuevo producto**.
3. Introduce el **Nombre** `Example CRM`. Studio deriva el **Slug** `example-crm`; mantenlo.
4. Si quieres, añade una **Descripción**.
5. Elige **Crear producto**.

**Resultado esperado:** Studio indica «Producto “Example CRM” creado» y abre la página del producto.

**Compruébalo:** Abre la pestaña **Miembros**. Tu cuenta aparece con el rol **Product owner**
(propietario del producto): quien crea un producto se convierte en su propietario. El producto también aparece en el
selector de producto de la parte superior.

Ahora elige **Abrir panel**. Se abre el panel de «Example CRM»; todos los contadores muestran `0`
salvo **Usuarios** (tú, como operador del producto) y **Eventos de auditoría (24 h)**.

## Paso 2: Crear un inquilino {#create-tenant}

Un **inquilino** es una organización cliente de tu producto. Sus datos están estrictamente separados
de los de todos los demás inquilinos.

1. Abre [Inquilinos](app:tenants) o elige **Nuevo inquilino** en el panel.
2. Elige **Nuevo inquilino**.
3. Introduce el **Nombre** `Acme Ltd`. Studio deriva el **Slug** `acme-ltd`.
4. Elige **Crear inquilino**.

**Resultado esperado:** Studio indica «Inquilino “Acme Ltd” creado» y abre la página del inquilino
con las pestañas **Detalles**, **Miembros** e **Invitaciones**. El estado es **Activo**.

**Compruébalo:** De vuelta en el panel, **Inquilinos** muestra ahora `1`. Anota el **ID** del
inquilino en la pestaña **Detalles** (empieza por `ten_`); lo necesitarás en el paso 4.

> [!NOTE]
> Un inquilino nuevo no tiene miembros. Los añades en el siguiente paso.

## Paso 3: Invitar a un miembro {#invite-member}

Las personas se unen a un inquilino mediante una **invitación** (o se añaden directamente si ya
tienen una cuenta que puedes ver).

1. En la página del inquilino, abre la pestaña **Invitaciones**.
2. Elige **Invitar a un miembro**.
3. Introduce el **Correo electrónico** de un compañero, por ejemplo `maria@example.com`.
4. Deja **Rol** en **Member** (miembro) o elige otro rol. Los roles que superan tus propios permisos no se
   pueden seleccionar.
5. Elige **Enviar invitación**.

**Resultado esperado:** El diálogo **Invitación creada** muestra el secreto de la invitación,
marcado como **Se muestra solo una vez**: con el módulo `notify` habilitado, un **Enlace de
invitación** (y Axentra también envía la invitación por correo electrónico); si no, solo el **Token
de invitación**.

6. Copia el enlace o el token y envíaselo a tu compañero por un canal de confianza; después elige
   **Listo**.

**Compruébalo:** La pestaña **Invitaciones** muestra la invitación con el estado **Pendiente** y una
fecha de caducidad siete días después.

> [!IMPORTANT]
> Tu compañero la acepta con la sesión iniciada en una cuenta que tenga exactamente la dirección de
> correo electrónico invitada. Cómo funciona, también para personas sin cuenta, se describe en
> [Incorporar una organización cliente](help:tutorial-onboard-customer#accept-invitation).

## Paso 4: Crear una clave de API {#create-api-key}

Una **clave de API** permite que una máquina, por ejemplo la integración de Acme, llame a la API.
Cada clave tiene una lista explícita de permisos; dale solo lo que necesita.

1. Abre [Claves de API](app:apiKeys) o elige **Nueva clave de API** en el panel.
2. Elige **Nueva clave de API**.
3. Introduce el **Nombre** `acme-integration test`.
4. En **Ámbito de inquilino**, elige **Acme Ltd**. Así la clave solo puede acceder a los datos de
   este inquilino.
5. En **Permisos**, selecciona únicamente `tenant:read`.
6. Elige **Crear clave**.

**Resultado esperado:** El diálogo **Secreto de “acme-integration test”** muestra el **Secreto de la
clave de API**, que empieza por `axk_`. Cópialo ahora: solo se muestra esta vez.

7. Marca **He guardado el secreto de forma segura** y elige **Listo**.

**Compruébalo:** La clave aparece con el estado **Activo**, el ámbito **Inquilino** y **1 permiso**.

### Probar la clave {#try-api-key}

Llama a la API con la clave. Sustituye la dirección, el ID del producto (de la tarjeta **Servidor**
del panel, **ID del producto**) y el ID del inquilino:

```bash
curl -s https://axentra.example.com/v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE \
  -H "Authorization: Bearer axk_EXAMPLE_SECRET"
```

**Resultado esperado:** una descripción JSON del inquilino:

```json
{
  "id": "ten_01EXAMPLE",
  "product_id": "prd_01EXAMPLE",
  "slug": "acme-ltd",
  "name": "Acme Ltd",
  "status": "active"
}
```

La respuesta real contiene algunos campos más. De vuelta en Studio, recarga **Claves de API**:
**Último uso** muestra ahora una hora.

Si la llamada falla, consulta la [solución de problemas](help:first-steps#troubleshooting). Para
aprender a usar la API, consulta los [fundamentos de la API](help:api-basics).

## Paso 5: Revisar el registro de auditoría {#check-audit}

Todo lo que acabas de hacer ha quedado registrado.

1. Abre el [Registro de auditoría](app:audit).
2. En **Producto**, elige «Example CRM» y aplica el filtro.

**Resultado esperado:** Ves, del más reciente al más antiguo, `access.api_key.create`,
`tenancy.invitation.create`, `tenancy.tenant.create` y (en modo multiproducto)
`tenancy.product.create`, cada uno contigo como actor y el resultado **Éxito**. Selecciona una
entrada para ver sus detalles.

## Lo que has construido {#summary}

```diagram
hierarchy
```

Tienes un producto con un inquilino, una invitación abierta y una clave de API vinculada al
inquilino, y sabes dónde verificar cada uno de ellos. A continuación:

- Incorpora un cliente real de principio a fin:
  [Incorporar una organización cliente](help:tutorial-onboard-customer).
- Define tus propios roles: [roles y permisos](help:roles-permissions).
- Elimina la clave de prueba: en **Claves de API**, abre las acciones de la clave y elige **Revocar
  clave**.

## Solución de problemas {#troubleshooting}

| Problema                                          | Causa y solución                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Falta **Nuevo producto**                          | No eres administrador de la plataforma o el servidor funciona en modo de producto único. Usa el producto existente.   |
| **Conflicto** al crear el producto o el inquilino | El slug ya está en uso (productos: en el servidor; inquilinos: en el producto). Elige otro slug.                      |
| **Revisa los datos introducidos** para el slug    | Los slugs tienen entre 2 y 63 caracteres: letras minúsculas, dígitos y guiones, y empiezan por una letra o un dígito. |
| **Conflicto** al invitar                          | Ya existe una invitación abierta para esta dirección en el inquilino. Revócala o úsala.                               |
| **No permitido** al crear la clave                | Has seleccionado un permiso que tú no tienes.                                                                         |
| `curl` responde `401`                             | El secreto está incompleto o es incorrecto, o la clave se ha revocado. Crea una clave nueva.                          |
| `curl` responde `404`                             | El ID del producto o del inquilino es incorrecto, o la clave está vinculada a otro inquilino.                         |
| `curl` responde `403`                             | A la clave le falta el permiso (`tenant:read`) o el inquilino está suspendido.                                        |
| El registro de auditoría no muestra nada          | Necesitas `audit:read` para el producto (o un rol de plataforma). Revisa el filtro **Producto**.                      |

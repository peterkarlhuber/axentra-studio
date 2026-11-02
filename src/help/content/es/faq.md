---
title: Preguntas frecuentes
summary: Respuestas breves a las preguntas más habituales sobre Studio, con enlaces a los detalles.
keywords: FAQ, preguntas frecuentes, preguntas, cómo puedo, por qué, ayuda, respuestas, dudas habituales
---

Respuestas breves a preguntas habituales. Cada respuesta enlaza con el artículo que tiene los
detalles.

## ¿Puedo crear cuentas de usuario en Studio? {#create-users}

No. Las cuentas se crean durante la [configuración inicial](help:first-run-setup), cuando alguien
acepta una invitación o en el primer inicio de sesión mediante inicio de sesión único. En Studio
invitas a personas a un inquilino o añades cuentas existentes como miembros. Consulta
[Miembros e invitaciones](help:members-invitations).

## ¿Cómo convierto a alguien en operador de producto? {#add-operator}

Axentra no tiene invitaciones a nivel de producto. La persona necesita una cuenta que puedas ver:
invítala primero a uno de los inquilinos del producto y, cuando la haya aceptado, añádela en la
página del producto en **Miembros**. Un administrador de la plataforma puede añadir directamente
cualquier cuenta existente. Consulta [Productos](help:products).

## ¿Qué diferencia hay entre un rol de producto y un rol de inquilino? {#product-vs-tenant-role}

Un rol de inquilino (por ejemplo **Member**) solo se aplica en ese inquilino. Un rol de producto
(por ejemplo **Product admin**) se aplica al producto en su conjunto _y_ a todos sus
inquilinos. Da roles de producto solo a quien necesite ese alcance. Consulta
[Roles y permisos](help:roles-permissions).

## ¿Qué diferencia hay entre Owner y Admin de un inquilino? {#owner-vs-admin}

Tienen los mismos permisos. Solo un **Owner** (o alguien con autoridad desde el producto o la
plataforma) puede hacer propietario a alguien, o cambiar o quitar a un propietario. Cada inquilino
conserva siempre al menos un propietario. Consulta [techo de roles](help:security#role-ceiling).

## ¿Por qué no puedo elegir algunos roles? {#roles-greyed-out}

Studio marca los roles que no puedes asignar con **«… (por encima de tus permisos)»**: contienen
permisos que tú no tienes, o son un rol de propietario y tú no eres propietario. Nadie puede
repartir más derechos de los que tiene. Consulta [techo de roles](help:security#role-ceiling).

## He perdido el secreto de una clave de API. ¿Puedo volver a verlo? {#lost-secret}

No. Los secretos se muestran exactamente una vez y el servidor solo guarda un hash. Usa **Rotar
secreto** para obtener uno nuevo; un período de gracia mantiene operativo el secreto antiguo
mientras actualizas tus servicios. Consulta [Claves de API](help:api-keys).

## ¿Qué pasa con los datos cuando suspendo un inquilino? {#suspend-data}

No se elimina nada. Los miembros y las claves de API pierden el acceso hasta que se reactiva el
inquilino; los administradores de la plataforma pueden seguir consultándolo. Eliminar un inquilino,
en cambio, borra el inquilino y todos sus datos y no se puede deshacer. Consulta
[Inquilinos](help:tenants).

## ¿Por qué veo «No encontrado» para algo que existe? {#not-found-exists}

Si no tienes relación con un producto o inquilino, Axentra responde exactamente como si no
existiera, para que nadie pueda descubrir qué productos, inquilinos o cuentas hay. Pide a alguien
con acceso que te añada. Consulta [No encontrado](help:troubleshooting#not-found).

## ¿Por qué un área de la barra lateral está marcada como «Inactivo»? {#area-off}

El módulo del servidor que hay detrás está desactivado. Un operador puede activarlo en la
configuración del servidor. Consulta la [referencia de módulos](help:modules-reference).

## ¿Por qué me falta un botón? {#button-missing}

Studio oculta las acciones que tus permisos no permiten, y algunas acciones dependen del modo del
servidor (por ejemplo, **Nuevo producto** solo existe en el modo de varios productos). Busca el
permiso en la [referencia de permisos](help:permissions-reference).

## ¿Por qué se cerró mi sesión? {#signed-out}

Las sesiones terminan tras una duración máxima, tras un período de inactividad, cuando se revocan,
cuando se desactiva tu cuenta y cuando tu contraseña se cambió en otra sesión. Vuelve a iniciar
sesión; Studio te devuelve a la página en la que estabas. Consulta
[Seguridad](help:security#sessions).

## ¿Puedo pagar o guardar una tarjeta de crédito en Studio? {#payment}

No. Studio nunca pide datos de tarjeta ni bancarios. Los planes de pago pasan por la página de
checkout alojada del proveedor de pagos. Consulta
[Planes y suscripciones](help:plans-subscriptions).

## ¿Puedo editar registros en Studio? {#edit-records}

Sí, con el permiso `records:write` en ese inquilino. Al guardar se sustituye todo el objeto JSON
del registro. Consulta [Registros](help:records).

## ¿Por qué las horas de las programaciones no coinciden con lo que introduje? {#utc}

Las programaciones se ejecutan en UTC (sin horario de verano). Studio muestra la próxima y la última
ejecución en tu propia zona horaria. Consulta [Programaciones](help:schedules).

## ¿Dónde cambio la configuración del servidor? {#server-config}

En Studio no. La página **Configuración** muestra la configuración efectiva; los cambios los hace un
operador en el servidor. Consulta [Configuración](help:settings) y
[configuración del servidor](help:server-configuration).

## ¿Por qué hay textos en inglés si uso otro idioma? {#english-texts}

Las descripciones de los roles y permisos integrados y el **Mensaje del servidor** en los detalles
de los errores vienen del servidor y siempre están en inglés. Todo lo demás en Studio está
traducido.

## ¿Cómo comunico un problema? {#report-problem}

Abre **Detalles técnicos** en el mensaje de error y copia el **ID de solicitud** (`req_…`). Envíalo
a tu operador junto con la hora y lo que estabas haciendo. Consulta
[el ID de solicitud](help:troubleshooting#request-id).

## ¿Funciona Studio en un teléfono? {#mobile}

Sí. En pantallas estrechas, la barra lateral se convierte en un panel desplegable detrás de **Abrir
navegación**, y se ocultan las columnas de tabla menos importantes. Consulta
[Teclado y accesibilidad](help:keyboard-accessibility#zoom).

## ¿Puedo usar Studio solo con el teclado o con un lector de pantalla? {#accessibility}

Sí. Todas las funciones se pueden usar con el teclado, y Studio está diseñado para cumplir WCAG 2.1
AA. Consulta [Teclado y accesibilidad](help:keyboard-accessibility).

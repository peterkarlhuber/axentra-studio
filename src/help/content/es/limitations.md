---
title: Limitaciones conocidas
summary: Qué no hacen todavía Studio y el servidor de Axentra, o qué hacen con una restricción conocida, y cómo sortearlo.
keywords: limitaciones, problemas conocidos, no compatible, no admitido, función que falta, restricciones, solución alternativa, hoja de ruta, no es posible
---

Esta página recoge las restricciones que puedes notar al trabajar con esta versión de Studio y del
servidor de Axentra, cada una con una solución alternativa cuando existe. Algunas vienen de Studio y
otras del servidor; a veces la API del servidor ofrece más que Studio.

## Usuarios e inicio de sesión {#users-sign-in}

- **Studio solo crea cuentas de inicio de sesión único.** Las cuentas se crean en la configuración
  inicial, al aceptar una invitación, en el primer inicio de sesión único o cuando un administrador
  de la plataforma añade un [usuario de inicio de sesión único](help:users#external-user). No hay
  formulario para cuentas con contraseña: en su lugar, invita a las personas a un inquilino.
- **Axentra no tiene por sí mismo autenticación en dos pasos.** Si usas inicio de sesión único, tu
  proveedor de identidad puede exigirla. El restablecimiento de contraseña y la verificación del
  correo electrónico necesitan el módulo `notify`, que envía sus enlaces.
- **Los proveedores de inicio de sesión único solo se configuran en la configuración del
  servidor.** Studio no puede listar, añadir ni desactivar proveedores de identidad.
- **Las cuentas sin dirección de correo electrónico** (posibles con algunas configuraciones de
  inicio de sesión único) no pueden aceptar invitaciones, porque las invitaciones están vinculadas a
  una dirección. Añádelas directamente a los inquilinos.
- **No hay exportación ni borrado de los datos de una persona.** El operador tiene que gestionar las
  solicitudes de protección de datos en usuarios, registros, copias de seguridad y registros del
  sistema.
- **La limitación de inicios de sesión es por minuto.** Cualquiera que conozca una dirección de
  correo puede bloquear durante un máximo de un minuto los inicios de sesión con contraseña de esa
  cuenta enviando contraseñas incorrectas; las sesiones ya abiertas y el inicio de sesión único no
  se ven afectados.

## Roles, permisos y claves de API {#access}

- **Studio solo puede mostrar qué roles puedes asignar si puedes leer los roles** (`roles:read`).
  Sin ese permiso, el campo de rol es texto libre y el servidor explica el rechazo. Un cambio de rol
  hecho con una página abierta solo se detecta cuando Studio vuelve a cargar tus permisos, o cuando
  recargas la página.
- **Los permisos propios de un producto no se pueden declarar en Studio.** La página **Permisos** es
  de solo lectura; los productos los declaran en el código o a través de la API.
- **Al guardar un rol personalizado se descartan los permisos de producto retirados** que aún figuran
  en él. Mientras estaban retirados no tenían efecto, pero habrían vuelto si el producto los
  declarara de nuevo.
- **Las claves de API creadas por una persona no se revocan cuando esa persona se va.** Revísalas y
  revócalas tú.
- **La confirmación de revocación no lista las claves derivadas.** Revocar una clave también revoca
  todas las claves que se crearon con ella, pero Studio no muestra cuáles son.

## Datos y archivos {#data-files}

- **No hay recuentos totales.** Las listas muestran «Mostrando N entradas» y cargan más a petición;
  la API no tiene números de página ni totales, por diseño.
- **Registros:** solo se filtra por valores JSON de primer nivel y solo se ordena por ID o por fecha
  de creación o de actualización. Guardar un registro sustituye todo su objeto JSON. Un registro
  ocupa como máximo 256 KiB.
- **La búsqueda de texto completo** ([Búsqueda](help:search)) abarca un inquilino a la vez y solo
  encuentra palabras completas (sin prefijos ni búsqueda aproximada). Studio no añade documentos al índice; lo hace tu producto.
- **Copias de seguridad y almacenamiento de archivos:** Studio no muestra el estado de las copias de
  seguridad, y el procedimiento de copia de seguridad del servidor cubre la base de datos; el
  almacenamiento de archivos debe copiarse por separado.

## Tareas, eventos y webhooks {#events}

- **Poner tarea en cola solo se ofrece con `jobs:manage`.** Algunos tipos de tarea también pueden
  ponerlos en cola los usuarios de inquilinos, pero la API no indica cuáles, así que Studio no los
  ofrece.
- **La vista de eventos en directo consulta periódicamente.** Los eventos nuevos aparecen con un
  pequeño retraso, no al instante; no hay WebSockets.
- **El servidor calcula la próxima ejecución de una programación al guardarla**; Studio comprueba la
  sintaxis cron mientras escribes, pero no muestra la próxima ejecución de una expresión sin
  guardar. Las programaciones se ejecutan en UTC.

## Uso y facturación {#usage-billing}

- **Las reservas solo se pueden buscar por ID.** La API no tiene una lista de reservas.
- **Ningún dato de tarjeta ni bancario en Studio**, por diseño. Los planes de pago pasan por el
  checkout alojado del proveedor de pagos.
- **Los proveedores de pagos no se han probado con servicios reales** en esta versión; solo se han
  probado con proveedores simulados.

## Notificaciones {#notifications}

- **Solo correo electrónico y la bandeja de entrada dentro de la app.** No hay canales de SMS ni
  push, y el editor de plantillas de Studio solo crea plantillas de correo (las de bandeja de
  entrada se crean mediante la API).
- **El envío está limitado por inquilino**: por defecto, 1000 notificaciones en cualquier hora móvil
  (`notify.tenant_send_limit_per_hour`); las demás se rechazan con **Demasiadas solicitudes**.

## Studio y el servidor {#studio-server}

- **La versión del servidor solo se comprueba cuando Studio se carga.** Tras actualizar el
  servidor, recarga la página. La lista de módulos activados también se lee solo al cargar.
- **Las direcciones separadas para Studio y la API** solo funcionan si ambas pertenecen al mismo
  sitio (por ejemplo `studio.example.com` y `api.example.com`). La configuración recomendada y
  probada sirve ambos desde la misma dirección.
- **Servidores de un solo producto con productos sobrantes:** si un servidor en modo de un solo
  producto aún contiene otros productos, Studio oculta el selector de productos. Los
  administradores de la plataforma solo llegan a los demás productos a través de la página
  **Productos**, y no pueden archivarlos allí.
- **La configuración del servidor no se puede cambiar en Studio.** La página **Configuración** solo
  muestra la configuración efectiva; los cambios se hacen en el servidor.
- **El límite general de frecuencia de solicitudes está desactivado por defecto** y se cuenta por
  proceso del servidor.

## Navegadores, idiomas y accesibilidad {#browsers-languages}

- **Solo se prueban automáticamente los navegadores basados en Chromium.** Firefox y Safari
  deberían funcionar, pero no están cubiertos por las pruebas automatizadas.
- **Los textos del servidor están en inglés**: las descripciones de roles y permisos y el **Mensaje
  del servidor** en los detalles de los errores no se traducen.
- **Las comprobaciones de accesibilidad cubren la primera vista de cada página**; los diálogos,
  menús y errores de formulario abiertos solo se comprueban en algunas áreas. Consulta
  [Teclado y accesibilidad](help:keyboard-accessibility#known-gaps).

## Operación {#operations}

- **No se ha hecho ningún despliegue en producción ni pruebas de carga** con esta versión; aún no
  hay cifras de capacidad.
- **Las migraciones de base de datos solo van hacia delante.** Volver a una versión anterior
  significa restaurar una copia de seguridad.

## Páginas relacionadas {#related}

- [Solución de problemas](help:troubleshooting) para los mensajes de error y sus soluciones.
- [Preguntas frecuentes](help:faq) para las dudas habituales.
- [Referencia de módulos](help:modules-reference) para saber qué significa un módulo desactivado.

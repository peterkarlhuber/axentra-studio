---
title: Notificaciones
summary: Escribe plantillas de correo en varios idiomas, previsualízalas y pruébalas, sigue la entrega en el historial de mensajes y define tus propias preferencias de notificación.
keywords: notificación, correo, correo electrónico, email, e-mail, plantilla, mensaje, bandeja de salida, entrega, SMTP, vista previa, envío de prueba, buzón, darse de baja, cancelar suscripción, preferencias, idioma, traducción
---

Axentra envía correos a partir de **plantillas**. Una plantilla tiene una clave, una categoría y una
**variante** por idioma con un asunto, un cuerpo de texto y un cuerpo HTML opcional. Tu producto (o
el propio Axentra, en el caso de las invitaciones) envía una plantilla a un destinatario con valores
para sus marcadores; Axentra la genera, guarda el mensaje en una bandeja de salida y lo entrega en
segundo plano. En Studio escribes y previsualizas plantillas, envías mensajes de prueba, compruebas
el estado de entrega y eliges qué notificaciones recibes tú.

> [!IMPORTANT]
> La pantalla **Notificaciones** necesita el módulo `notify` en el servidor; sin él, la entrada no
> aparece en la navegación (y las invitaciones no envían correo). Las plantillas, el historial de
> mensajes, el buzón y las estadísticas requieren el permiso de producto `notify:manage`. Enviar
> una prueba requiere además `notify:send` en el inquilino. Cualquier persona que pertenezca al
> producto puede definir sus propias preferencias.

## La pantalla Notificaciones {#overview}

Abre [Notificaciones](app:notifications). Con `notify:manage` ves **Estadísticas de entrega** y las
pestañas **Plantillas**, **Historial de mensajes**, **Buzón** y **Mis preferencias**. Sin él solo
ves **Mis preferencias**.

**Estadísticas de entrega** cuenta los mensajes de este producto por estado, en total y en las
**Últimas 24 horas**, y muestra el **Proveedor de entrega**, los **Intentos de entrega (24 h)** y el
**Mensaje en cola más antiguo**. La tarjeta se actualiza cada 30 segundos. Un mensaje en cola
antiguo suele significar que no hay ningún despachador en marcha (consulta
[Solución de problemas](help:notifications#troubleshooting)).

## Plantillas {#templates}

La pestaña **Plantillas** lista tus plantillas y las predeterminadas **Integrada** con categoría,
idiomas y versión. Distintivos:

- **Integrada**: una plantilla predeterminada que incluye Axentra (actualmente `invitation`, en
  inglés y alemán). Ábrela y guárdala para crear tu propia versión con la misma clave, que sustituye
  a la predeterminada en este producto. Si eliminas tu versión, se restaura la predeterminada.
- **Confidencial**: el contenido de los mensajes enviados nunca se muestra y se borra una vez
  enviado.
- **Solo sistema**: Axentra envía esta plantilla por sí mismo (el correo de invitación con su
  enlace de aceptación de un solo uso). Puedes cambiar su contenido, pero no se puede enviar
  manualmente ni como prueba.

### Crear una plantilla {#create-template}

1. Elige **Nueva plantilla**.
2. En **General**, introduce la **Clave de la plantilla**, por ejemplo `welcome`. Tu producto envía
   la plantilla con esta clave; no se puede cambiar después.
3. Opcional: **Nombre** y **Descripción** para Studio.
4. Introduce la **Categoría**, por ejemplo `onboarding` (consulta
   [Categorías](help:notifications#categories)).
5. Activa **Confidencial** para contenidos como enlaces o códigos de un solo uso.
6. En **Variables y valores de ejemplo**, declara cada marcador y da un valor de ejemplo para la
   vista previa (consulta [Marcadores](help:notifications#placeholders)).
7. En **Contenido por idioma**, rellena **Asunto** y **Texto** para `en` y, si quieres, **HTML**.
8. Añade más idiomas (consulta [Idiomas](help:notifications#locale-variants)).
9. Elige **Crear plantilla**.

Cada vez que guardas después, aumenta la versión (**Guardar nueva versión**). Las versiones
anteriores no se conservan: el historial de mensajes guarda el contenido generado y el número de
versión de cada mensaje, no la plantilla antigua.

### Configuración de la plantilla {#template-settings}

| Ajuste                    | Qué hace                                                                         | Valores permitidos / predeterminado                                                                            |
| ------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Clave de la plantilla** | Identificador que se usa al enviar                                               | De 2 a 63 caracteres: letras minúsculas, dígitos, `_`, `.` y `-`, empezando por una letra; no se puede cambiar |
| **Categoría**             | Agrupa las plantillas para las bajas                                             | De 2 a 41 letras minúsculas, dígitos y `_`, empezando por una letra; predeterminado `transactional`            |
| **Canal**                 | Canal de entrega                                                                 | Solo **Correo electrónico**                                                                                    |
| **Confidencial**          | El contenido de los mensajes enviados nunca se devuelve y se borra tras el envío | Desactivado                                                                                                    |
| **Variables**             | Marcadores que puede usar la plantilla                                           | Como máximo 50; letras, dígitos y `_`, sin empezar por un dígito                                               |
| **Contenido por idioma**  | Asunto, texto y HTML opcional por idioma                                         | De 1 a 20 idiomas; `en` es obligatorio                                                                         |

### Marcadores {#placeholders}

Escribe los marcadores como `{{ name }}` en el asunto, el texto o el HTML. Solo se admiten
marcadores simples: nada de condiciones, bucles, filtros ni expresiones, y cualquier otra cosa que
empiece por `{{` se rechaza al guardar. Cada marcador debe estar declarado como variable; si el
texto usa marcadores no declarados, Studio ofrece **Declarar los marcadores usados**.

Al enviar un mensaje, cada marcador necesita un valor (cadena, número o true/false, de 10 000
caracteres como máximo). Los valores se insertan tal cual en el cuerpo de texto; en el cuerpo HTML
se escapan como HTML. Los asuntos nunca contienen saltos de línea.

> [!WARNING]
> Un valor usado dentro de un enlace (`href`) controla el destino del enlace. Mantén los enlaces en
> la plantilla o deja que tu backend los construya; no permitas que los proporcionen los usuarios
> finales.

### Categorías {#categories}

Los destinatarios pueden darse de baja de categorías en sus preferencias. `transactional` y
`security` se entregan siempre y no admiten bajas. Úsalas solo para mensajes que un usuario tiene
que recibir, como restablecimientos de contraseña o recibos. Studio sugiere `transactional`,
`security`, `onboarding` y `product`; puedes introducir cualquier categoría válida.

### Idiomas y alternativa {#locale-variants}

Cada idioma es una **variante**. Para añadir una, escribe un código de idioma como `de` o `de-at` en
**Añadir idioma** y elige **Añadir**; **Quitar el idioma …** la quita. El inglés (`en`) es
obligatorio.

Axentra elige la variante en este orden: el idioma solicitado (por ejemplo `de-at`), después su
idioma base (`de`) y después `en`. El idioma solicitado es el que se elige al enviar; si no hay
ninguno, el idioma del usuario destinatario; si tampoco, (para las invitaciones) el idioma
predeterminado del producto; y, en último caso, el inglés.

## Vista previa {#preview}

El servidor genera la **Vista previa** junto al editor a partir del estado actual sin guardar y con
tus valores de ejemplo, un momento después de que dejes de escribir. Elige el idioma en el selector
de la vista previa; «Generada en el idioma …» te indica qué variante se usó. La vista previa
aparece cuando todos los idiomas tienen asunto y texto.

El HTML se muestra en un marco aislado: los scripts nunca se ejecutan y no se cargan imágenes,
fuentes ni estilos remotos. Los programas de correo de los destinatarios pueden mostrar el mensaje
de otra forma.

## Enviar una prueba {#send-test}

**Enviar prueba** (en el editor, o el icono de envío en la lista de plantillas) envía una
notificación **real**:

1. Elige el **Inquilino**. El mensaje pertenece a este inquilino; necesitas `notify:send` en él.
2. Elige el destinatario:
   - **Un miembro del inquilino**: elige el **Miembro**. Se usa su idioma salvo que elijas otro.
   - **Una dirección de correo electrónico**: solo con el permiso de producto
     `notify:send_external` (propietarios y administradores del producto). Sin él, Studio te explica
     que solo puedes enviar a miembros.
3. Opcional: elige un **Idioma**; si no eliges ninguno, se usa el idioma del destinatario y, si no,
   el inglés.
4. Ajusta los **Valores** (rellenados con los valores de ejemplo).
5. Opcional: **Vista previa** muestra el resultado con estos valores. Después elige **Enviar**.

Studio confirma **Notificación aceptada** con el ID y el estado del mensaje. La entrega se produce
de forma asíncrona; síguela en el **Historial de mensajes**. Cada diálogo envía con su propia clave
de idempotencia, así que un clic repetido tras un error de red no envía dos veces.

Si el destinatario se dio de baja de la categoría de la plantilla, el mensaje se acepta con el
estado **Suprimido** y no se entrega.

## Historial de mensajes {#message-log}

El **Historial de mensajes** es la bandeja de salida: cada notificación del producto con hora,
plantilla (clave, versión e idioma), **Destinatario**, **Estado**, **Intentos** y **Último error**.
Filtra por **Estado**, **Clave de la plantilla**, **Destinatario** e **Inquilino** y elige
**Aplicar**; **Restablecer filtros** los borra. El icono de detalles abre todos los campos y, si
está disponible, el contenido.

| Estado        | Significado                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **En cola**   | Esperando al despachador; **Próximo intento** indica cuándo                                           |
| **Enviando**  | Un despachador lo está entregando                                                                     |
| **Enviado**   | El proveedor lo aceptó                                                                                |
| **Fallido**   | Error permanente, o se agotaron todos los intentos                                                    |
| **Suprimido** | No enviado: el destinatario se dio de baja de la categoría, o el usuario no tiene dirección de correo |

Una entrega fallida se reintenta automáticamente con esperas cada vez más largas, por defecto hasta
5 intentos. **Reintentar entrega** vuelve a poner en cola un mensaje **Fallido** con intentos
nuevos. No es posible después de que la retención haya borrado el contenido; en ese caso, vuelve a
enviar la notificación.

Puede que falte el contenido: las plantillas confidenciales nunca lo muestran, la retención lo borra
(por defecto, 30 días después de la entrega) y los mensajes suprimidos no guardan ninguno. Studio
indica qué caso se aplica. El servidor elimina tokens, claves y contraseñas del último error.

> [!NOTE]
> La entrega es «al menos una vez»: tras un fallo del sistema, un mensaje puede entregarse dos
> veces. Los mensajes llevan un Message-ID estable, para que los servidores de correo puedan
> reconocer los duplicados. El orden de los mensajes no está garantizado.

## Buzón {#mailbox}

El **Buzón** solo existe cuando el servidor usa el proveedor local de desarrollo
(`notify.provider = "local"`). Ese proveedor no envía nada; guarda aquí lo que «entregó», para que
puedas comprobar las plantillas en servidores de desarrollo y de pruebas. Filtra por
**Destinatario** y abre un mensaje para verlo tal como se entregó.

Con un proveedor real (SMTP), la pestaña indica **No hay buzón local en este servidor**: los
mensajes van a destinatarios reales y los sigues en el **Historial de mensajes**.

## Mis preferencias {#preferences}

En **Mis preferencias** eliges qué categorías recibes de este producto:

1. En **Se aplica a**, elige **Todo el producto** o un inquilino.
2. En **Recibir estas categorías**, desmarca las categorías que no quieras. Las categorías
   bloqueadas (`transactional`, `security`) se entregan siempre.
3. Elige **Guardar preferencias**.

Las preferencias se aplican a los mensajes enviados a partir de ahora, a ti como usuario y a tu
dirección de correo. Una categoría que desactivas para todo el producto sigue desactivada en todos
los inquilinos; un ajuste de inquilino puede desactivar más, pero no volver a activar categorías.
Las categorías aparecen cuando el producto tiene plantillas en ellas. Definir preferencias para un
inquilino requiere `notify:preferences` en él (los miembros y administradores lo tienen).

## Para administradores y desarrolladores {#developers}

- **Enviar desde tu producto**: `POST /v1/products/{product_id}/tenants/{tenant_id}/notify/send`
  con `template_key`, `to` (`{"user_id": …}` o `{"email": …}`), `variables` y `locale` opcional,
  además de una cabecera `Idempotency-Key`. Requiere `notify:send` en el inquilino; las direcciones
  libres fuera de los miembros del inquilino requieren además `notify:send_external`. Consulta
  [Conceptos básicos de la API](help:api-basics).
- **Despachador**: los mensajes solo se entregan mientras se ejecuta un despachador (`axentra
notify-dispatch --loop` o un worker). Sin él, los mensajes se quedan **En cola**.
- **Proveedores y configuración** (`[notify]`): `provider` (`local` o `smtp`), `sender`, host,
  puerto, credenciales y STARTTLS de SMTP, `max_attempts` (predeterminado 5), backoff,
  `content_retention_days` (predeterminado 30) y `message_retention_days` (predeterminado 180).
  Consulta [Configuración del servidor](help:server-configuration).
- **Privacidad**: los asuntos y cuerpos se cifran en reposo. Las direcciones de los destinatarios
  son datos personales y las ven las personas con `notify:manage`; se eliminan junto con el mensaje
  al terminar la retención de mensajes.
- **Invitaciones**: cuando se crea una invitación a un inquilino, Axentra envía la plantilla
  `invitation` con el enlace de aceptación. Consulta
  [Miembros e invitaciones](help:members-invitations).

## Conviene saber {#good-to-know}

- Solo correo electrónico: ni SMS ni push, ni archivos adjuntos, ni dirección de remitente por
  producto.
- No hay enlace para darse de baja ni cabecera `List-Unsubscribe`; las bajas solo funcionan con las
  preferencias y solo para direcciones que pertenecen a usuarios.
- Aún no hay límite de frecuencia de envío por inquilino.
- Consulta [Limitaciones conocidas](help:limitations).

## Solución de problemas {#troubleshooting}

| Qué ves                                                                   | Por qué                                                                                                     | Qué hacer                                                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Solo **Mis preferencias**                                                 | No tienes `notify:manage`                                                                                   | Pide acceso a un administrador del producto si necesitas las plantillas                                         |
| **Revisa los datos introducidos** al guardar                              | Clave o categoría no válida, marcador no declarado, sintaxis `{{ … }}` no admitida o falta la variante `en` | Lee el mensaje del servidor; corrige el campo o el marcador indicado                                            |
| La vista previa indica que falta un valor                                 | Una variable declarada no tiene valor de ejemplo                                                            | Rellena el **Valor de ejemplo**                                                                                 |
| **Conflicto** «ya existe una plantilla con esta clave»                    | Las claves son únicas por producto                                                                          | Elige otra clave o edita la plantilla existente                                                                 |
| **Modificado mientras tanto**                                             | Otra persona guardó la plantilla                                                                            | Recarga; tus cambios sin guardar se pierden, así que cópialos antes                                             |
| No hay icono de envío para una plantilla                                  | Es **Solo sistema**, o no tienes `notify:send`                                                              | Es lo esperado para las invitaciones; pide un rol con `notify:send`                                             |
| «No tienes el permiso notify:send en este inquilino»                      | Tu rol no cubre ese inquilino                                                                               | Elige otro inquilino o pide un rol                                                                              |
| **No permitido** al enviar a una dirección                                | La dirección no es de un miembro y no tienes `notify:send_external`                                         | Envía a un miembro o pregunta a un propietario del producto                                                     |
| **No encontrado** para un miembro                                         | El usuario no es miembro del inquilino                                                                      | Elige un miembro del inquilino seleccionado                                                                     |
| Los mensajes se quedan **En cola**; **Mensaje en cola más antiguo** crece | No hay ningún despachador en marcha                                                                         | Pide al operador que ejecute `axentra notify-dispatch --loop` o un worker                                       |
| Los mensajes terminan como **Fallido**                                    | SMTP rechazó el mensaje o no es accesible                                                                   | Lee **Último error**; pide al operador que compruebe la configuración SMTP y después usa **Reintentar entrega** |
| **Conflicto** al usar **Reintentar entrega**                              | El mensaje no ha fallado, o su contenido se borró                                                           | Vuelve a enviar la notificación                                                                                 |
| **Suprimido**                                                             | El destinatario se dio de baja de la categoría, o no tiene dirección de correo                              | Usa `transactional` solo para mensajes que los usuarios deben recibir                                           |
| **No hay buzón local en este servidor**                                   | El servidor usa SMTP                                                                                        | Usa el **Historial de mensajes**                                                                                |

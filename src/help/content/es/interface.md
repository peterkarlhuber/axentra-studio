---
title: Orientarse en Studio
summary: La estructura de Studio, la barra lateral, el selector de producto, el menú de usuario, el panel y la ayuda integrada.
keywords: interfaz, diseño, navegación, barra lateral, menú, cajón, móvil, teléfono, ruta de navegación, breadcrumbs, selector de producto, menú de usuario, idioma, tema, modo oscuro, modo claro, panel, dashboard, ayuda, sugerencia, búsqueda, teclado
---

Este artículo muestra cómo está organizado Studio, para que encuentres rápidamente cada pantalla.
Trata la navegación, el cambio de producto, los ajustes personales como el idioma y el tema, el panel
y la ayuda integrada en cada pantalla.

## La estructura {#layout}

Después de iniciar sesión, Studio abre el panel del último producto que usaste, o la lista de
productos si todavía no tienes ninguno. Cada pantalla tiene tres partes:

- **Barra lateral** (izquierda): la navegación, agrupada por áreas.
- **Barra superior**: a la izquierda, la **ruta de navegación** (el camino hasta la página actual,
  con cada paso clicable); a la derecha, el **selector de producto**, el botón de ayuda y el **menú
  de usuario**.
- **Área de contenido**: el título de la página con una descripción de una línea, la acción
  principal de la página a la derecha (por ejemplo, **Nuevo inquilino**) y, debajo, filtros, tablas,
  tarjetas y pestañas.

## La barra lateral {#sidebar}

La barra lateral enumera las áreas en este orden:

| Grupo                          | Entradas                                                              |
| ------------------------------ | --------------------------------------------------------------------- |
| (arriba)                       | **Panel**, **Productos**                                              |
| **Identidad e inquilinos**     | **Inquilinos**, **Usuarios**, **Invitaciones**                        |
| **Acceso y claves de API**     | **Roles**, **Permisos**, **Claves de API**                            |
| **Datos y almacenamiento**     | **Resumen de datos**, **Registros**, **Archivos**                     |
| **Eventos y tareas**           | **Tareas**, **Programaciones**, **Eventos**, **Webhooks**             |
| **Uso y facturación**          | **Uso**, **Planes**, **Suscripciones**                                |
| (individual)                   | **Notificaciones**                                                    |
| **Auditoría y monitorización** | **Registro de auditoría**, **Estado del sistema**, **Monitorización** |
| (abajo)                        | **Configuración**, **Centro de ayuda**                                |

Las entradas que pertenecen a un producto (de **Panel** a **Notificaciones**, salvo **Productos**)
solo se muestran cuando hay un producto seleccionado. **Productos**, **Registro de auditoría**,
**Estado del sistema**, **Monitorización** y **Configuración** abarcan toda la plataforma.

La barra lateral muestra las mismas entradas a todo el mundo, con una excepción: **Registro de
auditoría** solo aparece si puedes leer eventos de auditoría (`audit:read` en uno de tus productos,
o `platform:audit`). **Configuración**, **Estado del sistema** y **Monitorización** aparecen siempre
porque ofrecen algo a todos (tus preferencias, las comprobaciones públicas de estado); las partes
que no puedes leer te lo indican allí. Si abres una página para la que no tienes permiso, por
ejemplo desde un enlace guardado, la página te lo indica (**No permitido**), y no se ofrecen las
acciones que no puedes realizar.

### Entradas marcadas como «Inactivo» {#module-off}

Una entrada cuyo módulo del servidor no está habilitado sigue visible y muestra **Inactivo**. Al
abrirla aparece **Módulo no habilitado en este servidor** con el id del módulo (por ejemplo
`storage`) que el operador del servidor tiene que habilitar. Así puedes ver qué existe y qué falta.
Consulta los [módulos](help:concepts#modules).

### Contraer la barra lateral {#collapse-sidebar}

En la parte inferior de la barra lateral, **Contraer barra lateral** la reduce a iconos; **Expandir
barra lateral** vuelve a mostrar los nombres. En la barra lateral contraída, pasa el puntero por
encima de un icono o ponle el foco para ver su nombre. Studio recuerda la elección en este navegador.
La versión del servidor aparece en la parte inferior de la barra lateral expandida.

### En teléfonos y pantallas pequeñas {#mobile}

Studio funciona a partir de 360 píxeles de ancho. En pantallas estrechas, la barra lateral se
convierte en un panel desplegable: ábrelo con **Abrir navegación** (el botón de menú arriba a la
izquierda). Se cierra al elegir una página, con **Cerrar navegación** o con Escape. Las tablas anchas
se desplazan dentro de su propia área y es posible que se oculten las columnas menos importantes.

## Cambiar de producto {#product-switcher}

La mayoría de las áreas pertenecen a un producto; la dirección contiene entonces `/p/<product id>/`.
El **selector de producto** de la barra superior muestra el producto actual (**Producto** y su
nombre).

1. Selecciona el selector de producto.
2. Elige otro producto de la lista, o **Todos los productos** para abrir la lista de productos.

Studio se mantiene en la misma área al cambiar: si estás viendo los inquilinos del producto A,
llegas a los inquilinos del producto B. Studio recuerda el último producto en cada navegador. Los
productos archivados no aparecen en el selector; ábrelos desde **Productos**.

En las páginas de toda la plataforma (por ejemplo, **Registro de auditoría** o **Configuración**),
el selector puede mostrar **Ningún producto seleccionado**.

En **modo de producto único** no hay menú: la barra superior muestra una etiqueta fija **Producto**
con el nombre del único producto del servidor. Consulta el
[modo de producto único y multiproducto](help:concepts#single-multi-product).

## Ruta de navegación {#breadcrumbs}

La ruta de navegación muestra dónde estás, por ejemplo _Inquilinos › ten_01EXAMPLE_. Elige un paso
anterior para subir de nivel.

## El menú de usuario {#user-menu}

Abre el menú de usuario con tus iniciales y tu nombre, arriba a la derecha. Contiene:

| Entrada           | Qué hace                                                                             |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Perfil**        | Tu cuenta: nombre, contraseña, sesiones activas. Consulta el [perfil](help:profile). |
| **Idioma**        | El idioma de la interfaz. Consulta [más abajo](help:interface#language).             |
| **Tema**          | **Claro**, **Oscuro** o **Sistema**. Consulta [más abajo](help:interface#theme).     |
| **Cerrar sesión** | Termina tu sesión. Consulta [iniciar y cerrar sesión](help:signing-in#sign-out).     |

### Idioma {#language}

Elige **Idioma** en el menú de usuario y selecciona un idioma. El cambio se aplica de inmediato. Se
guarda en este navegador y en tu cuenta, de modo que te acompaña en otros navegadores. También puedes
cambiarlo en **Configuración** o, antes de iniciar sesión, en la página de inicio de sesión. Si no
eliges ninguno, Studio usa el idioma del navegador. Las fechas, horas y números se formatean según el
idioma elegido.

> [!NOTE]
> Algunos textos proceden del servidor y siempre están en inglés: los nombres y descripciones de los
> roles integrados (por ejemplo, «Product admin», «Owner»), las descripciones del catálogo de
> permisos y el mensaje del servidor en los detalles técnicos de un error.

### Tema {#theme}

Elige **Tema** en el menú de usuario: **Claro**, **Oscuro** o **Sistema** (sigue a tu sistema
operativo). Al igual que el idioma, el tema se guarda en este navegador y en tu cuenta.

## El panel {#dashboard}

El **Panel** es la página de inicio de un producto. Muestra:

- **Contadores**: **Inquilinos**, **Usuarios**, **Claves de API**, **Eventos de auditoría (24 h)**,
  **Registros** y **Solicitudes denegadas (24 h)**. Cada contador enlaza con la página
  correspondiente; su sugerencia (i) indica exactamente qué se cuenta. Si el servidor no informa de
  ningún contador, verás «El servidor no informó de contadores para este producto.»
- Tarjetas de **Uso y facturación**, cuando esos módulos están habilitados y tienes permiso para
  leerlos.
- **Estado del sistema**: el resultado de la comprobación de disponibilidad (readiness) del
  servidor, con **Detalles**.
- **Servidor**: **Versión del servidor**, **Versión de la API**, **Entorno**, **Modo**, **ID del
  producto** y los **Módulos** con su estado (verde: habilitado; gris: no habilitado).

Acciones rápidas arriba a la derecha: **Nuevo inquilino** (con `tenants:create`, módulo `tenancy`) y
**Nueva clave de API** (con `api_keys:manage`).

| Contador                         | Qué se cuenta                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Inquilinos**                   | Todos los inquilinos del producto, activos y suspendidos.                                                  |
| **Usuarios**                     | Miembros de inquilinos y operadores de producto, cada persona una sola vez.                                |
| **Claves de API**                | Claves no revocadas, incluidas las caducadas.                                                              |
| **Registros**                    | Registros de todas las colecciones e inquilinos.                                                           |
| **Eventos de auditoría (24 h)**  | Eventos de auditoría de este producto en las últimas 24 horas.                                             |
| **Solicitudes denegadas (24 h)** | Intentos rechazados en las últimas 24 horas; abre el registro de auditoría filtrado por eventos denegados. |

> [!TIP]
> La tarjeta **Servidor** responde a la pregunta más habitual del soporte: «¿Qué versión se está
> ejecutando y está siquiera habilitado el módulo?»

## Listas y formularios {#lists-forms}

- Las **listas** se cargan página a página: debajo de una tabla, **Cargar más** obtiene las
  siguientes entradas y **Todas las entradas cargadas** marca el final. No hay números de página.
- Los **diálogos de creación** añaden `?new=1` a la dirección, de modo que el diálogo sobrevive a
  una recarga y el botón Atrás del navegador lo cierra.
- Los **slugs** (nombres cortos aptos para URL) se derivan del nombre hasta que editas el slug tú
  mismo.
- **Guardar cambios** solo se activa cuando algo ha cambiado.
- Las **acciones destructivas** piden confirmación; para eliminar un inquilino tienes que escribir su
  slug.
- Los **secretos** (claves de API, tokens de invitación) se muestran una sola vez. Un diálogo con un
  secreto no se puede cerrar con Escape ni haciendo clic fuera; primero confirma que has guardado el
  secreto.

## Ayuda en Studio {#help-center}

El **Centro de ayuda** contiene todos los artículos, tutoriales y páginas de referencia. Ábrelo desde
la barra lateral (**Centro de ayuda**), con el botón de ayuda (?) de la barra superior (**Ayuda y
documentación**) o desde el enlace de las páginas de inicio de sesión y de configuración; funciona
sin iniciar sesión.

- **Buscar**: escribe en el cuadro de búsqueda («Buscar en la ayuda, por ejemplo “clave de API”»).
  Studio busca en todos los artículos de tu idioma y cada resultado abre la sección correspondiente.
- **Empieza aquí**: los artículos para usuarios nuevos.
- Los **artículos** tienen un índice (**En esta página**), **Anterior** y **Siguiente**, **Temas
  relacionados** y un botón para copiar un enlace al artículo. Los enlaces funcionan en todos los
  idiomas, y al cambiar de idioma el artículo sigue abierto.

### Ayuda en cada pantalla {#contextual-help}

- **Ayuda de la página**: el botón (?) junto al título de una página (**Ayuda sobre esta página**)
  abre el artículo de esa página en un panel lateral. No pierdes tu sitio, y un formulario que estés
  rellenando se queda tal como está. Los enlaces dentro del panel abren otros artículos (**Atrás**
  vuelve), **Abrir en el centro de ayuda** muestra el artículo completo y **Cerrar ayuda** cierra el
  panel.
- **Sugerencias informativas**: el botón (i) junto a un campo, una columna o un estado explica
  efectos, valores predeterminados y límites. Se abre con un clic, un toque, Intro o Espacio y se
  cierra con Escape. **Más información** en la sugerencia abre el artículo relacionado en el panel
  lateral.
- Los enlaces **Más información** de mensajes, páginas vacías y diálogos de confirmación llevan a la
  sección que explica la situación.

## Conceptos básicos del teclado {#keyboard}

Todo en Studio funciona con el teclado:

| Tecla                       | Efecto                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Tab / Mayús+Tab             | Control siguiente / anterior. El foco siempre es visible.                                                    |
| Tab justo después de cargar | Llega a **Saltar al contenido principal**; Intro salta la navegación.                                        |
| Intro / Espacio             | Activa botones, enlaces, casillas de verificación, interruptores y sugerencias informativas.                 |
| Teclas de flecha            | Se mueven por menús, listas y entre pestañas.                                                                |
| Escape                      | Cierra un menú, un diálogo, una sugerencia informativa o la navegación móvil (no los diálogos con secretos). |
| F8                          | Salta al área de notificaciones (mensajes breves).                                                           |

Cuando abres otra página, el foco se mueve a su título, para que los lectores de pantalla anuncien la
página nueva. Más información en [teclado y accesibilidad](help:keyboard-accessibility).

## Solución de problemas {#troubleshooting}

| Situación                                                               | Causa y solución                                                                                                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La barra lateral muestra solo unas pocas entradas                       | No hay ningún producto seleccionado. Elige uno con el selector de producto o en **Productos**.                                                          |
| Una entrada muestra **Inactivo**                                        | El módulo del servidor no está habilitado. Pregunta al operador; consulta los [módulos](help:concepts#modules).                                         |
| Una página indica **No permitido**                                      | Tus roles no incluyen el permiso. Consulta [roles y permisos](help:roles-permissions).                                                                  |
| **Aún no disponible en Studio**                                         | El servidor tiene el módulo, pero esta versión de Studio no tiene pantallas para él. Usa la API o una versión más reciente de Studio.                   |
| El selector de producto no muestra un producto                          | El producto está archivado o no tienes ningún rol en él. Abre **Productos**.                                                                            |
| El idioma o el tema difieren entre navegadores                          | Una elección hecha en un navegador se recuerda allí y prevalece sobre la guardada en tu cuenta. Vuelve a elegir en el menú de usuario de ese navegador. |
| Studio se comporta de forma extraña tras una actualización del servidor | Recarga la página; Studio solo comprueba la versión del servidor al cargarse.                                                                           |

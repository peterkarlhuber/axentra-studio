---
title: Teclado y accesibilidad
summary: Cómo usar Studio con el teclado, un lector de pantalla, zoom, movimiento reducido y tema claro u oscuro, y qué carencias se conocen.
keywords: accesibilidad, a11y, teclado, atajos, tabulador, foco, lector de pantalla, NVDA, JAWS, VoiceOver, zoom, ampliación, contraste, modo oscuro, modo claro, tema, movimiento reducido, WCAG
---

Studio está diseñado para cumplir el nivel AA de WCAG 2.1. Todas las funciones se pueden usar con el
teclado, los lectores de pantalla anuncian correctamente la estructura de la página y Studio sigue
la configuración de tu sistema para el esquema de color y el movimiento. Cada versión se comprueba
automáticamente con el motor de accesibilidad axe-core en todas las páginas, con el tema claro y el
oscuro, en una pantalla de escritorio y en una pantalla de teléfono de 360 píxeles de ancho.

## Uso del teclado {#keyboard}

| Tecla                                      | Qué hace                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Tab** / **Mayús+Tab**                    | Pasa al control siguiente o al anterior.                                                   |
| **Tab** justo después de cargar una página | Llega primero a **Saltar al contenido principal**; **Intro** salta la navegación.          |
| **Intro**                                  | Sigue un enlace, pulsa un botón, envía un formulario.                                      |
| **Espacio**                                | Pulsa un botón, marca una casilla, cambia un interruptor.                                  |
| **Teclas de flecha**                       | Se mueven dentro de menús, listas de selección y pestañas; **Intro** o **Espacio** eligen. |
| **Esc**                                    | Cierra un diálogo, un panel lateral, un menú, una ayuda contextual o la navegación móvil.  |
| **F8**                                     | Salta al área de notificaciones (los mensajes en una esquina de la pantalla).              |
| **Intro** en un campo **Tipos de evento**  | Añade a la lista el tipo de evento escrito.                                                |

Conviene saber:

- **Los diálogos mantienen el foco dentro** mientras están abiertos y lo devuelven al botón que
  los abrió cuando se cierran.
- **Los diálogos de secretos de un solo uso no se cierran con Esc.** Los secretos de las claves de
  API y de los webhooks se muestran solo una vez, así que el diálogo sigue abierto hasta que
  confirmes **He guardado el secreto de forma segura**. Así no pierdes un secreto por accidente.
- **Las acciones peligrosas** piden confirmación; algunas, como revocar una clave de API, también te
  piden escribir un nombre (**Escribe … para confirmar**). Esto protege contra pulsaciones de teclas
  accidentales.
- **Las ayudas contextuales** (los pequeños botones (i) junto a las etiquetas) se abren con
  **Intro** o **Espacio** y se cierran con **Esc**. Funcionan con teclado, pantalla táctil y
  lectores de pantalla, no solo al pasar el ratón.
- **Las tablas** con muchas columnas se desplazan dentro de su propia área etiquetada. Lleva el foco
  al área con **Tab** y desplázala con las teclas de flecha.

## Foco {#focus}

El control que tiene el foco del teclado muestra siempre un anillo visible (violeta, con un
contraste de al menos 3:1 respecto a su fondo). Al abrir otra página, Studio mueve el foco al título
principal de la página, de modo que empiezas en el contenido nuevo y los lectores de pantalla
anuncian la nueva página.

## Lectores de pantalla {#screen-readers}

- **Puntos de referencia:** cada página tiene una cabecera, la navegación principal y el contenido
  principal, y exactamente un título principal.
- **La ruta de navegación** y la **Navegación principal** están etiquetadas. Las áreas de la barra
  lateral de módulos desactivados se anuncian como «módulo no habilitado».
- **Formularios:** cada campo tiene una etiqueta visible; los campos obligatorios se anuncian; los
  mensajes de error están asociados a su campo.
- **Las tablas** tienen títulos y encabezados de columna, y las columnas ordenables anuncian su
  sentido de ordenación. El recuento «Mostrando N entradas» se anuncia cuando se cargan más filas.
- **Los mensajes de estado** (copiado al portapapeles, cargando, notificaciones) se anuncian
  mediante regiones dinámicas. Las notificaciones de error se anuncian de inmediato.
- **Los gráficos** tienen un resumen en texto, y **Mostrar tabla de datos** presenta los mismos
  valores en forma de tabla.
- **Las vistas previas de correo** se muestran en un marco aislado; su texto se puede leer con
  normalidad.

## Zoom y tamaño del texto {#zoom}

Puedes ampliar el navegador al 200 % sin perder contenido ni funciones. En ventanas estrechas (y al
ampliar), el diseño se adapta:

| Ancho de la ventana | Diseño                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| 1200 px o más       | Barra lateral completa, páginas de varias columnas                                                  |
| De 960 a 1199 px    | Barra lateral completa o contraída                                                                  |
| Menos de 960 px     | La barra lateral se convierte en un panel desplegable que se abre con **Abrir navegación**          |
| Menos de 640 px     | Se ocultan las columnas de tabla menos importantes y las acciones de la página pasan bajo el título |

Los botones estándar tienen al menos 36 píxeles de alto y los grandes, 44 píxeles; algunos botones
compactos de tablas y barras de herramientas son más pequeños. En escritorio puedes contraer la
barra lateral a iconos con **Contraer barra lateral**; Studio lo recuerda en cada navegador.

## Movimiento reducido {#reduced-motion}

Si tu sistema operativo pide a las aplicaciones que reduzcan el movimiento, Studio desactiva sus
animaciones y transiciones (por ejemplo, las de diálogos, menús e indicadores de carga).

## Tema claro, oscuro y del sistema {#themes}

Abre el menú de usuario (tu nombre en la barra superior) y elige **Tema**: **Claro**, **Oscuro** o
**Sistema** (sigue a tu sistema operativo). Ambos temas se comprueban para que tengan suficiente
contraste. Tu elección se guarda en el navegador y en tu perfil; un navegador en el que aún no
hayas elegido tema adopta el de tu perfil al iniciar sesión.

## Idioma {#language}

Elige el idioma en el menú de usuario, en **Idioma**, o en la página de inicio de sesión. Con la
sesión iniciada, la elección se guarda en tu perfil. Las fechas, horas y números siguen el idioma
seleccionado. Algunos textos vienen del servidor y siguen en inglés, por ejemplo las descripciones
de los roles y permisos integrados y el **Mensaje del servidor** en los detalles de los errores.

## Carencias conocidas {#known-gaps}

- **Las comprobaciones automáticas cubren la primera vista de cada página.** Los diálogos, menús,
  paneles laterales, notificaciones y errores de formulario abiertos solo se comprueban en algunas
  áreas.
- **Solo Chromium se prueba automáticamente.** Firefox y Safari (WebKit) no están cubiertos por las
  pruebas automatizadas.
- **El modo de alto contraste de Windows** (colores forzados) no se prueba específicamente.
- **Los gráficos están pensados para el puntero.** Al pasar el ratón se muestran los detalles de
  cada punto; los usuarios de teclado y de lectores de pantalla obtienen los mismos valores con
  **Mostrar tabla de datos**.
- **Los textos del servidor**, como las descripciones de permisos y los mensajes del servidor, solo
  están en inglés.

Si encuentras una barrera, comunícala a tu operador con la dirección de la página y los pasos que
te llevaron a ella.

## Solución de problemas {#troubleshooting}

| Situación                              | Qué hacer                                                                                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No se ve el anillo de foco             | Usa **Tab** (el anillo aparece con el foco del teclado, no con los clics del ratón). Comprueba que ninguna extensión del navegador sobrescriba los estilos de la página.                      |
| Un diálogo no se cierra con Esc        | Muestra un secreto de un solo uso. Cópialo y guárdalo, y después confirma **He guardado el secreto de forma segura**.                                                                         |
| Las animaciones siguen reproduciéndose | Activa «reducir movimiento» en la configuración de accesibilidad de tu sistema operativo y recarga Studio.                                                                                    |
| El tema vuelve a cambiar               | Puede que el almacenamiento del navegador esté bloqueado (por ejemplo, en modo privado), así que la elección no se recuerda localmente; Studio vuelve entonces al tema guardado en tu perfil. |
| El contenido se corta con mucho zoom   | Las tablas anchas se desplazan dentro de su propia área; lleva el foco a ella con **Tab** y usa las teclas de flecha.                                                                         |

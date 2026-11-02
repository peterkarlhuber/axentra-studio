---
title: ¿Qué son Axentra y Studio?
summary: Axentra es un backend para productos SaaS multiinquilino; Axentra Studio es la interfaz web opcional para administrarlo.
keywords: introducción, acerca de, qué es, plataforma, backend, SaaS, consola de administración, interfaz de administración, arquitectura, multiinquilino, multitenant, servidor
---

**Axentra** es una plataforma de backend para productos de software como servicio (SaaS). Ofrece
los componentes que casi toda aplicación multiinquilino necesita, para que no tengas que
desarrollarlos de nuevo en cada producto. **Axentra Studio** es la interfaz web en la que
administradores, operadores y personal de soporte gestionan un servidor Axentra: sus productos,
clientes, usuarios, roles, claves de API y datos.

## Qué hace Axentra {#what-is-axentra}

Axentra se encarga de la «fontanería» de un producto SaaS:

- **Cuentas e inicio de sesión**: usuarios, contraseñas, sesiones del navegador e inicio de sesión
  único (OpenID Connect).
- **Clientes (inquilinos)**: cada organización cliente de tu producto recibe su propio inquilino,
  con miembros e invitaciones. Los datos de distintos inquilinos están estrictamente separados,
  también a nivel de base de datos.
- **Control de acceso**: roles, permisos y claves de API para máquinas.
- **Datos**: registros (documentos JSON en colecciones) y archivos.
- **Trabajo en segundo plano**: tareas, programaciones, eventos y webhooks.
- **Funciones comerciales**: medición del uso, cuotas, planes y suscripciones.
- **Notificaciones**: plantillas de correo electrónico y envío.
- **Registro de auditoría**: quién hizo qué y cuándo, para cada cambio.

Axentra es un único paquete de Python con una base de datos PostgreSQL. Puede funcionar de dos
maneras:

- **Como servicio HTTP** (`axentra serve`): tu producto y otros clientes llaman a la API
  versionada bajo `/v1`.
- **Como biblioteca** integrada en tu propia aplicación Python: tu código llama a los mismos
  servicios dentro del mismo proceso.

Ambas maneras usan los mismos servicios, las mismas comprobaciones de permisos y el mismo registro
de auditoría. Qué partes opcionales están activas lo decide el operador del servidor mediante los
[módulos](help:concepts#modules).

## Qué es Studio {#what-is-studio}

Studio es una aplicación web independiente que se ejecuta en tu navegador. **No tiene servidor
propio ni derechos especiales**: se comunica con el servidor Axentra únicamente a través de la misma
API HTTP pública que usa cualquier otro cliente. Lo que ves y puedes hacer en Studio lo decide el
servidor Axentra en función de tus [roles](help:roles-permissions).

De ello se derivan tres principios:

1. **Studio solo muestra datos reales.** Cada número y cada lista provienen del servidor. Si un
   módulo no está habilitado en el servidor, Studio lo indica en lugar de mostrar datos de relleno.
2. **El servidor decide, Studio explica.** Studio ofrece acciones según tus permisos. Si aun así el
   servidor rechaza algo, Studio explica el rechazo y muestra el ID de solicitud para el soporte.
3. **Las acciones irreversibles son deliberadas.** Eliminar, revocar y suspender piden
   confirmación, y los secretos, como las claves de API, se muestran exactamente una vez.

## Cómo se relacionan Axentra y Studio {#how-they-relate}

```diagram
architecture
```

- Tu **producto** (por ejemplo, un CRM o una tienda) usa Axentra a través de la API HTTP o como
  biblioteca. Sus usuarios finales nunca ven Studio.
- **Studio** es un cliente más de la misma API, para las personas que gestionan la plataforma.
- Las **máquinas** (el backend de tu producto, procesos de importación, integraciones) se
  autentican con [claves de API](help:api-keys).
- Axentra se comunica con el exterior mediante **webhooks** y **correo electrónico**, y de forma
  opcional inicia la sesión de los usuarios a través de un **proveedor de identidad** externo.

Studio es **opcional**. Todo lo que puede hacer Studio lo puede hacer cualquier cliente de la API
con los mismos permisos, y Axentra nunca depende de Studio. La seguridad nunca recae en la
interfaz: ocultar un botón en Studio es una comodidad; el servidor aplica cada regla.

> [!NOTE]
> Studio comprueba la versión de la API del servidor al cargarse. Si el servidor usa otra versión
> principal, o es más antiguo de lo que necesita este Studio, Studio se detiene con **Versión del
> servidor incompatible**. Consulta la [solución de problemas](help:troubleshooting).

## Quién usa Studio {#who-uses-studio}

| Quién                                                                         | Tareas habituales                                                                                                          |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Administradores de la plataforma                                              | Gestionan toda la instalación: crean productos, asignan roles de plataforma, revisan el estado del sistema y la auditoría. |
| Operadores de producto (propietario del producto, administrador del producto) | Gestionan un producto: inquilinos, roles, claves de API, planes, plantillas, webhooks.                                     |
| Personal de soporte                                                           | Consulta datos y responde a preguntas de clientes; gestiona miembros hasta el límite de sus propios permisos.              |
| Administradores de inquilinos                                                 | Gestionan los miembros y las invitaciones de su propia organización.                                                       |

No necesitas saber programar para usar Studio. Algunas áreas (registros, payloads de tareas,
configuración del producto) aceptan entradas en JSON; los ejemplos de los artículos bastan para
empezar.

## Escenarios habituales {#scenarios}

- **Un servidor nuevo entra en producción.** El operador genera un token de configuración; tú creas
  el primer administrador de la plataforma y luego el primer producto. Consulta la
  [configuración inicial](help:first-run-setup) y los [primeros pasos](help:first-steps).
- **Un nuevo cliente firma un contrato.** Creas un inquilino, invitas al administrador del cliente y
  creas una clave de API para su integración. Consulta
  [Incorporar una organización cliente](help:tutorial-onboard-customer).
- **Un cliente informa de un «acceso denegado».** Revisas el rol del miembro, los permisos de la
  clave de API y los eventos denegados en el [registro de auditoría](help:audit).
- **Una integración necesita eventos.** Registras un webhook y sigues sus entregas. Consulta
  [Crear un receptor de webhooks](help:tutorial-webhook-receiver).
- **Ventas lanza un nuevo plan de precios.** Defines medidores, planes y suscripciones. Consulta
  [Planes y uso](help:tutorial-plan-usage).

## Lo que Studio no hace {#what-studio-does-not-do}

- Studio no instala ni configura el servidor. La configuración del servidor (módulos, métodos de
  inicio de sesión, orígenes permitidos, el modo) reside en la configuración del servidor; Studio
  solo muestra los valores efectivos y no secretos en **Configuración**. Consulta la
  [configuración del servidor](help:server-configuration).
- Studio no crea cuentas de usuario directamente. Las cuentas provienen de la configuración
  inicial, del inicio de sesión único o del propio código de tu producto. Consulta
  [usuarios](help:users).
- Algunas funciones solo están disponibles a través de la API. Aparecen en las
  [limitaciones conocidas](help:limitations).

## Solución de problemas {#troubleshooting}

| Situación                                            | Qué hacer                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **No se puede conectar con Axentra** al abrir Studio | Studio no pudo cargar `GET /v1/meta`. Comprueba que el servidor Axentra está en marcha y que Studio está configurado con la dirección de API correcta. |
| **Versión del servidor incompatible**                | Usa una versión de Studio que corresponda a la versión de la API del servidor, o actualiza el servidor.                                                |
| Una entrada de la barra lateral muestra **Inactivo** | El módulo del servidor correspondiente no está habilitado. Pregunta al operador del servidor. Consulta los [módulos](help:concepts#modules).           |
| Falta una acción que esperabas                       | Probablemente te falta el permiso. Consulta [roles y permisos](help:roles-permissions).                                                                |

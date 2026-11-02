---
title: Configuración
summary: Elige tu idioma y tu tema, y consulta la configuración efectiva del servidor de Axentra.
keywords: configuración, ajustes, preferencias, idioma, tema, modo oscuro, modo claro, configuración del servidor, configuración efectiva, config, módulos, duración de la sesión, límites
---

La página **Configuración** tiene dos partes. **Preferencias** son tus propias opciones para Studio:
el idioma de la interfaz y el tema. **Configuración del servidor** muestra cómo está configurado el
servidor de Axentra en este momento, por ejemplo qué módulos están activados, cuánto duran las
sesiones y qué límites se aplican. En Studio, la configuración del servidor es de solo lectura: la
cambia el operador en el servidor.

Ábrela con **Configuración**, en la parte inferior de la barra lateral ([abrir](app:settings)).

## Cambiar el idioma y el tema {#preferences}

1. En **Preferencias**, elige un **Idioma**. La interfaz cambia de inmediato.
2. En **Tema**, elige **Claro**, **Oscuro** o **Sistema**. **Sistema** sigue el ajuste claro u
   oscuro de tu sistema operativo y cambia con él.

Las mismas opciones están en el menú de usuario, arriba a la derecha (**Idioma** y **Tema**).

| Ajuste     | Qué hace                                                                  | Valores                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Idioma** | Idioma de la interfaz de Studio y de los formatos de fecha, hora y número | English, Deutsch, Español, Français, Português (Brasil), Italiano. Si no eliges ninguno, Studio sigue el idioma de tu navegador y, si no, usa el inglés |
| **Tema**   | Colores de la interfaz                                                    | **Claro**, **Oscuro**, **Sistema** (predeterminado)                                                                                                     |

### Dónde se guardan las preferencias {#stored}

Tu elección se aplica al instante y se guarda dos veces: en este navegador, para que funcione
incluso antes de iniciar sesión, y en tu cuenta de usuario en el servidor, para que te acompañe a
otros navegadores. Cuando inicias sesión en un navegador que aún no tiene una elección propia,
Studio toma el idioma y el tema de tu cuenta. Una elección hecha en un navegador se mantiene en ese
navegador hasta que la cambies allí.

> [!NOTE]
> Algunos textos vienen del servidor y siguen en inglés sea cual sea el idioma que elijas: los
> nombres y las descripciones de los roles integrados, las descripciones del catálogo de permisos y
> el mensaje del servidor en los detalles técnicos de un error.

## Consultar la configuración del servidor {#server-configuration}

La tarjeta **Configuración del servidor** muestra la configuración efectiva y no secreta del
servidor (`GET /v1/settings`) en forma de árbol: grupos como `limits` o `storage` contienen sus
valores. Las listas se muestran separadas por comas. Úsala para responder a preguntas como «¿qué
módulos están activados?», «¿cuánto dura una sesión?» o «¿qué tamaño puede tener un archivo?» sin
preguntar al operador.

> [!IMPORTANT]
> La configuración del servidor se muestra con `platform:settings` (roles de plataforma
> `platform_admin` y `platform_viewer`) o con `product:manage` en al menos un producto
> (**Product owner**, **Product admin**). El resto de usuarios solo ve las
> preferencias.

### Qué significan los valores {#settings-tree}

| Clave                                                            | Significado                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `environment`                                                    | `development`, `test` o `production`. En producción se aplican comprobaciones de seguridad más estrictas al arrancar                                                                                                                                    |
| `mode`                                                           | `single` (un producto) o `multi` (varios productos); consulta [Modos de despliegue](help:server-configuration#deployment-modes)                                                                                                                         |
| `modules`                                                        | Módulos activados. Las secciones de Studio de otros módulos muestran **Módulo no habilitado en este servidor**                                                                                                                                          |
| `public_url`, `allowed_origins`                                  | La dirección externa del servidor y los orígenes de navegador (como el de Studio) que pueden enviar solicitudes con sesión iniciada                                                                                                                     |
| `trusted_proxies`                                                | Proxies cuya dirección de cliente reenviada acepta el servidor (afecta a la IP del registro de auditoría y a los límites de frecuencia)                                                                                                                 |
| `session_ttl_hours`, `session_idle_minutes`                      | Duración máxima de la sesión (12 horas por defecto) y tiempo de inactividad (120 minutos por defecto)                                                                                                                                                   |
| `password_login`, `password_min_length`, `login_rate_per_minute` | Si el inicio de sesión con contraseña está activado, la longitud mínima de la contraseña (12 por defecto) y el número de inicios de sesión fallidos permitidos por cuenta y minuto (10 por defecto)                                                     |
| `limits`                                                         | `max_body_bytes` (cuerpo de solicitud más grande, 10 MiB por defecto), `rate_limit_per_minute`, `rate_limit_ip_per_minute`, `rate_limit_burst` (vacío: sin límite de frecuencia) y `api_docs` (si `/v1/docs` es `public`, `authenticated` o `disabled`) |
| `oidc_providers`                                                 | Proveedores de inicio de sesión único con sus reglas de registro (nunca el secreto del cliente)                                                                                                                                                         |
| `storage`                                                        | Backend de almacenamiento de archivos, tamaño máximo de archivo y tipos de contenido permitidos                                                                                                                                                         |
| `notify`, `billing`                                              | Proveedor y remitente de notificaciones; proveedor de facturación y si los pagos reales están activados                                                                                                                                                 |
| `observability`                                                  | Nivel de registro, trazas y retención de auditoría y de tareas                                                                                                                                                                                          |
| `encryption_key_ids`, `active_encryption_key`                    | ID de las claves de cifrado que tiene el servidor y de la que se usa para los datos nuevos (nunca el material de la clave)                                                                                                                              |
| `features`                                                       | Feature flags libres de la instalación                                                                                                                                                                                                                  |

Los secretos (contraseñas de base de datos, claves de cifrado, secretos de cliente, claves de API
de proveedores) nunca forman parte de esta respuesta.

### Cambiar la configuración del servidor {#change}

Studio no puede cambiar estos valores. El operador modifica el archivo de configuración o las
variables de entorno del servidor y lo reinicia; la próxima vez que abras esta página verás los
valores nuevos. Consulta [Configuración del servidor](help:server-configuration) para saber qué
suelen cambiar los operadores para Studio.

## Conviene saber {#good-to-know}

- La configuración específica de un producto (por ejemplo, su política de almacenamiento) no está
  aquí, sino en la página del propio producto.
- Después de que el operador active o desactive un módulo, recarga Studio: lee la lista de módulos
  una sola vez, al arrancar.

## Solución de problemas {#troubleshooting}

- **La configuración del servidor solo se muestra a los administradores de la plataforma y a los
  propietarios y administradores de productos.**: no tienes ni `platform:settings` ni
  `product:manage`. Tus preferencias siguen funcionando.
- **El servidor no devolvió ninguna configuración.**: el servidor respondió con una configuración
  vacía. Recarga la página; si sigue vacía, avisa al operador.
- Tu idioma o tu tema no te acompañan a otro navegador: ese navegador ya tiene una elección propia,
  y la del navegador prevalece. Cámbiala allí una vez.
- El idioma o el tema vuelven a cambiar al iniciar sesión: este navegador no tenía una elección
  propia, así que Studio tomó la de tu cuenta. Vuelve a elegir; a partir de entonces este navegador
  la conserva.

# Konys Pizza · Reservas

Aplicación móvil para consultar la disponibilidad de mesas, crear reservas y administrar la operación básica de Konys Pizza. Está construida con React Native y Expo, usa Expo Router para la navegación y Supabase para almacenar los datos.

## Diseño

El diseño de referencia en Figma está disponible aquí:

[Konys Pizza — Reservas (Figma)](https://www.figma.com/design/P0KuOts7KwG1w7lM8qGreX/Konys-Pizza-%E2%80%94-Reservas?node-id=0-1&t=yrHad5CiNTO5yFVA-1)

La interfaz implementa el tema claro y oscuro según la preferencia del sistema, con azul petróleo (`#0F2B3D`), naranja (`#F28C28`) y blanco. Los recursos de marca están en `assets/images/konys/`.

## Funcionalidades

### Cliente

- Consultar las mesas habilitadas y filtrar la disponibilidad por fecha.
- Ver las horas libres para cada mesa y reservar indicando nombre, contacto y número de personas.
- Revisar la disponibilidad de nuevo antes de guardar la reserva y mostrar una confirmación.
- Consultar la carta y filtrarla por pizzas, entradas, postres y bebidas.
- Actualizar la disponibilidad al volver a una pestaña, mediante cambios en tiempo real de Supabase cuando están habilitados y consultas periódicas de respaldo.

### Administración

- Acceso al panel mediante un PIN configurado para la interfaz.
- Crear, editar, habilitar, deshabilitar y eliminar mesas.
- Configurar los horarios de atención y la duración de los turnos.
- Consultar, completar y cancelar reservas con confirmación.
- Crear y editar platos, categorías, precios, descripciones, enlaces de imagen y visibilidad en la carta.

> El PIN es solo una barrera visual: está incluido en el cliente y no autentica al administrador ante Supabase. Las políticas RLS son las que controlan el acceso a los datos.

## Tecnologías

- React Native 0.86 y React 19.
- Expo SDK 57 y Expo Router.
- Supabase JS para base de datos y actualizaciones en tiempo real.
- AsyncStorage para persistir la sesión en plataformas nativas.
- TypeScript para configuración y utilidades compartidas; JavaScript para las pantallas.
- EAS Build para generar instaladores Android.

## Requisitos

- Node.js y npm.
- Una cuenta y un proyecto de Supabase.
- Expo Go para probar en un dispositivo, o EAS CLI y una cuenta de Expo para compilar el APK.

## Preparar el entorno local

Desde la carpeta del proyecto:

```powershell
npm install
Copy-Item .env.example .env.local
```

Completa `.env.local` con las credenciales públicas del proyecto Supabase:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave-publishable>
EXPO_PUBLIC_ADMIN_PIN=<pin-del-panel>
```

La app también acepta `EXPO_PUBLIC_SUPABASE_ANON_KEY` como nombre alternativo para la clave publishable. No pongas una clave `service_role` en la aplicación: cualquier variable `EXPO_PUBLIC_` puede quedar incorporada en el paquete y ser leída por sus usuarios. `.env.local` está excluido de Git.

## Base de datos Supabase

Si el proyecto Supabase todavía no tiene las tablas, ejecuta [`supabase/schema.sql`](supabase/schema.sql) desde el SQL Editor de Supabase. El script crea las tablas e índices necesarios, configura políticas RLS para la demo e inserta horarios iniciales sin borrar las tablas ni los datos existentes.

La aplicación utiliza estas tablas:

| Tabla | Uso | Campos principales |
| --- | --- | --- |
| `mesas` | Mesas disponibles para reservar | `id`, `nombre`, `zona`, `capacidad`, `activa`, `foto_url` |
| `horarios` | Días, jornadas y duración de turnos | `id`, `dia_semana`, `jornada`, `hora_inicio`, `hora_fin`, `duracion_slot`, `activo` |
| `reservas` | Reservas de clientes | `id`, `mesa_id`, `cliente_nombre`, `cliente_contacto`, `num_personas`, `fecha`, `hora_inicio`, `hora_fin`, `estado` |
| `platos` | Productos de la carta | `id`, `nombre`, `categoria`, `descripcion`, `precio`, `disponible`, `foto_url` |

El esquema actual crea políticas `prototype_anon` para que el prototipo pueda operar sin cuentas de usuario. Estas permiten operaciones públicas y no son adecuadas para producción con datos reales. Antes de publicar el servicio, protege el panel con autenticación y reemplaza esas políticas por reglas RLS que limiten cada operación al usuario autorizado.

## Ejecutar la aplicación

Inicia Expo en modo Expo Go:

```powershell
npx.cmd expo start --go
```

Abre Expo Go en el dispositivo y escanea el QR. Si la conexión local falla, verifica que el teléfono y el computador estén en la misma red. Para un dispositivo Android conectado por USB se puede usar el reenvío de puertos de ADB.

Comandos alternativos:

```powershell
npm run android
npm run web
npm run lint
```

## Compilar el APK con EAS

El perfil `preview` está configurado para generar un APK de distribución interna:

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview
```

El perfil `production` está pensado para una compilación de tienda; el perfil `preview` es el que actualmente genera el APK de distribución interna.

Los perfiles `development`, `preview` y `production` declaran las variables públicas de Supabase en `eas.json`, para que estén disponibles durante el empaquetado remoto. Si se cambia el proyecto Supabase, actualiza `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en los perfiles que se vayan a utilizar. El PIN de administrador no está definido en esos perfiles; configura `EXPO_PUBLIC_ADMIN_PIN` en el perfil de compilación si necesitas un PIN distinto al valor de respaldo `1234`.

El nombre visible de la aplicación es **Konys**. El slug de Expo y el identificador Android se encuentran en `app.json`. El ícono adaptativo de Android usa `assets/images/konys/konysLogo-app.png`.

## Estructura del proyecto

```text
.
├── assets/
│   └── images/
│       └── konys/                 # Logos e imágenes de marca
├── scripts/
│   └── reset-project.js           # Reinicio del template Expo
├── src/
│   ├── app/
│   │   ├── _layout.tsx            # Navegación raíz y barra de estado
│   │   ├── index.tsx              # Redirección a la pestaña Inicio
│   │   ├── confirmacion.js        # Comprobante de la reserva
│   │   ├── reservar/
│   │   │   └── [mesaId].js        # Selección de fecha, hora y datos
│   │   └── tabs/
│   │       ├── _layout.js         # Pestañas Inicio, Carta y Admin
│   │       ├── index.js            # Disponibilidad y selección de mesa
│   │       ├── carta.js            # Carta para clientes
│   │       └── admin.js            # Panel administrativo
│   ├── components/
│   │   ├── appFooter.js            # Crédito de diseño y desarrollo
│   │   └── MesaCard.js             # Tarjeta reutilizable de mesa
│   ├── constants/
│   │   ├── colors.ts               # Colores de la app
│   │   └── theme.ts                # Paletas y tema según el sistema
│   ├── hooks/                      # Hooks de tema heredados del template
│   ├── services/
│   │   └── supabase.js             # Cliente de Supabase
│   ├── utils/
│   │   └── reservas.js             # Fechas, horarios, turnos y moneda
│   └── global.css                  # Estilos globales para web
├── supabase/
│   └── schema.sql                  # Esquema, índices, RLS y horarios base
├── .env.example                   # Plantilla de variables locales
├── app.json                       # Configuración de Expo y Android
├── eas.json                       # Perfiles de compilación EAS
├── package.json                   # Dependencias y comandos npm
└── tsconfig.json                  # Configuración de TypeScript
```

## Rutas principales

| Ruta | Pantalla |
| --- | --- |
| `/tabs` | Inicio y disponibilidad de mesas |
| `/tabs/carta` | Carta digital |
| `/tabs/admin` | Administración |
| `/reservar/[mesaId]` | Reserva para una mesa seleccionada |
| `/confirmacion` | Confirmación de reserva |

## Recursos de marca

- `assets/images/konys/konysLugar.png`: imagen destacada en Inicio.
- `assets/images/konys/KKonys.png`: marca junto al nombre en Inicio.
- `assets/images/konys/konysLogo.jpg`: logo original.
- `assets/images/konys/konysLogo-app.png`: variante cuadrada para el ícono de la app Android.

## Licencia

Consulta [`LICENSE`](LICENSE) para los términos de uso del proyecto.

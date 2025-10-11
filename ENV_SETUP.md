# Configuración del Entorno de Desarrollo

Esta guía te ayudará a configurar las variables de entorno necesarias para el correcto funcionamiento de la aplicación Tiqly.

## Requisitos Previos

- Node.js (v14 o superior)
- npm o yarn
- Cuenta de Firebase
- Cuenta de Mapbox
- Cuenta de Mercado Pago

## Configuración de Variables de Entorno

1. **Crear el archivo .env.local**

   Ejecuta el siguiente comando para crear un archivo `.env.local` basado en el ejemplo:
   ```bash
   npm run env:setup
   ```

2. **Configurar las credenciales**

   Abre el archivo `.env.local` generado y actualiza los siguientes valores con tus credenciales:

   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=tu_api_key_de_firebase
   FIREBASE_AUTH_DOMAIN=tu_proyecto_id.firebaseapp.com
   FIREBASE_PROJECT_ID=tu_proyecto_id
   FIREBASE_STORAGE_BUCKET=tu_proyecto_id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
   FIREBASE_APP_ID=tu_app_id
   FIREBASE_MEASUREMENT_ID=tu_measurement_id

   # Mapbox
   MAPBOX_ACCESS_TOKEN=tu_token_de_acceso_de_mapbox

   # Mercado Pago
   MERCADOPAGO_PUBLIC_KEY=tu_public_key_de_mercado_pago

   # API
   API_URL=tu_url_de_la_api
   ```

3. **Verificar la configuración**

   Ejecuta el siguiente comando para verificar que todas las variables de entorno estén configuradas correctamente:
   ```bash
   npm run env:check
   ```

   Si hay algún error, el script te indicará qué variables necesitan ser actualizadas.

## Configuración Adicional

### Firebase

1. Crea un proyecto en la [consola de Firebase](https://console.firebase.google.com/)
2. Registra tu aplicación en Firebase y obtén las credenciales
3. Habilita los siguientes servicios en Firebase:
   - Authentication
   - Firestore
   - Storage
   - (Opcional) Analytics

### Mapbox

1. Crea una cuenta en [Mapbox](https://account.mapbox.com/)
2. Genera un token de acceso con los siguientes permisos:
   - `styles:read`
   - `styles:tiles`
   - `fonts:read`
   - `datasets:read`
   - `vision:read`
   - `geocoding`
   - `directions`
   - `map`

### Mercado Pago

1. Crea una cuenta de desarrollador en [Mercado Pago](https://www.mercadopago.com.ar/developers/)
2. Crea una aplicación para obtener las credenciales
3. Configura las URLs de retorno y notificación en la configuración de la aplicación

## Iniciar la Aplicación

Una vez configuradas todas las variables de entorno, puedes iniciar la aplicación con:

```bash
# Para Android
expo run:android

# Para iOS
expo run:ios

# Para desarrollo web
expo start --web
```

## Solución de Problemas

Si encuentras algún problema con las variables de entorno:

1. Verifica que el archivo `.env.local` exista y tenga los permisos correctos
2. Asegúrate de que todas las variables de entorno requeridas estén configuradas
3. Si usas Windows, verifica que las rutas de los archivos sean correctas
4. Si los cambios no se reflejan, intenta limpiar la caché de Metro:
   ```bash
   expo start -c
   ```

## Contribución

Si agregas nuevas variables de entorno al proyecto, asegúrate de actualizar los siguientes archivos:

1. `.env.example`
2. `scripts/check-env.js`
3. `scripts/load-env.js`
4. `app.json` (sección `extra`)
5. `babel.config.js` (sección `plugins`)

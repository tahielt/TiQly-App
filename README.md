# Tiqly App

Aplicación móvil para la gestión de eventos de música electrónica con funcionalidades sociales, mapas y pagos.

## 🚀 Características

- Autenticación de usuarios con roles
- Feed social con publicaciones y comentarios
- Mapa interactivo con eventos
- Sistema de pagos integrado
- Perfiles de usuario personalizables

## 🛠 Configuración inicial

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tuusuario/tiqly-app.git
   cd tiqly-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Copiar el archivo `.env.example` a `.env`
   - Rellenar las variables de entorno con tus credenciales

4. **Iniciar la aplicación**
   ```bash
   # Para desarrollo
   npm start
   
   # Plataformas específicas
   npm run android
   npm run ios
   npm run web
   ```

## 🔧 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Firebase
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id
FIREBASE_MEASUREMENT_ID=tu_measurement_id

# Mapbox
MAPBOX_ACCESS_TOKEN=tu_token_mapbox

# Stripe
STRIPE_PUBLISHABLE_KEY=tu_clave_publica_stripe

# API
API_URL=tu_url_api
```

## 📱 Estructura del proyecto

```
src/
├── components/     # Componentes reutilizables
├── config/        # Configuraciones (Firebase, Mapbox, etc.)
├── features/      # Características principales
│   ├── auth/      # Autenticación
│   ├── social/    # Funcionalidades sociales
│   ├── map/       # Mapa y ubicaciones
│   └── payments/  # Pagos y suscripciones
├── navigation/    # Navegación
├── screens/       # Pantallas de la aplicación
├── services/      # Servicios (API, Storage, etc.)
├── types/         # Tipos TypeScript
└── utils/         # Utilidades y helpers
```

## 📚 Documentación

- [Guía de contribución](CONTRIBUTING.md)
- [Código de conducta](CODE_OF_CONDUCT.md)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar el archivo .env
dotenv.config();

// Leer el archivo app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = require(appJsonPath);

// Actualizar la configuración de Expo
appJson.expo.extra = {
  ...appJson.expo.extra,
  firebaseApiKey: process.env.FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: process.env.FIREBASE_APP_ID,
  firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
  mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  apiUrl: process.env.API_URL
};

// Escribir el archivo app.json actualizado
fs.writeFileSync(
  appJsonPath,
  JSON.stringify(appJson, null, 2) + '\n',
  'utf8'
);

console.log('app.json actualizado con las variables de entorno.');

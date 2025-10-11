const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar el archivo .env
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('❌ Error: No se encontró el archivo .env.local');
  console.log('Por favor, crea un archivo .env.local basado en .env.example');
  process.exit(1);
}

// Lista de variables de entorno requeridas
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'MAPBOX_ACCESS_TOKEN',
  'MERCADOPAGO_PUBLIC_KEY',
  'API_URL'
];

// Verificar que todas las variables de entorno requeridas estén configuradas
let missingVars = [];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar] || process.env[envVar].startsWith('your_')) {
    missingVars.push(envVar);
  }
});

if (missingVars.length > 0) {
  console.error('❌ Error: Las siguientes variables de entorno no están configuradas o tienen valores por defecto:');
  missingVars.forEach(envVar => {
    console.error(`  - ${envVar}`);
  });
  console.log('\nPor favor, actualiza el archivo .env.local con los valores correctos.');
  process.exit(1);
}

console.log('✅ Todas las variables de entorno están configuradas correctamente.');
process.exit(0);

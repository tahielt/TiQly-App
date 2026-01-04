import Constants from 'expo-constants';

// Tipos para las variables de entorno
interface EnvVars {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID?: string;
  MAPBOX_ACCESS_TOKEN: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  API_URL: string;
}

// Obtener las variables de entorno
// SOLUCIÓN: Usamos 'Constants.manifest' como fallback para asegurar la compatibilidad 
// en diferentes versiones y entornos de Expo (EAS, Bare workflow, etc.).
export const env = (Constants.manifest || Constants.expoConfig)?.extra as EnvVars;

// Validar variables de entorno requeridas
const requiredVars: (keyof EnvVars)[] = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'MAPBOX_ACCESS_TOKEN',
  'API_URL',
];

// Verificar que todas las variables requeridas estén definidas
requiredVars.forEach((varName) => {
  if (!env || !env[varName]) {
    console.warn(`⚠️  La variable de entorno ${varName} no está definida o 'env' es nulo.`);
  }
});

export default env;

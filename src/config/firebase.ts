import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

// SOLUCIÓN: Usamos 'Constants.manifest' como fallback seguro 
// para obtener el objeto 'extra' que contiene las variables de entorno.
const config = (Constants.manifest || Constants.expoConfig)?.extra;

// Configuración de Firebase
// Nota: Accedemos a las variables directamente desde el objeto 'config'
const firebaseConfig = {
  // Asegúrate de que las claves 'firebaseApiKey', 'firebaseAuthDomain', etc.
  // coincidan con los nombres definidos en tu archivo 'app.json' o 'app.config.js' dentro de la sección 'extra'.
  apiKey: config?.firebaseApiKey,
  authDomain: config?.firebaseAuthDomain,
  projectId: config?.firebaseProjectId,
  storageBucket: config?.firebaseStorageBucket,
  messagingSenderId: config?.firebaseMessagingSenderId,
  appId: config?.firebaseAppId,
  measurementId: config?.firebaseMeasurementId
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const storage = getStorage(app);

// Tipos útiles para Firebase
export interface FirebaseError {
  code: string;
  message: string;
  name: string;
}

export const isFirebaseError = (error: unknown): error is FirebaseError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
};

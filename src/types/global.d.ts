// Tipos globales para el proyecto

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

// Variables de entorno
declare module '@env' {
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const FIREBASE_MEASUREMENT_ID: string;
  export const MAPBOX_ACCESS_TOKEN: string;
  export const STRIPE_PUBLISHABLE_KEY: string;
  export const API_URL: string;
}

// Extender tipos globales
declare global {
  namespace NodeJS {
    interface Global {
      // Aquí puedes agregar propiedades globales si es necesario
    }
  }
}

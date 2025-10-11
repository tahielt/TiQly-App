/// <reference types="expo-constants" />

type FirebaseConfig = {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  firebaseMeasurementId: string;
};

type AppConfig = {
  mapboxAccessToken: string;
  stripePublishableKey: string;
  apiUrl: string;
};

declare module 'expo-constants' {
  export interface AppManifest {
    extra?: FirebaseConfig & AppConfig;
  }
}

// Extend the NodeJS namespace for process.env
declare namespace NodeJS {
  interface ProcessEnv {
    FIREBASE_API_KEY: string;
    FIREBASE_AUTH_DOMAIN: string;
    FIREBASE_PROJECT_ID: string;
    FIREBASE_STORAGE_BUCKET: string;
    FIREBASE_MESSAGING_SENDER_ID: string;
    FIREBASE_APP_ID: string;
    FIREBASE_MEASUREMENT_ID: string;
    MAPBOX_ACCESS_TOKEN: string;
    STRIPE_PUBLISHABLE_KEY: string;
    API_URL: string;
  }
}

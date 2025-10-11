import '@testing-library/jest-native/extend-expect';
import { NativeModules } from 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native modules
NativeModules.RNCNetInfo = {
  getCurrentState: jest.fn(() => Promise.resolve()),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  app: jest.fn(() => ({})),
  apps: [],
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    onSnapshot: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/storage', () => ({
  storage: jest.fn(() => ({
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
  })),
}));

// Mock expo modules
jest.mock('expo-constants', () => ({
  manifest: {
    extra: {
      firebaseApiKey: 'test-api-key',
      firebaseAuthDomain: 'test.firebaseapp.com',
      firebaseProjectId: 'test-project',
      firebaseStorageBucket: 'test.appspot.com',
      firebaseMessagingSenderId: '123456789',
      firebaseAppId: '1:123456789:web:abcdef123456',
      firebaseMeasurementId: 'G-ABCDEF1234',
      mapboxAccessToken: 'test-mapbox-token',
      stripePublishableKey: 'test-stripe-key',
      apiUrl: 'https://api.test.com',
    },
  },
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = (props) => React.createElement('MapView', props, props.children);
  const MockMarker = (props) => React.createElement('Marker', props);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

// Mock react-native-geolocation-service
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn(),
  startObserving: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

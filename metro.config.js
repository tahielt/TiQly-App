// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Agrega una fuente de alias para el módulo de Expo para que Metro lo encuentre
config.resolver.extraNodeModules = {
  'expo': path.resolve(__dirname, 'node_modules/expo'),
};

// Agrega un alias para el módulo 'react-native'
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

// Asegúrate de que Metro pueda resolver archivos en la estructura de monorepo
config.watchFolders = [
  path.resolve(__dirname, 'node_modules'),
];

// Añade la capacidad de resolver archivos .js y .ts en la raíz del proyecto
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'ts'];

module.exports = config;

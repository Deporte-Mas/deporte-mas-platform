const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignorar validación de TypeScript
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
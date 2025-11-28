module.exports = {
  assets: ['./assets/fonts/'], // This is a common practice, but for vector icons, link the node_modules directory.
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
};
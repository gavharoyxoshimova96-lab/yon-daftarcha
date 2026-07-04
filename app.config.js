/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

// GitHub Pages: EXPO_BASE_URL=/yon-daftarcha
// Netlify / local: leave unset (deploys at domain root)
const baseUrl = process.env.EXPO_BASE_URL || '';

module.exports = {
  expo: {
    ...appJson.expo,
    experiments: {
      ...appJson.expo.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  },
};

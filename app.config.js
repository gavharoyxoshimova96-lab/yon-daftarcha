/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

// GitHub Pages: EXPO_BASE_URL=/yon-daftarcha
// Netlify / local: leave unset (deploys at domain root)
const baseUrl = process.env.EXPO_BASE_URL || '';

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      eas: {
        projectId: 'a584c407-ca47-4998-8812-616150f15b6d',
      },
    },
    experiments: {
      ...appJson.expo.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  },
};

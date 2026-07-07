import { AppRegistry } from 'react-native';

AppRegistry.registerHeadlessTask('ExpoSmsListenerBackground', () =>
  require('./services/smsHeadless').default
);

import 'expo-router/entry';

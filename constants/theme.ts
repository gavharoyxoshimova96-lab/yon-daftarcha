import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { palette } from './design';

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 16,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.emeraldMid,
    onPrimary: '#FFFFFF',
    primaryContainer: palette.incomeSoft,
    onPrimaryContainer: palette.emeraldDeep,
    secondary: '#1565C0',
    tertiary: palette.gold,
    income: palette.income,
    expense: palette.expense,
    background: '#EEF1F6',
    surface: '#FFFFFF',
    surfaceVariant: '#E4E9F0',
    outline: 'rgba(10, 10, 10, 0.1)',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 16,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#66BB6A',
    onPrimary: palette.ink,
    primaryContainer: '#1B3D22',
    onPrimaryContainer: '#C8E6C9',
    secondary: '#64B5F6',
    tertiary: palette.gold,
    income: '#81C784',
    expense: '#EF5350',
    background: '#0B0F14',
    surface: '#151B24',
    surfaceVariant: '#1F2733',
    outline: 'rgba(255, 255, 255, 0.1)',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#151B24',
      level2: '#1A2230',
      level3: '#1F2733',
    },
  },
};

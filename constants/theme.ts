import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const primaryGreen = '#2E7D32';
const secondaryBlue = '#1976D2';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: primaryGreen,
    secondary: secondaryBlue,
    tertiary: '#66BB6A',
    income: '#2E7D32',
    expense: '#C62828',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceVariant: '#E8EDF2',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#66BB6A',
    secondary: '#64B5F6',
    tertiary: '#81C784',
    income: '#81C784',
    expense: '#EF5350',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
  },
};

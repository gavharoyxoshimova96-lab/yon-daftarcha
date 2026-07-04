import { useTheme } from 'react-native-paper';

const INCOME = { light: '#2E7D32', dark: '#81C784' };
const EXPENSE = { light: '#C62828', dark: '#EF5350' };

export function useAppColors() {
  const theme = useTheme();
  const mode = theme.dark ? 'dark' : 'light';
  return {
    income: INCOME[mode],
    expense: EXPENSE[mode],
    primary: theme.colors.primary,
    surface: theme.colors.surface,
    background: theme.colors.background,
    onSurface: theme.colors.onSurface,
    onSurfaceVariant: theme.colors.onSurfaceVariant,
    error: theme.colors.error,
  };
}

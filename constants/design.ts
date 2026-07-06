import { Platform, ViewStyle } from 'react-native';

export const palette = {
  gold: '#D4AF37',
  goldSoft: '#F5E6B8',
  emerald: '#1B5E20',
  emeraldMid: '#2E7D32',
  emeraldDeep: '#0D2818',
  ink: '#0A0A0A',
  income: '#2E7D32',
  incomeSoft: '#E8F5E9',
  expense: '#C62828',
  expenseSoft: '#FFEBEE',
  ai: '#5C6BC0',
  aiSoft: '#E8EAF6',
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export function cardShadow(elevated = false): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: elevated
        ? '0 12px 32px rgba(10, 10, 10, 0.14)'
        : '0 4px 16px rgba(10, 10, 10, 0.08)',
    } as ViewStyle;
  }
  return {
    elevation: elevated ? 6 : 3,
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: elevated ? 8 : 4 },
    shadowOpacity: elevated ? 0.14 : 0.08,
    shadowRadius: elevated ? 16 : 10,
  };
}

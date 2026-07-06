import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

import { cardShadow, radii } from '@/constants/design';

interface SurfaceCardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  accentColor?: string;
}

export function SurfaceCard({ children, style, elevated = false, accentColor }: SurfaceCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        cardShadow(elevated),
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,10,0.05)',
        },
        accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
});

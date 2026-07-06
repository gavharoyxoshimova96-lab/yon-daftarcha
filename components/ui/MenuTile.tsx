import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { cardShadow, radii } from '@/constants/design';

interface MenuTileProps {
  title: string;
  description?: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  softColor: string;
  onPress: () => void;
}

export function MenuTile({ title, description, icon, color, softColor, onPress }: MenuTileProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        cardShadow(),
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,10,0.05)',
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: softColor }]}>
        <MaterialCommunityIcons name={icon} size={26} color={color} />
      </View>
      <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
        {title}
      </Text>
      {description ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
});

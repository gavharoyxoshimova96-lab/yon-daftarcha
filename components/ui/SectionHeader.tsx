import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { palette, radii } from '@/constants/design';

interface SectionHeaderProps {
  title: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  action?: React.ReactNode;
}

export function SectionHeader({ title, icon, action }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.accent, { backgroundColor: palette.gold }]} />
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={theme.colors.primary}
            style={styles.icon}
          />
        ) : null}
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accent: {
    width: 4,
    height: 22,
    borderRadius: radii.sm,
    marginRight: 10,
  },
  icon: {
    marginRight: 6,
  },
  title: {
    fontWeight: '700',
  },
});

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { palette, radii, cardShadow } from '@/constants/design';
import { useAppColors } from '@/hooks/useAppColors';
import { useLocale } from '@/context/LocaleContext';

const ACTIONS = [
  {
    key: 'income',
    icon: 'arrow-up-bold-circle' as const,
    route: '/transaction/income',
    labelKey: 'quickActions.income',
    colorKey: 'income' as const,
    softKey: 'incomeSoft' as const,
  },
  {
    key: 'expense',
    icon: 'arrow-down-bold-circle' as const,
    route: '/transaction/expense',
    labelKey: 'quickActions.expense',
    colorKey: 'expense' as const,
    softKey: 'expenseSoft' as const,
  },
  {
    key: 'debt',
    icon: 'hand-coin' as const,
    route: '/debt/add',
    labelKey: 'quickActions.debt',
    colorKey: 'gold' as const,
    softKey: 'goldSoft' as const,
  },
] as const;

export function QuickActions() {
  const theme = useTheme();
  const colors = useAppColors();
  const { t } = useLocale();

  const colorMap = {
    income: colors.income,
    expense: colors.expense,
    gold: palette.gold,
    incomeSoft: palette.incomeSoft,
    expenseSoft: palette.expenseSoft,
    goldSoft: theme.dark ? 'rgba(212,175,55,0.18)' : palette.goldSoft,
  };

  return (
    <View style={styles.container}>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.key}
          onPress={() => router.push(action.route)}
          style={({ pressed }) => [
            styles.tile,
            cardShadow(),
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,10,0.05)',
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colorMap[action.softKey] },
            ]}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={28}
              color={colorMap[action.colorKey]}
            />
          </View>
          <Text
            variant="labelLarge"
            style={[styles.label, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {t(action.labelKey)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

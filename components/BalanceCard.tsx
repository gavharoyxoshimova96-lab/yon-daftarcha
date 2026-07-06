import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { palette, radii, cardShadow } from '@/constants/design';
import { formatCurrency } from '@/utils/format';
import { useLocale } from '@/context/LocaleContext';

interface BalanceCardProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export function BalanceCard({ balance, monthlyIncome, monthlyExpense }: BalanceCardProps) {
  const { t } = useLocale();

  return (
    <LinearGradient
      colors={['#1B5E20', '#0F2418', palette.ink]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, cardShadow(true)]}
    >
      <View style={styles.decorLarge} />
      <View style={styles.decorSmall} />

      <View style={styles.badgeRow}>
        <MaterialCommunityIcons name="wallet-outline" size={18} color={palette.gold} />
        <Text variant="labelLarge" style={styles.label}>
          {t('dashboard.totalBalance')}
        </Text>
      </View>

      <Text variant="headlineLarge" style={styles.balance}>
        {formatCurrency(balance)}
      </Text>

      <View style={styles.row}>
        <View style={styles.stat}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="trending-up" size={16} color="#A5D6A7" />
            <Text variant="labelSmall" style={styles.statLabel}>
              {t('dashboard.monthlyIncome')}
            </Text>
          </View>
          <Text variant="titleMedium" style={styles.statValue}>
            +{formatCurrency(monthlyIncome)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="trending-down" size={16} color="#EF9A9A" />
            <Text variant="labelSmall" style={styles.statLabel}>
              {t('dashboard.monthlyExpense')}
            </Text>
          </View>
          <Text variant="titleMedium" style={styles.statValue}>
            -{formatCurrency(monthlyExpense)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    marginBottom: 18,
    padding: 20,
    overflow: 'hidden',
  },
  decorLarge: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    top: -50,
    right: -30,
  },
  decorSmall: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -20,
    left: -10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    color: palette.goldSoft,
    letterSpacing: 0.3,
  },
  balance: {
    color: '#fff',
    fontWeight: '800',
    marginBottom: 18,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.md,
    padding: 14,
  },
  stat: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.72)',
  },
  statValue: {
    color: '#fff',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 12,
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatCurrency } from '@/utils/format';
import { useLocale } from '@/context/LocaleContext';

interface BalanceCardProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export function BalanceCard({ balance, monthlyIncome, monthlyExpense }: BalanceCardProps) {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.primary }]} mode="elevated">
      <Card.Content>
        <Text variant="labelLarge" style={styles.label}>
          {t('dashboard.totalBalance')}
        </Text>
        <Text variant="headlineLarge" style={styles.balance}>
          {formatCurrency(balance)}
        </Text>
        <View style={styles.row}>
          <View style={styles.stat}>
            <Text variant="labelSmall" style={styles.statLabel}>
              {t('dashboard.monthlyIncome')}
            </Text>
            <Text variant="titleMedium" style={styles.statValue}>
              +{formatCurrency(monthlyIncome)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text variant="labelSmall" style={styles.statLabel}>
              {t('dashboard.monthlyExpense')}
            </Text>
            <Text variant="titleMedium" style={styles.statValue}>
              -{formatCurrency(monthlyExpense)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balance: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  statValue: {
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
});

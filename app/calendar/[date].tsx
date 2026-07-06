import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';

import { TransactionList } from '@/components/TransactionList';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { getTransactions } from '@/database';
import { useAppColors } from '@/hooks/useAppColors';
import { useTransactionActions } from '@/hooks/useTransactionActions';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format';
import { formatDisplayDate } from '@/utils/date';

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const theme = useTheme();
  const colors = useAppColors();
  const { t } = useLocale();
  const { refreshKey } = useDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = useCallback(async () => {
    if (date) {
      setTransactions(await getTransactions({ startDate: date, endDate: date }));
    }
  }, [date]);

  const { handleEdit, handleDelete } = useTransactionActions(loadData);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  const income = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text variant="titleLarge" style={styles.title}>
        {date ? formatDisplayDate(date) : ''}
      </Text>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium">{t('common.income')}</Text>
            <Text variant="titleMedium" style={{ color: colors.income, fontWeight: '700' }}>
              +{formatCurrency(income)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium">{t('common.expense')}</Text>
            <Text variant="titleMedium" style={{ color: colors.expense, fontWeight: '700' }}>
              -{formatCurrency(expense)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t('more.transactions')}
      </Text>
      <TransactionList
        transactions={transactions}
        onPress={(id) => router.push(`/transaction/${id}`)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
});

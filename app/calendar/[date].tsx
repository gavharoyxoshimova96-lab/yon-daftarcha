import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';

import { TransactionList } from '@/components/TransactionList';
import { useDatabase } from '@/context/DatabaseContext';
import { getTransactions } from '@/database';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format';
import { formatDisplayDate } from '@/utils/date';
import { useAppColors } from '@/hooks/useAppColors';

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const theme = useTheme();
  const colors = useAppColors();
  const { refreshKey } = useDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (date) {
        getTransactions({ startDate: date, endDate: date }).then(setTransactions);
      }
    }, [date, refreshKey])
  );

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

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
            <Text variant="labelMedium">Kirim</Text>
            <Text variant="titleMedium" style={{ color: colors.income, fontWeight: '700' }}>
              +{formatCurrency(income)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium">Chiqim</Text>
            <Text variant="titleMedium" style={{ color: colors.expense, fontWeight: '700' }}>
              -{formatCurrency(expense)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Operatsiyalar
      </Text>
      <TransactionList
        transactions={transactions}
        onPress={(id) => router.push(`/transaction/${id}`)}
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

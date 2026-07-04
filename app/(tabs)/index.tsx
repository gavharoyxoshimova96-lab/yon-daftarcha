import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useFocusEffect, router } from 'expo-router';

import { BalanceCard } from '@/components/BalanceCard';
import { QuickActions } from '@/components/QuickActions';
import { TransactionList } from '@/components/TransactionList';
import { useDatabase } from '@/context/DatabaseContext';
import { getMonthlyTotals, getRecentTransactions, getSavingsGoals } from '@/database';
import { getWelcomeMessage } from '@/services/aiAssistant';
import { SavingsGoal, Transaction } from '@/types';
import { formatCurrency } from '@/utils/format';
import { useLocale } from '@/context/LocaleContext';

export default function DashboardScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { refreshKey } = useDatabase();
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [aiTip, setAiTip] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const totals = await getMonthlyTotals();
    const recent = await getRecentTransactions(10);
    const goals = await getSavingsGoals();
    const tip = await getWelcomeMessage();
    setBalance(totals.balance);
    setIncome(totals.income);
    setExpense(totals.expense);
    setTransactions(recent);
    setSavingsGoals(goals.slice(0, 3));
    setAiTip(tip.split('\n\n')[1] ?? tip.split('\n\n')[0] ?? '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <BalanceCard balance={balance} monthlyIncome={income} monthlyExpense={expense} />
      <QuickActions />

      {aiTip ? (
        <Pressable onPress={() => router.push('/ai')}>
          <Card style={styles.aiCard} mode="elevated">
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.primary, marginBottom: 4 }}>
                🤖 {t('dashboard.aiTip')}
              </Text>
              <Text variant="bodyMedium" numberOfLines={2}>
                {aiTip}
              </Text>
            </Card.Content>
          </Card>
        </Pressable>
      ) : null}

      {savingsGoals.length > 0 && (
        <Pressable onPress={() => router.push('/savings')}>
          <Card style={styles.savingsCard} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('dashboard.savingsGoals')}
              </Text>
              {savingsGoals.map((goal) => {
                const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
                return (
                  <View key={goal.id} style={styles.savingsRow}>
                    <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                      {goal.name}
                    </Text>
                    <Text variant="labelMedium">{Math.round(progress * 100)}%</Text>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        </Pressable>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t('dashboard.recentTransactions')}
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
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  savingsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  aiCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
});

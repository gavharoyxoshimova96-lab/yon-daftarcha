import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';

import { BalanceCard } from '@/components/BalanceCard';
import { QuickActions } from '@/components/QuickActions';
import { TransactionList } from '@/components/TransactionList';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useDatabase } from '@/context/DatabaseContext';
import { getMonthlyTotals, getRecentTransactions, getSavingsGoals } from '@/database';
import { getWelcomeMessage } from '@/services/aiAssistant';
import { SavingsGoal, Transaction } from '@/types';
import { useTransactionActions } from '@/hooks/useTransactionActions';
import { useLocale } from '@/context/LocaleContext';
import { palette, radii } from '@/constants/design';

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

  const { handleEdit, handleDelete } = useTransactionActions(loadData);

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
      <View style={styles.hero}>
        <Text variant="headlineSmall" style={[styles.greeting, { color: theme.colors.onSurface }]}>
          {t('appName')}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('dashboard.subtitle')}
        </Text>
      </View>

      <BalanceCard balance={balance} monthlyIncome={income} monthlyExpense={expense} />
      <QuickActions />

      {aiTip ? (
        <Pressable onPress={() => router.push('/ai')}>
          <SurfaceCard elevated accentColor={palette.ai}>
            <View style={styles.aiContent}>
              <View style={[styles.aiIcon, { backgroundColor: palette.aiSoft }]}>
                <MaterialCommunityIcons name="robot-outline" size={22} color={palette.ai} />
              </View>
              <View style={styles.aiText}>
                <Text variant="labelLarge" style={{ color: palette.ai, fontWeight: '700' }}>
                  {t('dashboard.aiTip')}
                </Text>
                <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurface }}>
                  {aiTip}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
            </View>
          </SurfaceCard>
        </Pressable>
      ) : null}

      {savingsGoals.length > 0 && (
        <Pressable onPress={() => router.push('/savings')}>
          <SurfaceCard elevated accentColor={palette.gold}>
            <View style={styles.cardInner}>
              <SectionHeader title={t('dashboard.savingsGoals')} icon="piggy-bank-outline" />
              {savingsGoals.map((goal) => {
                const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
                return (
                  <View key={goal.id}>
                    <View style={styles.savingsRow}>
                      <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1, fontWeight: '600' }}>
                        {goal.name}
                      </Text>
                      <Text variant="labelMedium" style={{ color: palette.gold, fontWeight: '700' }}>
                        {Math.round(progress * 100)}%
                      </Text>
                    </View>
                    <ProgressBar
                      progress={Math.min(progress, 1)}
                      color={palette.gold}
                      style={styles.progress}
                    />
                  </View>
                );
              })}
            </View>
          </SurfaceCard>
        </Pressable>
      )}

      <SectionHeader title={t('dashboard.recentTransactions')} icon="history" />
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
  hero: {
    marginBottom: 16,
  },
  greeting: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  aiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: {
    flex: 1,
    gap: 4,
  },
  cardInner: {
    padding: 14,
    paddingTop: 4,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  progress: {
    height: 6,
    borderRadius: 3,
    marginBottom: 10,
  },
});

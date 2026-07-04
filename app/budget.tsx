import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  IconButton,
  ProgressBar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

import { useDatabase } from '@/context/DatabaseContext';
import { getCategories, getBudgetStatuses, setBudget, deleteBudget, getBudgets } from '@/database';
import { BudgetStatus, Category } from '@/types';
import { formatCurrency } from '@/utils/format';
import { addMonths, formatMonthYear } from '@/utils/date';
import { toMonthKey } from '@/utils/month';
import { useAppColors } from '@/hooks/useAppColors';

export default function BudgetScreen() {
  const theme = useTheme();
  const colors = useAppColors();
  const { refreshKey, refresh } = useDatabase();
  const [month, setMonth] = useState(() => new Date());
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<BudgetStatus[]>([]);
  const [limits, setLimits] = useState<Record<number, string>>({});

  const monthKey = toMonthKey(month);

  const loadData = useCallback(async () => {
    const cats = await getCategories('expense');
    setCategories(cats);
    const budgetStatuses = await getBudgetStatuses(monthKey);
    setStatuses(budgetStatuses);
    const budgets = await getBudgets(monthKey);
    const map: Record<number, string> = {};
    for (const b of budgets) {
      map[b.category_id] = String(b.limit_amount);
    }
    setLimits(map);
  }, [monthKey]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveLimit = async (categoryId: number) => {
    const parsed = parseFloat((limits[categoryId] ?? '').replace(/[^\d.]/g, ''));
    if (!parsed || parsed <= 0) {
      await deleteBudgetByCategory(categoryId);
      return;
    }
    await setBudget(categoryId, monthKey, parsed);
    refresh();
    loadData();
  };

  const deleteBudgetByCategory = async (categoryId: number) => {
    const budgets = await getBudgets(monthKey);
    const budget = budgets.find((b) => b.category_id === categoryId);
    if (budget) {
      await deleteBudget(budget.id);
      refresh();
      loadData();
    }
  };

  const statusMap = Object.fromEntries(statuses.map((s) => [s.categoryId, s]));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.monthNav}>
        <IconButton icon="chevron-left" onPress={() => setMonth((m) => addMonths(m, -1))} />
        <Text variant="titleLarge" style={styles.monthTitle}>
          {formatMonthYear(month)}
        </Text>
        <IconButton icon="chevron-right" onPress={() => setMonth((m) => addMonths(m, 1))} />
      </View>

      <Text variant="bodyMedium" style={styles.hint}>
        Har bir chiqim kategoriyasi uchun oylik limit belgilang
      </Text>

      {categories.map((cat) => {
        const status = statusMap[cat.id];
        const limit = parseFloat((limits[cat.id] ?? '').replace(/[^\d.]/g, '')) || 0;
        const spent = status?.spent ?? 0;
        const progress = limit > 0 ? spent / limit : 0;
        const exceeded = limit > 0 && spent > limit;

        return (
          <Card key={cat.id} style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.catName}>
                {cat.name}
              </Text>
              {limit > 0 && (
                <>
                  <Text variant="bodySmall" style={{ marginBottom: 4 }}>
                    Sarflangan: {formatCurrency(spent)} / {formatCurrency(limit)}
                  </Text>
                  <ProgressBar
                    progress={Math.min(progress, 1)}
                    color={exceeded ? colors.expense : theme.colors.primary}
                  />
                </>
              )}
              <View style={styles.limitRow}>
                <TextInput
                  label="Limit (so'm)"
                  value={limits[cat.id] ?? ''}
                  onChangeText={(v) => setLimits((prev) => ({ ...prev, [cat.id]: v }))}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.limitInput}
                  dense
                />
                <Button mode="contained-tonal" onPress={() => handleSaveLimit(cat.id)} compact>
                  Saqlash
                </Button>
              </View>
              {exceeded && (
                <Text variant="labelSmall" style={{ color: colors.expense, marginTop: 4 }}>
                  Limit oshdi!
                </Text>
              )}
            </Card.Content>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthTitle: { fontWeight: '700', flex: 1, textAlign: 'center' },
  hint: { opacity: 0.7, marginBottom: 16 },
  card: { marginBottom: 12, borderRadius: 12 },
  catName: { fontWeight: '600', marginBottom: 8 },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  limitInput: { flex: 1 },
});

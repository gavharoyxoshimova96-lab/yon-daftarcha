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
import { useLocale } from '@/context/LocaleContext';
import { getCategories, getBudgetStatuses, setBudget, deleteBudget, getBudgets } from '@/database';
import { BudgetStatus, Category } from '@/types';
import { formatCurrency } from '@/utils/format';
import { addMonths, formatMonthYear } from '@/utils/date';
import { toMonthKey } from '@/utils/month';
import { useAppColors } from '@/hooks/useAppColors';

export default function BudgetScreen() {
  const theme = useTheme();
  const colors = useAppColors();
  const { t } = useLocale();
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

  const handleClearLimit = (cat: Category) => {
    const currentLimit = parseFloat((limits[cat.id] ?? '').replace(/[^\d.]/g, '')) || 0;
    if (currentLimit <= 0) return;

    Alert.alert(t('common.delete'), `"${cat.name}" ${t('budget.clearLimitConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteBudgetByCategory(cat.id);
          setLimits((prev) => ({ ...prev, [cat.id]: '' }));
        },
      },
    ]);
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
        {t('budget.hint')}
      </Text>

      {categories.length === 0 ? (
        <Text variant="bodyLarge" style={styles.empty}>
          {t('budget.noCategories')}
        </Text>
      ) : null}

      {categories.map((cat) => {
        const status = statusMap[cat.id];
        const limit = parseFloat((limits[cat.id] ?? '').replace(/[^\d.]/g, '')) || 0;
        const spent = status?.spent ?? 0;
        const progress = limit > 0 ? spent / limit : 0;
        const exceeded = limit > 0 && spent > limit;

        return (
          <Card key={cat.id} style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.catName}>
                  {cat.name}
                </Text>
                {limit > 0 && (
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => handleClearLimit(cat)}
                    accessibilityLabel={t('common.delete')}
                  />
                )}
              </View>
              {limit > 0 && (
                <>
                  <Text variant="bodySmall" style={{ marginBottom: 4 }}>
                    {t('budget.spent')}: {formatCurrency(spent)} / {formatCurrency(limit)}
                  </Text>
                  <ProgressBar
                    progress={Math.min(progress, 1)}
                    color={exceeded ? colors.expense : theme.colors.primary}
                  />
                </>
              )}
              <View style={styles.limitRow}>
                <TextInput
                  label={t('budget.limitLabel')}
                  value={limits[cat.id] ?? ''}
                  onChangeText={(v) => setLimits((prev) => ({ ...prev, [cat.id]: v }))}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.limitInput}
                  dense
                />
                <Button mode="contained-tonal" onPress={() => handleSaveLimit(cat.id)} compact>
                  {t('common.save')}
                </Button>
              </View>
              {exceeded && (
                <Text variant="labelSmall" style={{ color: colors.expense, marginTop: 4 }}>
                  {t('budget.overBudget')}
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
  empty: { textAlign: 'center', padding: 32, opacity: 0.6 },
  card: { marginBottom: 12, borderRadius: 12 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catName: { fontWeight: '600', marginBottom: 8, flex: 1 },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  limitInput: { flex: 1 },
});

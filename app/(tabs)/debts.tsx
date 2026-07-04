import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  FAB,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';

import { useDatabase } from '@/context/DatabaseContext';
import { deleteDebt, getDebts, markDebtPaid } from '@/database';
import { Debt, DebtType } from '@/types';
import { formatCurrency } from '@/utils/format';
import { formatDisplayDate } from '@/utils/date';
import { useAppColors } from '@/hooks/useAppColors';
import { useLocale } from '@/context/LocaleContext';

export default function DebtsScreen() {
  const theme = useTheme();
  const colors = useAppColors();
  const { t } = useLocale();
  const { refreshKey, refresh } = useDatabase();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [filter, setFilter] = useState<'active' | 'paid' | 'all'>('active');
  const [typeFilter, setTypeFilter] = useState<'all' | DebtType>('all');

  const loadData = useCallback(async () => {
    let data: Debt[];
    if (filter === 'all') {
      data = await getDebts();
    } else {
      data = await getDebts(filter);
    }
    if (typeFilter !== 'all') {
      data = data.filter((d) => d.debt_type === typeFilter);
    }
    setDebts(data);
  }, [filter, typeFilter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  const handleMarkPaid = (debt: Debt) => {
    Alert.alert(t('debts.markPaid'), `${debt.person_name} — ${formatCurrency(debt.amount - debt.paid_amount)}`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('debts.pay'),
          onPress: async () => {
            await markDebtPaid(debt.id);
            refresh();
          },
        },
      ]
    );
  };

  const handleDelete = (debt: Debt) => {
    Alert.alert(t('common.delete'), t('common.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteDebt(debt.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedButtons
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
          buttons={[
            { value: 'active', label: t('debts.active') },
            { value: 'paid', label: t('debts.history') },
            { value: 'all', label: t('common.all') },
          ]}
          style={styles.filter}
        />
        <SegmentedButtons
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
          buttons={[
            { value: 'all', label: t('common.all') },
            { value: 'borrowed', label: t('debts.borrowed') },
            { value: 'lent', label: t('debts.lent') },
          ]}
          style={styles.filter}
        />

        {debts.length === 0 ? (
          <Text style={styles.empty}>{t('debts.noDebts')}</Text>
        ) : (
          debts.map((debt) => {
            const remaining = debt.amount - debt.paid_amount;
            const isBorrowed = debt.debt_type === 'borrowed';

            return (
              <Card key={debt.id} style={styles.card} mode="elevated">
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.personName}>
                      {debt.person_name}
                    </Text>
                    <Chip
                      compact
                      style={{
                        backgroundColor: isBorrowed
                          ? colors.expense + '20'
                          : colors.income + '20',
                      }}
                    >
                      {isBorrowed ? t('debts.borrowed') : t('debts.lent')}
                    </Chip>
                  </View>
                  <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
                    {formatCurrency(debt.amount)}
                  </Text>
                  {debt.paid_amount > 0 && debt.status === 'active' && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t('debts.remaining')}: {formatCurrency(remaining)}
                    </Text>
                  )}
                  <Text variant="bodySmall" style={styles.meta}>
                    {formatDisplayDate(debt.date)}
                    {debt.due_date ? ` · ${t('debts.dueDate')}: ${formatDisplayDate(debt.due_date)}` : ''}
                  </Text>
                  {debt.note ? (
                    <Text variant="bodySmall" style={styles.note}>
                      {debt.note}
                    </Text>
                  ) : null}
                </Card.Content>
                {debt.status === 'active' && (
                  <Card.Actions>
                    <Button onPress={() => router.push(`/debt/${debt.id}`)}>{t('common.edit')}</Button>
                    <Button onPress={() => handleMarkPaid(debt)}>{t('debts.paid')}</Button>
                    <Button textColor={theme.colors.error} onPress={() => handleDelete(debt)}>
                      {t('common.delete')}
                    </Button>
                  </Card.Actions>
                )}
                {debt.status === 'paid' && (
                  <Card.Actions>
                    <Chip icon="check" compact>
                      {t('debts.paid')}
                    </Chip>
                    <Button textColor={theme.colors.error} onPress={() => handleDelete(debt)}>
                      {t('common.delete')}
                    </Button>
                  </Card.Actions>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => router.push('/debt/add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  filter: {
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    opacity: 0.6,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  personName: {
    fontWeight: '600',
    flex: 1,
  },
  meta: {
    marginTop: 4,
    opacity: 0.6,
  },
  note: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

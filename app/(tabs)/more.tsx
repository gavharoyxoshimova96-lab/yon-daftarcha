import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { List, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';

import { TransactionList } from '@/components/TransactionList';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { deleteTransaction, getTransactions } from '@/database';
import { AppLocale } from '@/i18n';
import { Transaction, TransactionType } from '@/types';

export default function MoreScreen() {
  const theme = useTheme();
  const { refreshKey, refresh } = useDatabase();
  const { t, locale, setLocale } = useLocale();
  const [type, setType] = useState<TransactionType>('expense');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = useCallback(async () => {
    const data = await getTransactions({ type });
    setTransactions(data);
  }, [type]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  const handleDelete = (id: number) => {
    Alert.alert(t('common.delete'), t('more.deleteTransaction'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(id);
          refresh();
        },
      },
    ]);
  };

  const languageButtons = (['uz', 'ru', 'en'] as AppLocale[]).map((code) => ({
    value: code,
    label: t(`languages.${code}`),
  }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <List.Section>
        <List.Subheader>{t('more.tools')}</List.Subheader>
        <List.Item
          title={t('screens.categories')}
          description={t('more.categoriesDesc')}
          left={(props) => <List.Icon {...props} icon="tag-multiple" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/categories')}
        />
        <List.Item
          title={t('screens.search')}
          description={t('more.searchDesc')}
          left={(props) => <List.Icon {...props} icon="magnify" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/search')}
        />
        <List.Item
          title={t('screens.savings')}
          description={t('more.savingsDesc')}
          left={(props) => <List.Icon {...props} icon="piggy-bank" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/savings')}
        />
        <List.Item
          title={t('screens.budget')}
          description={t('more.budgetDesc')}
          left={(props) => <List.Icon {...props} icon="chart-timeline-variant" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/budget')}
        />
        <List.Item
          title={t('screens.backup')}
          description={t('more.backupDesc')}
          left={(props) => <List.Icon {...props} icon="cloud-upload" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/backup')}
        />
        <List.Item
          title={t('screens.security')}
          description={t('more.securityDesc')}
          left={(props) => <List.Icon {...props} icon="shield-lock" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/security')}
        />
        <List.Item
          title={t('screens.ai')}
          description={t('more.aiDesc')}
          left={(props) => <List.Icon {...props} icon="robot" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/ai')}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>{t('more.language')}</List.Subheader>
        <Text variant="bodySmall" style={styles.languageHint}>
          {t('more.languageDesc')}
        </Text>
        <SegmentedButtons
          value={locale}
          onValueChange={(v) => setLocale(v as AppLocale)}
          buttons={languageButtons}
          style={styles.languageButtons}
        />
      </List.Section>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t('more.transactions')}
      </Text>
      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as TransactionType)}
        buttons={[
          { value: 'income', label: t('more.incomes') },
          { value: 'expense', label: t('more.expenses') },
        ]}
        style={styles.segmented}
      />

      <TransactionList
        transactions={transactions}
        onEdit={(id) => router.push(`/transaction/${id}`)}
        onDelete={handleDelete}
        emptyMessage={type === 'income' ? t('more.noIncomes') : t('more.noExpenses')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '600',
  },
  segmented: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  languageHint: {
    paddingHorizontal: 16,
    marginBottom: 8,
    opacity: 0.7,
  },
  languageButtons: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
});

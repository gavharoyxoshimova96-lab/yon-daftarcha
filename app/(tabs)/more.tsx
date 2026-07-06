import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';

import { TransactionList } from '@/components/TransactionList';
import { MenuTile } from '@/components/ui/MenuTile';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { deleteTransaction, getTransactions } from '@/database';
import { AppLocale } from '@/i18n';
import { Transaction, TransactionType } from '@/types';
import { palette } from '@/constants/design';

const TOOL_ITEMS = [
  {
    titleKey: 'screens.categories',
    descKey: 'more.categoriesDesc',
    icon: 'tag-multiple' as const,
    route: '/categories',
    color: palette.emeraldMid,
    soft: palette.incomeSoft,
  },
  {
    titleKey: 'screens.search',
    descKey: 'more.searchDesc',
    icon: 'magnify' as const,
    route: '/search',
    color: '#1565C0',
    soft: '#E3F2FD',
  },
  {
    titleKey: 'screens.savings',
    descKey: 'more.savingsDesc',
    icon: 'piggy-bank' as const,
    route: '/savings',
    color: palette.gold,
    soft: palette.goldSoft,
  },
  {
    titleKey: 'screens.budget',
    descKey: 'more.budgetDesc',
    icon: 'chart-timeline-variant' as const,
    route: '/budget',
    color: '#6A1B9A',
    soft: '#F3E5F5',
  },
  {
    titleKey: 'screens.backup',
    descKey: 'more.backupDesc',
    icon: 'cloud-upload' as const,
    route: '/backup',
    color: '#00838F',
    soft: '#E0F7FA',
  },
  {
    titleKey: 'screens.security',
    descKey: 'more.securityDesc',
    icon: 'shield-lock' as const,
    route: '/security',
    color: '#37474F',
    soft: '#ECEFF1',
  },
  {
    titleKey: 'screens.ai',
    descKey: 'more.aiDesc',
    icon: 'robot' as const,
    route: '/ai',
    color: palette.ai,
    soft: palette.aiSoft,
  },
] as const;

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
      <SectionHeader title={t('more.tools')} icon="tools" />

      <View style={styles.grid}>
        {TOOL_ITEMS.map((item) => (
          <MenuTile
            key={item.route}
            title={t(item.titleKey)}
            description={t(item.descKey)}
            icon={item.icon}
            color={item.color}
            softColor={theme.dark ? item.color + '22' : item.soft}
            onPress={() => router.push(item.route)}
          />
        ))}
      </View>

      <SurfaceCard style={styles.languageCard}>
        <View style={styles.languageInner}>
          <SectionHeader title={t('more.language')} icon="translate" />
          <Text variant="bodySmall" style={[styles.languageHint, { color: theme.colors.onSurfaceVariant }]}>
            {t('more.languageDesc')}
          </Text>
          <SegmentedButtons
            value={locale}
            onValueChange={(v) => setLocale(v as AppLocale)}
            buttons={languageButtons}
          />
        </View>
      </SurfaceCard>

      <View style={styles.transactionsSection}>
        <SectionHeader title={t('more.transactions')} icon="swap-vertical" />
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
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  languageCard: {
    marginBottom: 16,
  },
  languageInner: {
    padding: 14,
    paddingTop: 4,
  },
  languageHint: {
    marginBottom: 12,
    opacity: 0.8,
  },
  transactionsSection: {
    marginTop: 4,
  },
  segmented: {
    marginBottom: 12,
  },
});

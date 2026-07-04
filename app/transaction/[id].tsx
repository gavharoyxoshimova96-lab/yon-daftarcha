import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';

import { TransactionForm } from '@/components/TransactionForm';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { getTransaction, updateTransaction } from '@/database';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { refresh } = useDatabase();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState<Awaited<ReturnType<typeof getTransaction>>>(null);

  useEffect(() => {
    if (id) {
      getTransaction(Number(id)).then((data) => {
        setTx(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!tx) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text variant="titleMedium" style={{ marginBottom: 16 }}>
          {t('transaction.notFound')}
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          {t('common.back')}
        </Button>
      </View>
    );
  }

  return (
    <TransactionForm
      type={tx.type}
      initialAmount={String(tx.amount)}
      initialCategoryId={tx.category_id}
      initialNote={tx.note}
      initialDate={tx.date}
      submitLabel={t('transaction.save')}
      onSubmit={async (data) => {
        await updateTransaction(tx.id, data.amount, data.categoryId, data.note, data.date);
        refresh();
        router.back();
      }}
    />
  );
}

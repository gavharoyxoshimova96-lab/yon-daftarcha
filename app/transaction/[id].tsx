import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';

import { TransactionForm } from '@/components/TransactionForm';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { deleteTransaction, getTransaction, updateTransaction } from '@/database';

export default function EditTransactionScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const txId = Number(rawId);

  const theme = useTheme();
  const { refresh } = useDatabase();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [tx, setTx] = useState<Awaited<ReturnType<typeof getTransaction>>>(null);

  useEffect(() => {
    if (!Number.isFinite(txId)) {
      setLoading(false);
      return;
    }
    getTransaction(txId).then((data) => {
      setTx(data);
      setLoading(false);
    });
  }, [txId]);

  const performDelete = async () => {
    if (!tx) return;
    setDeleting(true);
    try {
      await deleteTransaction(tx.id);
      setDeleteDialogVisible(false);
      refresh();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } finally {
      setDeleting(false);
    }
  };

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TransactionForm
        type={tx.type}
        initialAmount={String(tx.amount)}
        initialCategoryId={tx.category_id}
        initialNote={tx.note}
        initialDate={tx.date}
        submitLabel={t('transaction.save')}
        deleteLabel={t('common.delete')}
        onRequestDelete={() => setDeleteDialogVisible(true)}
        onSubmit={async (data) => {
          await updateTransaction(tx.id, data.amount, data.categoryId, data.note, data.date);
          refresh();
          router.back();
        }}
      />

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => !deleting && setDeleteDialogVisible(false)}
          dismissable={!deleting}
        >
          <Dialog.Title>{t('common.delete')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('more.deleteTransaction')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button textColor={theme.colors.error} onPress={performDelete} loading={deleting}>
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

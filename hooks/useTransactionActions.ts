import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { deleteTransaction } from '@/database';

export function useTransactionActions(onDeleted?: () => void) {
  const { refresh } = useDatabase();
  const { t } = useLocale();

  const handleEdit = (id: number) => {
    router.push(`/transaction/${id}`);
  };

  const handleDelete = (id: number) => {
    Alert.alert(t('common.delete'), t('more.deleteTransaction'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(id);
          refresh();
          onDeleted?.();
        },
      },
    ]);
  };

  return { handleEdit, handleDelete };
}

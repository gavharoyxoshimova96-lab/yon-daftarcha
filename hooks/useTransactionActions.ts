import { router } from 'expo-router';

import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { deleteTransaction } from '@/database';
import { confirmDialog } from '@/utils/dialog';

export function useTransactionActions(onDeleted?: () => void) {
  const { refresh } = useDatabase();
  const { t } = useLocale();

  const handleEdit = (id: number) => {
    router.push(`/transaction/${id}`);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirmDialog(t('common.delete'), t('more.deleteTransaction'), {
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;

    await deleteTransaction(id);
    refresh();
    onDeleted?.();
  };

  return { handleEdit, handleDelete };
}

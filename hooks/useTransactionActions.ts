import { router } from 'expo-router';

import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { useConfirm } from '@/context/ConfirmContext';
import { deleteTransaction } from '@/database';

export function useTransactionActions(onDeleted?: () => void) {
  const { refresh } = useDatabase();
  const { t } = useLocale();
  const confirm = useConfirm();

  const handleEdit = (id: number) => {
    router.push(`/transaction/${id}`);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm(t('common.delete'), t('more.deleteTransaction'), {
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

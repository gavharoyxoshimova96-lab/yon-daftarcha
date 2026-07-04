import React from 'react';
import { router } from 'expo-router';

import { TransactionForm } from '@/components/TransactionForm';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { createTransaction } from '@/database';

export default function AddExpenseScreen() {
  const { refresh } = useDatabase();
  const { t } = useLocale();

  return (
    <TransactionForm
      type="expense"
      submitLabel={t('transaction.addExpense')}
      onSubmit={async (data) => {
        await createTransaction('expense', data.amount, data.categoryId, data.note, data.date);
        refresh();
        router.back();
      }}
    />
  );
}

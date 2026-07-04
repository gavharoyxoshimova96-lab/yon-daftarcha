import React from 'react';
import { router } from 'expo-router';

import { TransactionForm } from '@/components/TransactionForm';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { createTransaction } from '@/database';

export default function AddIncomeScreen() {
  const { refresh } = useDatabase();
  const { t } = useLocale();

  return (
    <TransactionForm
      type="income"
      submitLabel={t('transaction.addIncome')}
      onSubmit={async (data) => {
        await createTransaction('income', data.amount, data.categoryId, data.note, data.date);
        refresh();
        router.back();
      }}
    />
  );
}

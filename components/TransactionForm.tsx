import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

import { CategoryPicker } from '@/components/CategoryPicker';
import { DatePickerInput } from '@/components/DatePickerInput';
import { useLocale } from '@/context/LocaleContext';
import { Category, TransactionType } from '@/types';
import { getCategories } from '@/database';
import { toDateString } from '@/utils/date';
import { useAppColors } from '@/hooks/useAppColors';

interface TransactionFormProps {
  type: TransactionType;
  initialAmount?: string;
  initialCategoryId?: number;
  initialNote?: string;
  initialDate?: string;
  submitLabel: string;
  onSubmit: (data: {
    amount: number;
    categoryId: number;
    note: string;
    date: string;
  }) => Promise<void>;
}

export function TransactionForm({
  type,
  initialAmount = '',
  initialCategoryId,
  initialNote = '',
  initialDate,
  submitLabel,
  onSubmit,
}: TransactionFormProps) {
  const theme = useTheme();
  const colors = useAppColors();
  const { t } = useLocale();
  const [amount, setAmount] = useState(initialAmount);
  const [note, setNote] = useState(initialNote);
  const [date, setDate] = useState(initialDate ?? toDateString());
  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategoryId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories(type).then((cats) => {
      setCategories(cats);
      if (!categoryId && cats.length > 0) {
        setCategoryId(cats[0].id);
      }
    });
  }, [type]);

  const handleSubmit = async () => {
    const parsed = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (!parsed || parsed <= 0) {
      setError(t('transaction.enterAmount'));
      return;
    }
    if (!categoryId) {
      setError(t('transaction.selectCategory'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit({ amount: parsed, categoryId, note, date });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput
        label={t('common.amount')}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon="currency-usd" />}
      />

      <DatePickerInput label={t('common.date')} value={date} onChange={setDate} style={styles.input} />

      <TextInput
        label={t('common.note')}
        value={note}
        onChangeText={setNote}
        mode="outlined"
        style={styles.input}
        multiline
        left={<TextInput.Icon icon="note-text" />}
      />

      <CategoryPicker
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      {error ? (
        <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{error}</Text>
      ) : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submit}
        buttonColor={type === 'income' ? colors.income : colors.expense}
      >
        {submitLabel}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 12,
  },
  submit: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 4,
  },
});

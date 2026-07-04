import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { router } from 'expo-router';

import { DatePickerInput } from '@/components/DatePickerInput';
import { useDatabase } from '@/context/DatabaseContext';
import { createDebt } from '@/database';
import { DebtType } from '@/types';
import { toDateString } from '@/utils/date';

export default function AddDebtScreen() {
  const theme = useTheme();
  const { refresh } = useDatabase();
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toDateString());
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('borrowed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const parsed = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (!personName.trim()) {
      setError('Ismni kiriting');
      return;
    }
    if (!parsed || parsed <= 0) {
      setError('Summani kiriting');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createDebt(personName, parsed, date, dueDate || null, note, debtType);
      refresh();
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: theme.colors.background }}
    >
      <SegmentedButtons
        value={debtType}
        onValueChange={(v) => setDebtType(v as DebtType)}
        buttons={[
          { value: 'borrowed', label: 'Pul oldim' },
          { value: 'lent', label: 'Pul berdim' },
        ]}
        style={styles.segmented}
      />

      <TextInput
        label="Shaxs ismi"
        value={personName}
        onChangeText={setPersonName}
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon="account" />}
      />

      <TextInput
        label="Summa (so'm)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon="currency-usd" />}
      />

      <DatePickerInput label="Sana" value={date} onChange={setDate} style={styles.input} />

      <DatePickerInput
        label="Muddat (ixtiyoriy)"
        value={dueDate}
        onChange={setDueDate}
        style={styles.input}
        clearable
      />

      <TextInput
        label="Izoh"
        value={note}
        onChangeText={setNote}
        mode="outlined"
        style={styles.input}
        multiline
        left={<TextInput.Icon icon="note-text" />}
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
      >
        Qarz qo'shish
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  segmented: {
    marginBottom: 16,
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

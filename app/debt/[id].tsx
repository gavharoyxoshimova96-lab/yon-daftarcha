import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';

import { DatePickerInput } from '@/components/DatePickerInput';
import { useDatabase } from '@/context/DatabaseContext';
import { addDebtPayment, getDebt, updateDebt } from '@/database';
import { Debt } from '@/types';
import { formatCurrency } from '@/utils/format';

export default function EditDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { refresh } = useDatabase();
  const [loading, setLoading] = useState(true);
  const [debt, setDebt] = useState<Debt | null>(null);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const loadDebt = useCallback(async () => {
    if (!id) return;
    const data = await getDebt(Number(id));
    if (data) {
      setDebt(data);
      setPersonName(data.person_name);
      setAmount(String(data.amount));
      setDate(data.date);
      setDueDate(data.due_date ?? '');
      setNote(data.note);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadDebt();
  }, [loadDebt]);

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (!personName.trim() || !parsed) {
      setError('Ism va summani to\'ldiring');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await updateDebt(Number(id), personName, parsed, date, dueDate || null, note);
      refresh();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!debt) return;
    const payment = parseFloat(paymentAmount.replace(/[^\d.]/g, ''));
    const remaining = debt.amount - debt.paid_amount;
    if (!payment || payment <= 0) {
      setError('To\'lov summasini kiriting');
      return;
    }
    if (payment > remaining) {
      setError(`Qolgan summa: ${formatCurrency(remaining)}`);
      return;
    }
    setError('');
    setPaying(true);
    try {
      await addDebtPayment(debt.id, payment);
      refresh();
      setPaymentAmount('');
      await loadDebt();
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!debt) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium" style={{ marginBottom: 16 }}>
          Qarz topilmadi
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Orqaga
        </Button>
      </View>
    );
  }

  const remaining = debt.amount - debt.paid_amount;
  const isPaid = debt.status === 'paid';

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: theme.colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.paymentSummary}>
        <Text variant="bodyMedium">
          To'langan: {formatCurrency(debt.paid_amount)} / {formatCurrency(debt.amount)}
        </Text>
        {!isPaid && (
          <Text variant="titleMedium" style={{ fontWeight: '700', marginTop: 4 }}>
            Qolgan: {formatCurrency(remaining)}
          </Text>
        )}
      </View>

      {!isPaid && (
        <View style={styles.paymentRow}>
          <TextInput
            label="To'lov summasi"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.paymentInput}
          />
          <Button
            mode="contained-tonal"
            onPress={handlePayment}
            loading={paying}
            disabled={paying}
            style={styles.paymentBtn}
          >
            To'lash
          </Button>
        </View>
      )}

      <TextInput
        label="Shaxs ismi"
        value={personName}
        onChangeText={setPersonName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Summa"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />
      <DatePickerInput label="Sana" value={date} onChange={setDate} style={styles.input} />
      <DatePickerInput
        label="Muddat"
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
      />

      {error ? (
        <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{error}</Text>
      ) : null}

      <Button mode="contained" onPress={handleSave} loading={saving} style={styles.submit}>
        Saqlash
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  paymentSummary: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  paymentInput: {
    flex: 1,
  },
  paymentBtn: {
    marginTop: 6,
  },
  input: {
    marginBottom: 12,
  },
  submit: {
    marginTop: 8,
    borderRadius: 12,
  },
});

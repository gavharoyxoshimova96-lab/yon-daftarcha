import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, ProgressBar, Text, TextInput, useTheme } from 'react-native-paper';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

import { useDatabase } from '@/context/DatabaseContext';
import { addSavingsContribution, getSavingsGoal } from '@/database';
import { SavingsGoal } from '@/types';
import { formatCurrency } from '@/utils/format';
import { formatDisplayDate } from '@/utils/date';

export default function SavingsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { refreshKey, refresh } = useDatabase();
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadGoal = useCallback(async () => {
    if (!id) return;
    setGoal(await getSavingsGoal(Number(id)));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadGoal();
    }, [loadGoal, refreshKey])
  );

  const handleContribute = async () => {
    if (!goal) return;
    const parsed = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (!parsed || parsed <= 0) {
      setError('Summani kiriting');
      return;
    }
    const remaining = goal.target_amount - goal.current_amount;
    if (parsed > remaining) {
      setError(`Qolgan: ${formatCurrency(remaining)}`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await addSavingsContribution(goal.id, parsed);
      refresh();
      setAmount('');
      await loadGoal();
    } finally {
      setLoading(false);
    }
  };

  if (!goal) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text>Yuklanmoqda...</Text>
      </View>
    );
  }

  const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card mode="elevated" style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {goal.name}
          </Text>
          {goal.deadline && (
            <Text variant="bodyMedium" style={styles.deadline}>
              Muddat: {formatDisplayDate(goal.deadline)}
            </Text>
          )}
          <Text variant="titleLarge" style={{ fontWeight: '700', marginVertical: 12 }}>
            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
          </Text>
          <ProgressBar progress={Math.min(progress, 1)} color={theme.colors.primary} />
          <Text variant="labelMedium" style={styles.percent}>
            {Math.round(progress * 100)}% · Qolgan: {formatCurrency(remaining)}
          </Text>
        </Card.Content>
      </Card>

      {remaining > 0 && (
        <>
          <TextInput
            label="Qo'shish summasi"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          {error ? <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{error}</Text> : null}
          <Button mode="contained" onPress={handleContribute} loading={loading} style={styles.btn}>
            Jamg'armaga qo'shish
          </Button>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 12, marginBottom: 20 },
  title: { fontWeight: '700' },
  deadline: { opacity: 0.7, marginTop: 4 },
  percent: { marginTop: 8 },
  input: { marginBottom: 12 },
  btn: { borderRadius: 12 },
});

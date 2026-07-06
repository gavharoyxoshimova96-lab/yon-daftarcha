import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  FAB,
  IconButton,
  Portal,
  ProgressBar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';

import { DatePickerInput } from '@/components/DatePickerInput';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import {
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
} from '@/database';
import { SavingsGoal } from '@/types';
import { formatCurrency } from '@/utils/format';
import { toDateString } from '@/utils/date';

export default function SavingsScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { refreshKey, refresh } = useDatabase();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');

  const loadData = useCallback(async () => {
    setGoals(await getSavingsGoals());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  const openCreate = () => {
    setEditId(null);
    setName('');
    setTarget('');
    setDeadline('');
    setDialogVisible(true);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditId(goal.id);
    setName(goal.name);
    setTarget(String(goal.target_amount));
    setDeadline(goal.deadline ?? '');
    setDialogVisible(true);
  };

  const handleSave = async () => {
    const parsed = parseFloat(target.replace(/[^\d.]/g, ''));
    if (!name.trim() || !parsed) return;
    if (editId) {
      await updateSavingsGoal(editId, name, parsed, deadline || null);
    } else {
      await createSavingsGoal(name, parsed, deadline || null, toDateString());
    }
    setDialogVisible(false);
    refresh();
    loadData();
  };

  const handleDelete = (goal: SavingsGoal) => {
    Alert.alert(t('common.delete'), t('savings.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSavingsGoal(goal.id);
          refresh();
          loadData();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {goals.length === 0 ? (
          <Text variant="bodyLarge" style={styles.empty}>
            {t('savings.noGoals')}
          </Text>
        ) : (
          goals.map((goal) => {
            const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
            return (
              <Card key={goal.id} style={styles.card} mode="elevated">
                <Card.Content>
                  <Text variant="titleMedium" style={styles.goalName}>
                    {goal.name}
                  </Text>
                  <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                    {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                  </Text>
                  <ProgressBar progress={Math.min(progress, 1)} color={theme.colors.primary} />
                  <Text variant="labelSmall" style={styles.percent}>
                    {Math.round(progress * 100)}% bajarildi
                  </Text>
                  <View style={styles.actions}>
                    <Button onPress={() => router.push(`/savings/${goal.id}`)}>{t('savings.details')}</Button>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => openEdit(goal)}
                      accessibilityLabel={t('common.edit')}
                    />
                    <IconButton
                      icon="delete-outline"
                      size={20}
                      iconColor={theme.colors.error}
                      onPress={() => handleDelete(goal)}
                      accessibilityLabel={t('common.delete')}
                    />
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={openCreate}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editId ? t('savings.editGoal') : t('savings.addGoal')}</Dialog.Title>
          <Dialog.Content>
            <TextInput label={t('savings.goalName')} value={name} onChangeText={setName} mode="outlined" style={styles.input} />
            <TextInput
              label={t('savings.targetAmount')}
              value={target}
              onChangeText={setTarget}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <DatePickerInput
              label={t('savings.deadline')}
              value={deadline}
              onChange={setDeadline}
              clearable
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>{t('common.cancel')}</Button>
            <Button onPress={handleSave}>{t('common.save')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  empty: { textAlign: 'center', padding: 32, opacity: 0.6 },
  card: { marginBottom: 12, borderRadius: 12 },
  goalName: { fontWeight: '600', marginBottom: 4 },
  percent: { textAlign: 'right', marginTop: 4, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  input: { marginBottom: 12 },
});

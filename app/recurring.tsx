import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Dialog,
  FAB,
  IconButton,
  Portal,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

import { CategoryPicker } from '@/components/CategoryPicker';
import { DatePickerInput } from '@/components/DatePickerInput';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  getCategories,
  getRecurringTransactions,
  updateRecurringTransaction,
} from '@/database';
import { Category, RecurringFrequency, RecurringTransaction, TransactionType } from '@/types';
import { formatCurrency } from '@/utils/format';
import { toDateString } from '@/utils/date';
import { RECURRING_FREQUENCIES } from '@/utils/recurring';
import { useAppColors } from '@/hooks/useAppColors';

export default function RecurringScreen() {
  const theme = useTheme();
  const colors = useAppColors();
  const { t } = useLocale();
  const { refreshKey, refresh } = useDatabase();
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(toDateString());
  const [nextRunDate, setNextRunDate] = useState(toDateString());
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadData = useCallback(async () => {
    setItems(await getRecurringTransactions());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  useEffect(() => {
    getCategories(type).then((cats) => {
      setCategories(cats);
      if (!categoryId && cats.length > 0) {
        setCategoryId(cats[0].id);
      }
    });
  }, [type]);

  const openCreate = () => {
    setEditId(null);
    setType('expense');
    setAmount('');
    setNote('');
    setFrequency('monthly');
    const today = toDateString();
    setStartDate(today);
    setNextRunDate(today);
    setEndDate('');
    setIsActive(true);
    setDialogVisible(true);
  };

  const openEdit = (item: RecurringTransaction) => {
    setEditId(item.id);
    setType(item.type);
    setAmount(String(item.amount));
    setNote(item.note);
    setCategoryId(item.category_id);
    setFrequency(item.frequency);
    setStartDate(item.start_date);
    setNextRunDate(item.next_run_date);
    setEndDate(item.end_date ?? '');
    setIsActive(item.is_active === 1);
    setDialogVisible(true);
  };

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (!parsed || !categoryId) return;

    if (editId) {
      await updateRecurringTransaction(
        editId,
        type,
        parsed,
        categoryId,
        note.trim(),
        frequency,
        nextRunDate,
        endDate || null,
        isActive
      );
    } else {
      await createRecurringTransaction(
        type,
        parsed,
        categoryId,
        note.trim(),
        frequency,
        startDate,
        endDate || null
      );
    }

    setDialogVisible(false);
    refresh();
    loadData();
  };

  const handleDelete = (item: RecurringTransaction) => {
    Alert.alert(t('common.delete'), t('recurring.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteRecurringTransaction(item.id);
          refresh();
          loadData();
        },
      },
    ]);
  };

  const frequencyLabel = (value: RecurringFrequency) =>
    t(`recurring.frequencyLabels.${value}`);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodyMedium" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
          {t('recurring.hint')}
        </Text>

        {items.length === 0 ? (
          <Text variant="bodyLarge" style={styles.empty}>
            {t('recurring.noItems')}
          </Text>
        ) : (
          items.map((item) => (
            <Card key={item.id} style={styles.card} mode="elevated">
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text variant="titleMedium">{item.category_name ?? '—'}</Text>
                  <Chip
                    compact
                    style={[
                      styles.statusChip,
                      { backgroundColor: item.is_active ? colors.income + '22' : theme.colors.surfaceVariant },
                    ]}
                  >
                    {item.is_active ? t('recurring.active') : t('recurring.inactive')}
                  </Chip>
                </View>
                <Text variant="bodyLarge" style={{ color: item.type === 'income' ? colors.income : colors.expense }}>
                  {item.type === 'income' ? '+' : '-'}
                  {formatCurrency(item.amount)}
                </Text>
                <Text variant="bodySmall" style={styles.meta}>
                  {frequencyLabel(item.frequency)} · {t('recurring.nextRun')}: {item.next_run_date}
                </Text>
                {item.note ? (
                  <Text variant="bodySmall" style={styles.meta}>
                    {item.note}
                  </Text>
                ) : null}
                <View style={styles.actions}>
                  <IconButton icon="pencil" onPress={() => openEdit(item)} />
                  <IconButton icon="delete" iconColor={theme.colors.error} onPress={() => handleDelete(item)} />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={openCreate} label={t('recurring.add')} />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editId ? t('recurring.edit') : t('recurring.add')}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <SegmentedButtons
                value={type}
                onValueChange={(v) => {
                  setType(v as TransactionType);
                  setCategoryId(undefined);
                }}
                buttons={[
                  { value: 'expense', label: t('common.expense') },
                  { value: 'income', label: t('common.income') },
                ]}
                style={styles.segmented}
              />
              <TextInput
                label={t('common.amount')}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
              <CategoryPicker
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
              />
              <Text variant="labelLarge" style={styles.fieldLabel}>
                {t('recurring.frequency')}
              </Text>
              <View style={styles.frequencyRow}>
                {RECURRING_FREQUENCIES.map((f) => (
                  <Chip
                    key={f}
                    selected={frequency === f}
                    onPress={() => setFrequency(f)}
                    style={styles.freqChip}
                  >
                    {frequencyLabel(f)}
                  </Chip>
                ))}
              </View>
              <TextInput
                label={t('common.note')}
                value={note}
                onChangeText={setNote}
                mode="outlined"
                style={styles.input}
              />
              {editId ? (
                <DatePickerInput label={t('recurring.nextRun')} value={nextRunDate} onChange={setNextRunDate} />
              ) : (
                <DatePickerInput label={t('recurring.startDate')} value={startDate} onChange={setStartDate} />
              )}
              <DatePickerInput
                label={`${t('recurring.endDate')} (${t('recurring.endDateOptional')})`}
                value={endDate}
                onChange={setEndDate}
              />
              {editId ? (
                <View style={styles.switchRow}>
                  <Text variant="bodyMedium">{t('recurring.active')}</Text>
                  <Switch value={isActive} onValueChange={setIsActive} />
                </View>
              ) : null}
            </ScrollView>
          </Dialog.ScrollArea>
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
  content: { padding: 16, paddingBottom: 88 },
  hint: { marginBottom: 16, opacity: 0.85 },
  empty: { textAlign: 'center', marginTop: 48, opacity: 0.6 },
  card: { marginBottom: 12, borderRadius: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statusChip: { height: 28 },
  meta: { opacity: 0.7, marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 16 },
  dialogScroll: { maxHeight: 420, paddingHorizontal: 0 },
  segmented: { marginBottom: 12 },
  input: { marginBottom: 12 },
  fieldLabel: { marginBottom: 8 },
  frequencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  freqChip: { marginBottom: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
});

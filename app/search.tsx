import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Menu, SegmentedButtons, TextInput, useTheme } from 'react-native-paper';

import { useFocusEffect, router } from 'expo-router';

import { DatePickerInput } from '@/components/DatePickerInput';
import { TransactionList } from '@/components/TransactionList';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { getCategories, getTransactions } from '@/database';
import { useTransactionActions } from '@/hooks/useTransactionActions';
import { Category, Transaction, TransactionType } from '@/types';

export default function SearchScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { refreshKey } = useDatabase();
  const [searchText, setSearchText] = useState('');
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Transaction[]>([]);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [searched, setSearched] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCategories().then(setCategories);
    }, [refreshKey])
  );

  const handleSearch = async () => {
    const data = await getTransactions({
      type: type === 'all' ? undefined : type,
      categoryId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      searchText: searchText || undefined,
    });
    setResults(data);
    setSearched(true);
  };

  const reloadResults = useCallback(async () => {
    if (!searched) return;
    const data = await getTransactions({
      type: type === 'all' ? undefined : type,
      categoryId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      searchText: searchText || undefined,
    });
    setResults(data);
  }, [searched, type, categoryId, startDate, endDate, searchText]);

  const { handleEdit, handleDelete } = useTransactionActions(reloadResults);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        label="Izoh bo'yicha qidirish"
        value={searchText}
        onChangeText={setSearchText}
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon="magnify" />}
      />

      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as typeof type)}
        buttons={[
          { value: 'all', label: 'Hammasi' },
          { value: 'income', label: 'Kirim' },
          { value: 'expense', label: 'Chiqim' },
        ]}
        style={styles.segmented}
      />

      <Menu
        visible={categoryMenuVisible}
        onDismiss={() => setCategoryMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setCategoryMenuVisible(true)}
            style={styles.input}
            icon="tag"
          >
            {selectedCategory ? selectedCategory.name : 'Kategoriya (barchasi)'}
          </Button>
        }
      >
        <Menu.Item
          onPress={() => {
            setCategoryId(undefined);
            setCategoryMenuVisible(false);
          }}
          title="Barchasi"
        />
        {categories.map((cat) => (
          <Menu.Item
            key={cat.id}
            onPress={() => {
              setCategoryId(cat.id);
              setCategoryMenuVisible(false);
            }}
            title={cat.name}
          />
        ))}
      </Menu>

      <View style={styles.dateRow}>
        <DatePickerInput
          label="Dan"
          value={startDate}
          onChange={setStartDate}
          style={styles.dateInput}
          clearable
        />
        <DatePickerInput
          label="Gacha"
          value={endDate}
          onChange={setEndDate}
          style={styles.dateInput}
          clearable
        />
      </View>

      <Button mode="contained" onPress={handleSearch} style={styles.searchBtn}>
        Qidirish
      </Button>

      {searched && (
        <TransactionList
          transactions={results}
          emptyMessage="Natija topilmadi"
          onPress={(id) => router.push(`/transaction/${id}`)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  input: {
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
  },
  searchBtn: {
    marginBottom: 16,
    borderRadius: 12,
  },
});

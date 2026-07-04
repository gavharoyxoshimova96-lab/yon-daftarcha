import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  FAB,
  List,
  Portal,
  SegmentedButtons,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

import { useDatabase } from '@/context/DatabaseContext';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryTransactionCount,
  updateCategory,
} from '@/database';
import { Category, CategoryType } from '@/types';

export default function CategoriesScreen() {
  const theme = useTheme();
  const { refreshKey, refresh } = useDatabase();
  const [type, setType] = useState<CategoryType>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');

  const loadData = useCallback(async () => {
    setCategories(await getCategories(type));
  }, [type]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  const openCreate = () => {
    setEditId(null);
    setName('');
    setDialogVisible(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setName(cat.name);
    setDialogVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editId) {
      await updateCategory(editId, name);
    } else {
      await createCategory(name, type);
    }
    setDialogVisible(false);
    refresh();
    loadData();
  };

  const handleDelete = async (cat: Category) => {
    const count = await getCategoryTransactionCount(cat.id);
    if (count > 0) {
      Alert.alert(
        'O\'chirib bo\'lmaydi',
        `"${cat.name}" kategoriyasida ${count} ta operatsiya bor. Avval ularni boshqa kategoriyaga o'tkazing yoki o'chiring.`
      );
      return;
    }
    Alert.alert('O\'chirish', `"${cat.name}" kategoriyasini o'chirmoqchimisiz?`, [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'O\'chirish',
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(cat.id);
          refresh();
          loadData();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedButtons
          value={type}
          onValueChange={(v) => setType(v as CategoryType)}
          buttons={[
            { value: 'expense', label: 'Chiqim' },
            { value: 'income', label: 'Kirim' },
          ]}
          style={styles.segmented}
        />

        {categories.map((cat) => (
          <List.Item
            key={cat.id}
            title={cat.name}
            right={() => (
              <View style={styles.actions}>
                <Button onPress={() => openEdit(cat)}>Tahrirlash</Button>
                <Button textColor={theme.colors.error} onPress={() => handleDelete(cat)}>
                  O'chirish
                </Button>
              </View>
            )}
          />
        ))}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={openCreate}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editId ? 'Tahrirlash' : 'Yangi kategoriya'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nomi"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Bekor</Button>
            <Button onPress={handleSave}>Saqlash</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 80,
  },
  segmented: {
    margin: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

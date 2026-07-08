import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  FAB,
  IconButton,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryTransactionCount,
  updateCategory,
} from '@/database';
import { Category, CategoryType } from '@/types';
import { radii } from '@/constants/design';
import { confirmDialog, showAlert } from '@/utils/dialog';

export default function CategoriesScreen() {
  const theme = useTheme();
  const { t } = useLocale();
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
      showAlert(t('categories.cannotDelete'), `"${cat.name}" ${t('categories.inUse', { count })}`);
      return;
    }

    const ok = await confirmDialog(
      t('common.delete'),
      `"${cat.name}" ${t('categories.confirmDelete')}`,
      {
        confirmText: t('common.delete'),
        cancelText: t('common.cancel'),
        destructive: true,
      }
    );
    if (!ok) return;

    await deleteCategory(cat.id);
    refresh();
    loadData();
  };

  const accent = type === 'income' ? theme.colors.primary : theme.colors.error;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedButtons
          value={type}
          onValueChange={(v) => setType(v as CategoryType)}
          buttons={[
            { value: 'expense', label: t('categories.expenses') },
            { value: 'income', label: t('categories.incomes') },
          ]}
          style={styles.segmented}
        />

        {categories.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: theme.colors.surfaceVariant, borderRadius: radii.md }]}>
            <MaterialCommunityIcons
              name="tag-outline"
              size={40}
              color={theme.colors.onSurfaceVariant}
              style={{ opacity: 0.5, marginBottom: 8 }}
            />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('common.noData')}
            </Text>
          </View>
        ) : (
          categories.map((cat) => (
            <SurfaceCard key={cat.id} accentColor={accent}>
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
                  <MaterialCommunityIcons name="tag" size={20} color={accent} />
                </View>
                <Text variant="titleSmall" style={[styles.catName, { color: theme.colors.onSurface }]}>
                  {cat.name}
                </Text>
                <View style={styles.actions}>
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    onPress={() => openEdit(cat)}
                    accessibilityLabel={t('common.edit')}
                  />
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => handleDelete(cat)}
                    accessibilityLabel={t('common.delete')}
                  />
                </View>
              </View>
            </SurfaceCard>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={openCreate}
        accessibilityLabel={t('categories.add')}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editId ? t('categories.edit') : t('categories.add')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('categories.name')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoFocus
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
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  segmented: {
    marginBottom: 16,
  },
  empty: {
    padding: 36,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    flex: 1,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    marginRight: -8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { Category } from '@/types';
import { useLocale } from '@/context/LocaleContext';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: number;
  onSelect: (id: number) => void;
}

export function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  const { t } = useLocale();
  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.title}>
        {t('common.category')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            selected={selectedId === cat.id}
            onPress={() => onSelect(cat.id)}
            style={styles.chip}
            showSelectedOverlay
          >
            {cat.name}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  scroll: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    marginRight: 0,
  },
});

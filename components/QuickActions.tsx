import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppColors } from '@/hooks/useAppColors';
import { useLocale } from '@/context/LocaleContext';

export function QuickActions() {
  const colors = useAppColors();
  const { t } = useLocale();

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        icon="plus"
        style={[styles.button, { backgroundColor: colors.income }]}
        onPress={() => router.push('/transaction/income')}
      >
        {t('quickActions.income')}
      </Button>
      <Button
        mode="contained"
        icon="minus"
        style={[styles.button, { backgroundColor: colors.expense }]}
        onPress={() => router.push('/transaction/expense')}
      >
        {t('quickActions.expense')}
      </Button>
      <Button
        mode="contained-tonal"
        icon="hand-coin"
        style={styles.button}
        onPress={() => router.push('/debt/add')}
      >
        {t('quickActions.debt')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    borderRadius: 12,
  },
});

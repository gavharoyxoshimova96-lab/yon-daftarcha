import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  List,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

import { CategoryPicker } from '@/components/CategoryPicker';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { getCategories } from '@/database';
import { Category, TransactionType } from '@/types';
import {
  importSmsText,
  isSmsImportEnabled,
  isSmsImportSupported,
  setDefaultSmsCategory,
  setSmsImportEnabled,
} from '@/services/smsImport';
import {
  checkSmsPermission,
  requestSmsPermission,
  startSmsListenerService,
  stopSmsListenerService,
} from '@/services/smsPlatform';

const EXAMPLE_SMS =
  "Xarid: 125 000.00 UZS; HUMOCARD *1234; BOZOR; 07.04.26 12:45";

export default function SmsImportScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { refresh } = useDatabase();
  const [enabled, setEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategoryId, setExpenseCategoryId] = useState<number | undefined>();
  const [incomeCategoryId, setIncomeCategoryId] = useState<number | undefined>();

  const loadSettings = useCallback(async () => {
    setEnabled(await isSmsImportEnabled());
    if (Platform.OS === 'android') {
      setPermissionGranted(await checkSmsPermission());
    }
    const expenses = await getCategories('expense');
    const incomes = await getCategories('income');
    setExpenseCategories(expenses);
    setIncomeCategories(incomes);
    if (!expenseCategoryId && expenses.length) setExpenseCategoryId(expenses[0].id);
    if (!incomeCategoryId && incomes.length) setIncomeCategoryId(incomes[0].id);
  }, [expenseCategoryId, incomeCategoryId]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = async (value: boolean) => {
    if (value && Platform.OS === 'android') {
      const granted = await requestSmsPermission();
      if (!granted) {
        Alert.alert(t('sms.permissionRequired'), t('sms.permissionRequiredDesc'));
        return;
      }
      setPermissionGranted(true);
      await startSmsListenerService();
    } else if (!value) {
      await stopSmsListenerService();
    }

    await setSmsImportEnabled(value);
    setEnabled(value);
  };

  const handleCategoryChange = async (type: TransactionType, id: number) => {
    if (type === 'expense') setExpenseCategoryId(id);
    else setIncomeCategoryId(id);
    await setDefaultSmsCategory(type, id);
  };

  const handleImportPaste = async () => {
    if (!pasteText.trim()) return;
    setLoading(true);
    try {
      const result = await importSmsText(pasteText.trim());
      if (result.imported > 0) {
        refresh();
        setPasteText('');
        Alert.alert(
          t('common.ready'),
          t('sms.importSuccess', { count: result.imported })
        );
      } else {
        Alert.alert(t('common.error'), t('sms.parseFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <SurfaceCard>
        <View style={styles.cardInner}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('sms.hint')}
          </Text>
        </View>
      </SurfaceCard>

      {isSmsImportSupported() ? (
        <List.Section>
          <List.Subheader>{t('sms.autoImport')}</List.Subheader>
          <List.Item
            title={t('sms.enableAuto')}
            description={
              permissionGranted ? t('sms.autoEnabledDesc') : t('sms.autoDisabledDesc')
            }
            left={(props) => <List.Icon {...props} icon="message-processing" />}
            right={() => <Switch value={enabled} onValueChange={handleToggle} />}
          />
          {!permissionGranted ? (
            <Button
              mode="outlined"
              onPress={async () => {
                const granted = await requestSmsPermission();
                setPermissionGranted(granted);
                if (!granted) {
                  Alert.alert(t('sms.permissionRequired'), t('sms.permissionRequiredDesc'));
                }
              }}
              style={styles.btn}
            >
              {t('sms.requestPermission')}
            </Button>
          ) : null}
        </List.Section>
      ) : (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall">{t('sms.androidOnly')}</Text>
            <Text variant="bodySmall" style={styles.meta}>
              {t('sms.androidOnlyDesc')}
            </Text>
          </Card.Content>
        </Card>
      )}

      <List.Section>
        <List.Subheader>{t('sms.categories')}</List.Subheader>
        <View style={styles.categoryBlock}>
          <Text variant="labelLarge" style={styles.categoryLabel}>
            {t('common.expense')}
          </Text>
          <CategoryPicker
            categories={expenseCategories}
            selectedId={expenseCategoryId}
            onSelect={(id) => handleCategoryChange('expense', id)}
          />
        </View>
        <View style={styles.categoryBlock}>
          <Text variant="labelLarge" style={styles.categoryLabel}>
            {t('common.income')}
          </Text>
          <CategoryPicker
            categories={incomeCategories}
            selectedId={incomeCategoryId}
            onSelect={(id) => handleCategoryChange('income', id)}
          />
        </View>
      </List.Section>

      <List.Section>
        <List.Subheader>{t('sms.manualImport')}</List.Subheader>
        <TextInput
          label={t('sms.pasteLabel')}
          value={pasteText}
          onChangeText={setPasteText}
          mode="outlined"
          multiline
          numberOfLines={5}
          style={styles.input}
          placeholder={EXAMPLE_SMS}
        />
        <Button
          mode="contained"
          onPress={handleImportPaste}
          loading={loading}
          disabled={!pasteText.trim()}
          style={styles.btn}
        >
          {t('sms.importBtn')}
        </Button>
        <Text variant="bodySmall" style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
          {t('sms.manualHint')}
        </Text>
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  cardInner: { padding: 14 },
  card: { marginBottom: 12, borderRadius: 16 },
  btn: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  input: { marginHorizontal: 16, marginBottom: 12 },
  meta: { marginHorizontal: 16, marginTop: 4, opacity: 0.8 },
  categoryBlock: { paddingHorizontal: 16, marginBottom: 12 },
  categoryLabel: { marginBottom: 8 },
});

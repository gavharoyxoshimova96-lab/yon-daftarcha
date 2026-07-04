import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

import { useDatabase } from '@/context/DatabaseContext';
import { useSecurity } from '@/context/SecurityContext';
import { shareBackupFile, pickAndImportBackup } from '@/utils/backupFile';

export default function BackupScreen() {
  const theme = useTheme();
  const { refresh } = useDatabase();
  const { refreshSecurity } = useSecurity();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await shareBackupFile();
    } catch {
      Alert.alert('Xatolik', 'Eksport amalga oshmadi');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    Alert.alert(
      'Diqqat',
      'Import barcha joriy ma\'lumotlarni almashtiradi. Davom etasizmi?',
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            try {
              await pickAndImportBackup();
              refresh();
              await refreshSecurity();
              Alert.alert('Tayyor', 'Ma\'lumotlar muvaffaqiyatli import qilindi');
            } catch (e) {
              if ((e as Error).message !== 'CANCELLED') {
                Alert.alert('Xatolik', 'Noto\'g\'ri yoki buzilgan fayl');
              }
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Eksport
          </Text>
          <Text variant="bodyMedium" style={styles.desc}>
            Barcha ma'lumotlarni JSON faylga saqlang: operatsiyalar, qarzlar, jamg'arma, byudjet va sozlamalar.
          </Text>
          <Button
            mode="contained"
            icon="export"
            onPress={handleExport}
            loading={exporting}
            style={styles.btn}
          >
            Zaxira nusxa olish
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Import
          </Text>
          <Text variant="bodyMedium" style={styles.desc}>
            Oldin saqlangan JSON fayldan ma'lumotlarni tiklang. Joriy ma'lumotlar to'liq almashtiriladi.
          </Text>
          <Button
            mode="outlined"
            icon="import"
            onPress={handleImport}
            loading={importing}
            style={styles.btn}
          >
            Fayldan import qilish
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 16, borderRadius: 12 },
  title: { fontWeight: '600', marginBottom: 8 },
  desc: { marginBottom: 16, opacity: 0.8 },
  btn: { borderRadius: 12 },
});

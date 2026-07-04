import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { BackupData } from '@/types';
import { exportBackup, importBackup } from '@/database';
import { refreshSecurityAfterImport } from '@/services/security';

function backupFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `yon-daftarcha-${date}.json`;
}

export async function shareBackupFile(): Promise<void> {
  const data = await exportBackup();
  const json = JSON.stringify(data, null, 2);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFilename();
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const path = `${FileSystem.cacheDirectory}${backupFilename()}`;
  await FileSystem.writeAsStringAsync(path, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/json' });
  }
}

export async function pickAndImportBackup(): Promise<void> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('NO_FILE'));
          return;
        }
        try {
          const text = await file.text();
          const data = JSON.parse(text) as BackupData;
          await importBackup(data);
          await refreshSecurityAfterImport();
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      input.click();
    });
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    throw new Error('CANCELLED');
  }

  const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const data = JSON.parse(json) as BackupData;
  await importBackup(data);
  await refreshSecurityAfterImport();
}

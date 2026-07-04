import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, List, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

import { useSecurity } from '@/context/SecurityContext';
import {
  hasPin,
  setPin,
  removePin,
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  areNotificationsEnabled,
} from '@/services/security';
import {
  enableNotifications,
  disableNotifications,
  scheduleDebtReminders,
} from '@/services/notifications';

export default function SecurityScreen() {
  const theme = useTheme();
  const { refreshSecurity } = useSecurity();
  const [pinExists, setPinExists] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setPinExists(await hasPin());
    setBiometricAvailable(await isBiometricAvailable());
    setBiometricOn(await isBiometricEnabled());
    setNotificationsOn(await areNotificationsEnabled());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleSetPin = async () => {
    if (!/^\d{4}$/.test(newPin)) {
      Alert.alert('Xatolik', 'PIN 4 ta raqamdan iborat bo\'lishi kerak');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Xatolik', 'PIN mos kelmadi');
      return;
    }
    setSaving(true);
    try {
      await setPin(newPin);
      setNewPin('');
      setConfirmPin('');
      await refreshSecurity();
      await loadSettings();
      Alert.alert('Tayyor', 'PIN o\'rnatildi');
    } catch {
      Alert.alert('Xatolik', 'PIN o\'rnatib bo\'lmadi');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePin = () => {
    Alert.alert('PIN o\'chirish', 'PIN o\'chirilsinmi?', [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'O\'chirish',
        style: 'destructive',
        onPress: async () => {
          await removePin();
          await refreshSecurity();
          await loadSettings();
        },
      },
    ]);
  };

  const toggleBiometric = async (value: boolean) => {
    if (value && !pinExists) {
      Alert.alert('Avval PIN o\'rnating');
      return;
    }
    await setBiometricEnabled(value);
    setBiometricOn(value);
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const ok = await enableNotifications();
      if (!ok) {
        Alert.alert('Ruxsat kerak', 'Bildirishnomalar uchun ruxsat bering');
        return;
      }
    } else {
      await disableNotifications();
    }
    setNotificationsOn(value);
    if (value) await scheduleDebtReminders();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <List.Section>
        <List.Subheader>PIN qulfi</List.Subheader>
        {pinExists ? (
          <>
            <List.Item
              title="PIN o'rnatilgan"
              description="Ilova fon rejimida qulflanadi"
              left={(props) => <List.Icon {...props} icon="lock" />}
            />
            <Button mode="outlined" onPress={handleRemovePin} style={styles.btn} textColor={theme.colors.error}>
              PIN o'chirish
            </Button>
          </>
        ) : (
          <>
            <TextInput
              label="Yangi PIN (4 raqam)"
              value={newPin}
              onChangeText={(v) => setNewPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              mode="outlined"
              style={styles.input}
              maxLength={4}
            />
            <TextInput
              label="PIN tasdiqlash"
              value={confirmPin}
              onChangeText={(v) => setConfirmPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              mode="outlined"
              style={styles.input}
              maxLength={4}
            />
            <Button mode="contained" onPress={handleSetPin} loading={saving} style={styles.btn}>
              PIN o'rnatish
            </Button>
          </>
        )}
      </List.Section>

      {biometricAvailable && (
        <List.Section>
          <List.Subheader>Biometrika</List.Subheader>
          <List.Item
            title="Barmoq izi / Face ID"
            description="PIN o'rniga biometrika bilan ochish"
            left={(props) => <List.Icon {...props} icon="fingerprint" />}
            right={() => (
              <Switch value={biometricOn} onValueChange={toggleBiometric} disabled={!pinExists} />
            )}
          />
        </List.Section>
      )}

      <List.Section>
        <List.Subheader>Bildirishnomalar</List.Subheader>
        <List.Item
          title="Qarz eslatmalari"
          description="Muddatdan 1 kun oldin eslatma"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => <Switch value={notificationsOn} onValueChange={toggleNotifications} />}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  input: { marginHorizontal: 16, marginBottom: 12 },
  btn: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
});

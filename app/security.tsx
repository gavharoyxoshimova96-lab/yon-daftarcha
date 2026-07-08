import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, List, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useSecurity } from '@/context/SecurityContext';
import { useLocale } from '@/context/LocaleContext';
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
  syncNotifications,
} from '@/services/notifications';

export default function SecurityScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { user, logout, changeUserPassword } = useAuth();
  const { refreshSecurity } = useSecurity();
  const [pinExists, setPinExists] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      Alert.alert(t('common.error'), t('security.pinMustBe4'));
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert(t('common.error'), t('security.pinMismatch'));
      return;
    }
    setSaving(true);
    try {
      await setPin(newPin);
      setNewPin('');
      setConfirmPin('');
      await refreshSecurity();
      await loadSettings();
      Alert.alert(t('common.ready'), t('security.pinSetSuccess'));
    } catch {
      Alert.alert(t('common.error'), t('security.pinMustBe4'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePin = () => {
    Alert.alert(t('security.removePin'), t('security.pinRemoveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await removePin();
          await refreshSecurity();
          await loadSettings();
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('auth.errors.invalidPassword'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.errors.passwordMismatch'));
      return;
    }
    setSaving(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('common.ready'), t('auth.passwordChanged'));
    } catch {
      Alert.alert(t('common.error'), t('auth.errors.invalidCredentials'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const toggleBiometric = async (value: boolean) => {
    if (value && !pinExists) {
      Alert.alert(t('security.setPin'));
      return;
    }
    await setBiometricEnabled(value);
    setBiometricOn(value);
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const ok = await enableNotifications();
      if (!ok) {
        Alert.alert(t('security.notifications'), t('security.enableNotificationsDesc'));
        return;
      }
    } else {
      await disableNotifications();
    }
    setNotificationsOn(value);
    if (value) await syncNotifications();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <List.Section>
        <List.Subheader>{t('auth.account')}</List.Subheader>
        <List.Item
          title={user?.isGuest ? t('auth.guestName') : user?.name ?? '—'}
          description={user?.isGuest ? t('auth.guestDesc') : user?.email ?? ''}
          left={(props) => <List.Icon {...props} icon="account-circle" />}
        />
        <Button mode="outlined" onPress={handleLogout} style={styles.btn} icon="logout">
          {t('auth.logout')}
        </Button>
      </List.Section>

      {!user?.isGuest ? (
        <List.Section>
          <List.Subheader>{t('auth.changePassword')}</List.Subheader>
          <TextInput
            label={t('auth.currentPassword')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label={t('auth.newPassword')}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleChangePassword} loading={saving} style={styles.btn}>
            {t('auth.changePasswordBtn')}
          </Button>
        </List.Section>
      ) : null}

      <List.Section>
        <List.Subheader>{t('security.pinSet')}</List.Subheader>
        {pinExists ? (
          <>
            <List.Item
              title={t('security.pinSet')}
              description={t('security.pinLockDesc')}
              left={(props) => <List.Icon {...props} icon="lock" />}
            />
            <Button mode="outlined" onPress={handleRemovePin} style={styles.btn} textColor={theme.colors.error}>
              {t('security.removePin')}
            </Button>
          </>
        ) : (
          <>
            <TextInput
              label={t('security.newPin')}
              value={newPin}
              onChangeText={(v) => setNewPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              mode="outlined"
              style={styles.input}
              maxLength={4}
            />
            <TextInput
              label={t('security.confirmPin')}
              value={confirmPin}
              onChangeText={(v) => setConfirmPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              mode="outlined"
              style={styles.input}
              maxLength={4}
            />
            <Button mode="contained" onPress={handleSetPin} loading={saving} style={styles.btn}>
              {t('security.setPin')}
            </Button>
          </>
        )}
      </List.Section>

      {biometricAvailable && (
        <List.Section>
          <List.Subheader>{t('security.biometric')}</List.Subheader>
          <List.Item
            title={t('security.biometric')}
            description={t('security.biometricDesc')}
            left={(props) => <List.Icon {...props} icon="fingerprint" />}
            right={() => (
              <Switch value={biometricOn} onValueChange={toggleBiometric} disabled={!pinExists} />
            )}
          />
        </List.Section>
      )}

      <List.Section>
        <List.Subheader>{t('security.notifications')}</List.Subheader>
        <List.Item
          title={t('security.debtNotifications')}
          description={t('security.debtNotificationsDesc')}
          left={(props) => <List.Icon {...props} icon="bell" />}
        />
        <List.Item
          title={t('security.budgetNotifications')}
          description={t('security.budgetNotificationsDesc')}
          left={(props) => <List.Icon {...props} icon="chart-line" />}
        />
        <List.Item
          title={t('security.enableNotifications')}
          description={t('security.enableNotificationsDesc')}
          left={(props) => <List.Icon {...props} icon="bell-ring" />}
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

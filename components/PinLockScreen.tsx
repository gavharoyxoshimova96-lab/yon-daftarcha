import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

import { useLocale } from '@/context/LocaleContext';
import { isBiometricAvailable, isBiometricEnabled } from '@/services/security';

interface PinLockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
  onBiometric: () => Promise<boolean>;
}

export function PinLockScreen({ onUnlock, onBiometric }: PinLockScreenProps) {
  const theme = useTheme();
  const { t } = useLocale();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      setShowBiometric(available && enabled);
      if (available && enabled) {
        const ok = await onBiometric();
        if (!ok) setError('');
      }
    })();
  }, [onBiometric]);

  const handleUnlock = async () => {
    if (pin.length < 4) {
      setError(t('security.pinMustBe4'));
      return;
    }
    setLoading(true);
    setError('');
    const ok = await onUnlock(pin);
    if (!ok) {
      setError(t('security.wrongPin'));
      setPin('');
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>
        {t('appName')}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
        {t('security.enterPinToContinue')}
      </Text>

      <TextInput
        label="PIN"
        value={pin}
        onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        secureTextEntry
        mode="outlined"
        style={styles.input}
        maxLength={4}
      />

      {error ? <Text style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</Text> : null}

      <Button mode="contained" onPress={handleUnlock} loading={loading} style={styles.button}>
        {t('security.unlock')}
      </Button>

      {showBiometric && (
        <Button mode="outlined" onPress={onBiometric} icon="fingerprint" style={styles.button}>
          {t('security.biometric')}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
});

import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useLocale } from '@/context/LocaleContext';
import { hasPin } from '@/services/security';
import { palette, radii } from '@/constants/design';

type AuthMode = 'login' | 'register' | 'forgot';

interface LoginScreenProps {
  hasAccount: boolean;
  loading: boolean;
  error: string;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, confirm: string) => Promise<void>;
  onGuest: () => Promise<void>;
  onResetWithPin: (pin: string, newPassword: string, confirm: string) => Promise<void>;
  onClearAccount: () => Promise<void>;
}

export function LoginScreen({
  hasAccount,
  loading,
  error,
  onLogin,
  onRegister,
  onGuest,
  onResetWithPin,
  onClearAccount,
}: LoginScreenProps) {
  const theme = useTheme();
  const { t } = useLocale();
  const [mode, setMode] = useState<AuthMode>(hasAccount ? 'login' : 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pinAvailable, setPinAvailable] = useState(false);

  useEffect(() => {
    if (mode === 'forgot') {
      hasPin().then(setPinAvailable);
    }
  }, [mode]);

  const handleSubmit = async () => {
    if (mode === 'login') {
      await onLogin(email, password);
      return;
    }
    if (mode === 'forgot') {
      await onResetWithPin(pin, password, confirmPassword);
      return;
    }
    await onRegister(name, email, password, confirmPassword);
  };

  const handleClearAccount = () => {
    Alert.alert(t('auth.resetAccount'), t('auth.resetAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.resetAccountBtn'),
        style: 'destructive',
        onPress: () => onClearAccount(),
      },
    ]);
  };

  const subtitle =
    mode === 'login'
      ? t('auth.loginSubtitle')
      : mode === 'register'
        ? t('auth.registerSubtitle')
        : t('auth.forgotSubtitle');

  return (
    <LinearGradient
      colors={[palette.emeraldDeep, palette.emerald, '#0A0A0A']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text variant="headlineLarge" style={styles.appTitle}>
              {t('appName')}
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {subtitle}
            </Text>
          </View>

          <SurfaceCard style={styles.card}>
            <View style={styles.cardInner}>
              {mode !== 'forgot' ? (
                <SegmentedButtons
                  value={mode}
                  onValueChange={(v) => setMode(v as AuthMode)}
                  buttons={[
                    { value: 'login', label: t('auth.login') },
                    { value: 'register', label: t('auth.register') },
                  ]}
                  style={styles.segmented}
                />
              ) : (
                <Button
                  mode="text"
                  icon="arrow-left"
                  onPress={() => setMode('login')}
                  style={styles.backBtn}
                >
                  {t('auth.backToLogin')}
                </Button>
              )}

              {mode === 'register' ? (
                <TextInput
                  label={t('auth.name')}
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                  autoCapitalize="words"
                />
              ) : null}

              {mode !== 'forgot' ? (
                <TextInput
                  label={t('auth.email')}
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              ) : null}

              {mode === 'forgot' && pinAvailable ? (
                <>
                  <Text variant="bodySmall" style={[styles.forgotHint, { color: theme.colors.onSurfaceVariant }]}>
                    {t('auth.forgotWithPin')}
                  </Text>
                  <TextInput
                    label="PIN"
                    value={pin}
                    onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={4}
                  />
                  <TextInput
                    label={t('auth.newPassword')}
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                    autoCapitalize="none"
                  />
                  <TextInput
                    label={t('auth.confirmPassword')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                    autoCapitalize="none"
                  />
                </>
              ) : null}

              {mode === 'forgot' && !pinAvailable ? (
                <Text variant="bodySmall" style={[styles.forgotHint, { color: theme.colors.onSurfaceVariant }]}>
                  {t('auth.forgotNoPin')}
                </Text>
              ) : null}

              {mode === 'login' ? (
                <>
                  <TextInput
                    label={t('auth.password')}
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                    autoCapitalize="none"
                  />
                  <Button
                    mode="text"
                    onPress={() => setMode('forgot')}
                    style={styles.forgotLink}
                    compact
                  >
                    {t('auth.forgotPassword')}
                  </Button>
                </>
              ) : null}

              {mode === 'register' ? (
                <TextInput
                  label={t('auth.password')}
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  autoCapitalize="none"
                />
              ) : null}

              {mode === 'register' ? (
                <TextInput
                  label={t('auth.confirmPassword')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  autoCapitalize="none"
                />
              ) : null}

              {error ? (
                <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
              ) : null}

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={mode === 'forgot' && !pinAvailable}
                style={styles.primaryBtn}
                contentStyle={styles.btnContent}
              >
                {mode === 'login'
                  ? t('auth.loginBtn')
                  : mode === 'forgot'
                    ? t('auth.resetPasswordBtn')
                    : t('auth.registerBtn')}
              </Button>

              {mode === 'forgot' ? (
                <Button
                  mode="outlined"
                  onPress={handleClearAccount}
                  disabled={loading}
                  style={styles.resetAccountBtn}
                  textColor={theme.colors.error}
                >
                  {t('auth.resetAccountBtn')}
                </Button>
              ) : null}

              {!hasAccount && mode !== 'forgot' ? (
                <Button mode="text" onPress={onGuest} disabled={loading} style={styles.guestBtn}>
                  {t('auth.continueGuest')}
                </Button>
              ) : null}
            </View>
          </SurfaceCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  hero: {
    marginBottom: 20,
    alignItems: 'center',
  },
  appTitle: {
    color: palette.gold,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#FFFFFFCC',
    textAlign: 'center',
  },
  card: {
    borderRadius: radii.xl,
  },
  cardInner: {
    padding: 18,
  },
  segmented: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  error: {
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 4,
    borderRadius: radii.md,
  },
  btnContent: {
    paddingVertical: 6,
  },
  guestBtn: {
    marginTop: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 8,
  },
  forgotHint: {
    marginBottom: 12,
    lineHeight: 20,
  },
  resetAccountBtn: {
    marginTop: 8,
    borderRadius: radii.md,
  },
});

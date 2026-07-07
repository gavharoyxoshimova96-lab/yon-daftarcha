import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LoginScreen } from '@/components/LoginScreen';
import { useLocale } from '@/context/LocaleContext';
import {
  AuthUser,
  changePassword,
  clearAccountCredentials,
  continueAsGuest,
  getCurrentUser,
  hasAccount,
  isAuthenticated,
  loginAccount,
  logoutAccount,
  registerAccount,
  resetPasswordWithPin,
  updateProfileName,
} from '@/services/auth';

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  changeUserPassword: (current: string, next: string) => Promise<void>;
  renameUser: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authenticated: false,
  logout: async () => {},
  refreshAuth: async () => {},
  changeUserPassword: async () => {},
  renameUser: async () => {},
});

function mapAuthError(error: unknown, t: (key: string) => string): string {
  const code = error instanceof Error ? error.message : 'UNKNOWN';
  switch (code) {
    case 'INVALID_NAME':
      return t('auth.errors.invalidName');
    case 'INVALID_EMAIL':
      return t('auth.errors.invalidEmail');
    case 'INVALID_PASSWORD':
      return t('auth.errors.invalidPassword');
    case 'INVALID_CREDENTIALS':
      return t('auth.errors.invalidCredentials');
    case 'PASSWORD_MISMATCH':
      return t('auth.errors.passwordMismatch');
    case 'ACCOUNT_EXISTS':
      return t('auth.errors.accountExists');
    case 'INVALID_PIN':
      return t('auth.errors.invalidPin');
    case 'NO_PIN':
      return t('auth.errors.noPin');
    case 'NO_ACCOUNT':
      return t('auth.errors.noAccount');
    default:
      return t('auth.errors.unknown');
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshAuth = useCallback(async () => {
    const exists = await hasAccount();
    const loggedIn = await isAuthenticated();
    setAccountExists(exists);
    setAuthenticated(loggedIn);
    setUser(loggedIn ? await getCurrentUser() : null);
    setReady(true);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError('');
      try {
        await loginAccount(email, password);
        await refreshAuth();
      } catch (e) {
        setError(mapAuthError(e, t));
      } finally {
        setLoading(false);
      }
    },
    [refreshAuth, t]
  );

  const handleRegister = useCallback(
    async (name: string, email: string, password: string, confirm: string) => {
      setLoading(true);
      setError('');
      try {
        if (password !== confirm) throw new Error('PASSWORD_MISMATCH');
        await registerAccount(name, email, password);
        await refreshAuth();
      } catch (e) {
        setError(mapAuthError(e, t));
      } finally {
        setLoading(false);
      }
    },
    [refreshAuth, t]
  );

  const handleGuest = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await continueAsGuest();
      await refreshAuth();
    } catch (e) {
      setError(mapAuthError(e, t));
    } finally {
      setLoading(false);
    }
  }, [refreshAuth, t]);

  const handleResetWithPin = useCallback(
    async (pin: string, newPassword: string, confirm: string) => {
      setLoading(true);
      setError('');
      try {
        if (newPassword !== confirm) throw new Error('PASSWORD_MISMATCH');
        await resetPasswordWithPin(pin, newPassword);
        await refreshAuth();
      } catch (e) {
        setError(mapAuthError(e, t));
      } finally {
        setLoading(false);
      }
    },
    [refreshAuth, t]
  );

  const handleClearAccount = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await clearAccountCredentials();
      await refreshAuth();
    } catch (e) {
      setError(mapAuthError(e, t));
    } finally {
      setLoading(false);
    }
  }, [refreshAuth, t]);

  const logout = useCallback(async () => {
    await logoutAccount();
    await refreshAuth();
  }, [refreshAuth]);

  const changeUserPassword = useCallback(
    async (current: string, next: string) => {
      await changePassword(current, next);
      await refreshAuth();
    },
    [refreshAuth]
  );

  const renameUser = useCallback(
    async (name: string) => {
      await updateProfileName(name);
      await refreshAuth();
    },
    [refreshAuth]
  );

  const value = useMemo(
    () => ({
      user,
      authenticated,
      logout,
      refreshAuth,
      changeUserPassword,
      renameUser,
    }),
    [user, authenticated, logout, refreshAuth, changeUserPassword, renameUser]
  );

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!authenticated) {
    return (
      <LoginScreen
        hasAccount={accountExists}
        loading={loading}
        error={error}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGuest={handleGuest}
        onResetWithPin={handleResetWithPin}
        onClearAccount={handleClearAccount}
      />
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

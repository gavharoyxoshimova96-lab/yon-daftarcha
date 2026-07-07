import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { getSetting, setSetting } from '@/database';
import { hasPin, verifyPin } from '@/services/security';

const AUTH_PASSWORD_HASH_KEY = 'auth_password_hash';
const AUTH_USER_NAME_KEY = 'auth_user_name';
const AUTH_USER_EMAIL_KEY = 'auth_user_email';
const AUTH_SESSION_KEY = 'auth_session';
const AUTH_GUEST_KEY = 'auth_guest';
const SESSION_STORE_KEY = 'auth_session_token';
const PASSWORD_SALT = 'yon-daftarcha-auth-v1';

export interface AuthUser {
  name: string;
  email: string;
  isGuest: boolean;
}

async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${password}:${PASSWORD_SALT}`
  );
}

async function getStoredSession(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getSetting(AUTH_SESSION_KEY);
  }
  const secure = await SecureStore.getItemAsync(SESSION_STORE_KEY);
  if (secure) return secure;
  return getSetting(AUTH_SESSION_KEY);
}

async function storeSession(token: string): Promise<void> {
  await setSetting(AUTH_SESSION_KEY, token);
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(SESSION_STORE_KEY, token);
  }
}

async function clearSession(): Promise<void> {
  await setSetting(AUTH_SESSION_KEY, '');
  await setSetting(AUTH_GUEST_KEY, 'false');
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(SESSION_STORE_KEY);
  }
}

async function createSessionToken(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(24);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function hasAccount(): Promise<boolean> {
  const hash = await getSetting(AUTH_PASSWORD_HASH_KEY);
  return !!hash;
}

export async function registerAccount(
  name: string,
  email: string,
  password: string
): Promise<void> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedName.length < 2) throw new Error('INVALID_NAME');
  if (!isValidEmail(trimmedEmail)) throw new Error('INVALID_EMAIL');
  if (password.length < 6) throw new Error('INVALID_PASSWORD');
  if (await hasAccount()) throw new Error('ACCOUNT_EXISTS');

  await setSetting(AUTH_USER_NAME_KEY, trimmedName);
  await setSetting(AUTH_USER_EMAIL_KEY, trimmedEmail);
  await setSetting(AUTH_PASSWORD_HASH_KEY, await hashPassword(password));
  await setSetting(AUTH_GUEST_KEY, 'false');
  await storeSession(await createSessionToken());
}

export async function loginAccount(email: string, password: string): Promise<void> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) throw new Error('INVALID_EMAIL');
  if (password.length < 6) throw new Error('INVALID_PASSWORD');

  const storedEmail = (await getSetting(AUTH_USER_EMAIL_KEY))?.toLowerCase() ?? '';
  const storedHash = await getSetting(AUTH_PASSWORD_HASH_KEY);
  if (!storedHash || storedEmail !== trimmedEmail) throw new Error('INVALID_CREDENTIALS');

  const hash = await hashPassword(password);
  if (hash !== storedHash) throw new Error('INVALID_CREDENTIALS');

  await setSetting(AUTH_GUEST_KEY, 'false');
  await storeSession(await createSessionToken());
}

export async function continueAsGuest(): Promise<void> {
  await setSetting(AUTH_GUEST_KEY, 'true');
  await storeSession(await createSessionToken());
}

export async function logoutAccount(): Promise<void> {
  await clearSession();
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getStoredSession();
  return !!session;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getStoredSession();
  if (!session) return null;

  const isGuest = (await getSetting(AUTH_GUEST_KEY)) === 'true';
  if (isGuest) {
    return { name: 'Mehmon', email: '', isGuest: true };
  }

  const name = await getSetting(AUTH_USER_NAME_KEY);
  const email = await getSetting(AUTH_USER_EMAIL_KEY);
  if (!name || !email) return null;
  return { name, email, isGuest: false };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 6) throw new Error('INVALID_PASSWORD');
  const storedHash = await getSetting(AUTH_PASSWORD_HASH_KEY);
  if (!storedHash) throw new Error('NO_ACCOUNT');

  const currentHash = await hashPassword(currentPassword);
  if (currentHash !== storedHash) throw new Error('INVALID_CREDENTIALS');

  await setSetting(AUTH_PASSWORD_HASH_KEY, await hashPassword(newPassword));
}

export async function updateProfileName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error('INVALID_NAME');
  await setSetting(AUTH_USER_NAME_KEY, trimmed);
}

export async function resetPasswordWithPin(pin: string, newPassword: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) throw new Error('INVALID_PIN');
  if (newPassword.length < 6) throw new Error('INVALID_PASSWORD');
  if (!(await hasAccount())) throw new Error('NO_ACCOUNT');
  if (!(await hasPin())) throw new Error('NO_PIN');

  const ok = await verifyPin(pin);
  if (!ok) throw new Error('INVALID_PIN');

  await setSetting(AUTH_PASSWORD_HASH_KEY, await hashPassword(newPassword));
  await setSetting(AUTH_GUEST_KEY, 'false');
  await storeSession(await createSessionToken());
}

export async function clearAccountCredentials(): Promise<void> {
  await setSetting(AUTH_PASSWORD_HASH_KEY, '');
  await setSetting(AUTH_USER_NAME_KEY, '');
  await setSetting(AUTH_USER_EMAIL_KEY, '');
  await clearSession();
}

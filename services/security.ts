import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

import { getSetting, setSetting } from '@/database';

const PIN_KEY = 'pin_hash';
const PIN_SALT = 'yon-daftarcha-v2';

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${pin}:${PIN_SALT}`);
}

async function getStoredPinHash(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getSetting('pin_hash');
  }
  const secure = await SecureStore.getItemAsync(PIN_KEY);
  if (secure) return secure;
  return getSetting('pin_hash');
}

async function storePinHash(hash: string): Promise<void> {
  await setSetting('pin_hash', hash);
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(PIN_KEY, hash);
  }
}

async function clearPinHash(): Promise<void> {
  await setSetting('pin_hash', '');
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(PIN_KEY);
  }
}

export async function hasPin(): Promise<boolean> {
  const hash = await getStoredPinHash();
  return !!hash;
}

export async function setPin(pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) throw new Error('INVALID_PIN');
  await storePinHash(await hashPin(pin));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await getStoredPinHash();
  if (!stored) return false;
  return (await hashPin(pin)) === stored;
}

export async function removePin(): Promise<void> {
  await clearPinHash();
  await setSetting('biometric_enabled', 'false');
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Yon Daftarcha qulfini oching',
    cancelLabel: 'Bekor',
  });
  return result.success;
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await getSetting('biometric_enabled')) === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await setSetting('biometric_enabled', enabled ? 'true' : 'false');
}

export async function refreshSecurityAfterImport(): Promise<void> {
  const hash = await getSetting('pin_hash');
  if (hash && Platform.OS !== 'web') {
    await SecureStore.setItemAsync(PIN_KEY, hash);
  }
}

export async function areNotificationsEnabled(): Promise<boolean> {
  return (await getSetting('notifications_enabled')) === 'true';
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await setSetting('notifications_enabled', enabled ? 'true' : 'false');
}

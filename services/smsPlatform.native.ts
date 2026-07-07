import { Platform } from 'react-native';

type SmsListenerModule = typeof import('expo-sms-listener');

let smsModule: SmsListenerModule | null = null;

async function getSmsModule(): Promise<SmsListenerModule | null> {
  if (Platform.OS !== 'android') return null;
  if (!smsModule) {
    try {
      smsModule = await import('expo-sms-listener');
    } catch {
      return null;
    }
  }
  return smsModule;
}

export async function requestSmsPermission(): Promise<boolean> {
  const mod = await getSmsModule();
  if (!mod) return false;
  const { granted } = await mod.requestSmsPermissionAsync();
  return granted;
}

export async function checkSmsPermission(): Promise<boolean> {
  const mod = await getSmsModule();
  if (!mod) return false;
  const { granted } = await mod.checkSmsPermissionAsync();
  return granted;
}

export async function startSmsListenerService(): Promise<void> {
  const mod = await getSmsModule();
  if (!mod) return;
  await mod.startSmsListenerServiceAsync();
}

export async function stopSmsListenerService(): Promise<void> {
  const mod = await getSmsModule();
  if (!mod) return;
  await mod.stopSmsListenerServiceAsync();
}

export function subscribeToSms(
  callback: (message: { body: string; sender: string; timestamp: number }) => void
): () => void {
  let subscription: { remove: () => void } | null = null;
  let cancelled = false;

  getSmsModule().then((mod) => {
    if (!mod || cancelled) return;
    subscription = mod.addSmsListener((msg) => {
      callback({
        body: msg.body,
        sender: msg.originatingAddress,
        timestamp: msg.timestamp,
      });
    });
  });

  return () => {
    cancelled = true;
    subscription?.remove();
  };
}

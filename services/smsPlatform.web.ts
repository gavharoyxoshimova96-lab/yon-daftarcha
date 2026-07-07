export async function requestSmsPermission(): Promise<boolean> {
  return false;
}

export async function checkSmsPermission(): Promise<boolean> {
  return false;
}

export async function startSmsListenerService(): Promise<void> {}

export async function stopSmsListenerService(): Promise<void> {}

export function subscribeToSms(
  _callback: (message: { body: string; sender: string; timestamp: number }) => void
): () => void {
  return () => {};
}

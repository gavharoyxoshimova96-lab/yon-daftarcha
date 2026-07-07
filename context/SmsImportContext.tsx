import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useDatabase } from '@/context/DatabaseContext';
import { importSmsMessage, isSmsImportEnabled } from '@/services/smsImport';
import { isLikelyBankSms } from '@/services/smsParser';
import {
  checkSmsPermission,
  startSmsListenerService,
  stopSmsListenerService,
  subscribeToSms,
} from '@/services/smsPlatform';

const SmsImportContext = createContext({});

export function SmsImportProvider({ children }: { children: React.ReactNode }) {
  const { ready, refresh } = useDatabase();
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!ready || Platform.OS !== 'android') return;

    let unsubscribe: (() => void) | undefined;
    let active = true;

    (async () => {
      const enabled = await isSmsImportEnabled();
      if (!enabled || !active) return;

      const granted = await checkSmsPermission();
      if (!granted || !active) return;

      await startSmsListenerService();
      unsubscribe = subscribeToSms(async (message) => {
        if (!isLikelyBankSms(message.body, message.sender)) return;
        const imported = await importSmsMessage(message);
        if (imported) refreshRef.current();
      });
    })();

    return () => {
      active = false;
      unsubscribe?.();
      stopSmsListenerService().catch(() => {});
    };
  }, [ready]);

  return <SmsImportContext.Provider value={{}}>{children}</SmsImportContext.Provider>;
}

export function useSmsImport() {
  return useContext(SmsImportContext);
}

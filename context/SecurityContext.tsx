import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { PinLockScreen } from '@/components/PinLockScreen';
import {
  authenticateWithBiometric,
  hasPin,
  isBiometricEnabled,
  verifyPin,
} from '@/services/security';

interface SecurityContextValue {
  locked: boolean;
  hasPinSet: boolean;
  unlock: (pin?: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  refreshSecurity: () => Promise<void>;
  lock: () => void;
}

const SecurityContext = createContext<SecurityContextValue>({
  locked: false,
  hasPinSet: false,
  unlock: async () => false,
  unlockWithBiometric: async () => false,
  refreshSecurity: async () => {},
  lock: () => {},
});

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshSecurity = useCallback(async () => {
    const pinExists = await hasPin();
    setHasPinSet(pinExists);
    setLocked(pinExists);
    setReady(true);
  }, []);

  useEffect(() => {
    refreshSecurity();
  }, [refreshSecurity]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'background' && hasPinSet) {
        setLocked(true);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [hasPinSet]);

  const unlock = useCallback(async (pin?: string) => {
    if (!pin) return false;
    const ok = await verifyPin(pin);
    if (ok) setLocked(false);
    return ok;
  }, []);

  const unlockWithBiometric = useCallback(async () => {
    if (!(await isBiometricEnabled())) return false;
    const ok = await authenticateWithBiometric();
    if (ok) setLocked(false);
    return ok;
  }, []);

  const lock = useCallback(() => {
    if (hasPinSet) setLocked(true);
  }, [hasPinSet]);

  if (!ready) return null;

  return (
    <SecurityContext.Provider
      value={{ locked, hasPinSet, unlock, unlockWithBiometric, refreshSecurity, lock }}
    >
      {locked && hasPinSet ? (
        <PinLockScreen onUnlock={unlock} onBiometric={unlockWithBiometric} />
      ) : (
        children
      )}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  return useContext(SecurityContext);
}

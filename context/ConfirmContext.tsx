import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { registerConfirmHandler } from '@/utils/dialog';

interface ConfirmRequest {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  destructive?: boolean;
  resolve: (value: boolean) => void;
}

type ConfirmFn = (
  title: string,
  message: string,
  options: {
    confirmText: string;
    cancelText: string;
    destructive?: boolean;
  }
) => Promise<boolean>;

const ConfirmContext = createContext<{ confirm: ConfirmFn } | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const requestRef = useRef<ConfirmRequest | null>(null);

  const close = useCallback((result: boolean) => {
    const current = requestRef.current;
    if (!current) return;
    current.resolve(result);
    requestRef.current = null;
    setRequest(null);
  }, []);

  const confirm = useCallback<ConfirmFn>(
    (title, message, options) =>
      new Promise<boolean>((resolve) => {
        const next: ConfirmRequest = {
          title,
          message,
          confirmText: options.confirmText,
          cancelText: options.cancelText,
          destructive: options.destructive,
          resolve,
        };
        requestRef.current = next;
        setRequest(next);
      }),
    []
  );

  useEffect(() => {
    registerConfirmHandler(confirm);
    return () => registerConfirmHandler(null);
  }, [confirm]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Portal>
        <Dialog visible={!!request} dismissable={false}>
          <Dialog.Title>{request?.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{request?.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => close(false)}>{request?.cancelText}</Button>
            <Button
              textColor={request?.destructive ? '#C62828' : undefined}
              onPress={() => close(true)}
            >
              {request?.confirmText}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return (title, message) =>
      Promise.resolve(window.confirm ? window.confirm(`${title}\n\n${message}`) : false);
  }
  return ctx.confirm;
}

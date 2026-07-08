import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

const ConfirmContext = createContext({});

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback(
    (
      title: string,
      message: string,
      options: {
        confirmText: string;
        cancelText: string;
        destructive?: boolean;
      }
    ) =>
      new Promise<boolean>((resolve) => {
        setRequest({
          title,
          message,
          confirmText: options.confirmText,
          cancelText: options.cancelText,
          destructive: options.destructive,
          resolve,
        });
      }),
    []
  );

  useEffect(() => {
    registerConfirmHandler(confirm);
    return () => registerConfirmHandler(null);
  }, [confirm]);

  const close = useCallback((result: boolean) => {
    request?.resolve(result);
    setRequest(null);
  }, [request]);

  const value = useMemo(() => ({}), []);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Portal>
        <Dialog visible={!!request} onDismiss={() => close(false)}>
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

export function useConfirm() {
  return useContext(ConfirmContext);
}

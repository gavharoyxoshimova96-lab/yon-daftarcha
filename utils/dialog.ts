import { Alert, Platform } from 'react-native';

type ConfirmHandler = (
  title: string,
  message: string,
  options: {
    confirmText: string;
    cancelText: string;
    destructive?: boolean;
  }
) => Promise<boolean>;

let confirmHandler: ConfirmHandler | null = null;

export function registerConfirmHandler(handler: ConfirmHandler | null): void {
  confirmHandler = handler;
}

export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export async function confirmDialog(
  title: string,
  message: string,
  options: {
    confirmText: string;
    cancelText: string;
    destructive?: boolean;
  }
): Promise<boolean> {
  if (confirmHandler) {
    return confirmHandler(title, message, options);
  }

  if (Platform.OS === 'web') {
    return window.confirm(`${title}\n\n${message}`);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: options.cancelText, style: 'cancel', onPress: () => resolve(false) },
      {
        text: options.confirmText,
        style: options.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

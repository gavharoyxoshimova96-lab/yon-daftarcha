import { importSmsMessage } from '@/services/smsImport';
import { isLikelyBankSms } from '@/services/smsParser';

export default async function smsHeadlessTask(data: {
  originatingAddress?: string;
  body?: string;
  timestamp?: number;
}): Promise<void> {
  const body = data.body ?? '';
  const sender = data.originatingAddress ?? '';
  if (!isLikelyBankSms(body, sender)) return;

  try {
    await importSmsMessage({ body, sender, timestamp: data.timestamp });
  } catch {
    // headless task must not throw
  }
}

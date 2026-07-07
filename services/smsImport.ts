import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { createTransaction, getCategories, getSetting, setSetting } from '@/database';
import { TransactionType } from '@/types';
import { parseBankSms, ParsedSmsTransaction } from '@/services/smsParser';

export const SMS_IMPORT_ENABLED_KEY = 'sms_import_enabled';
export const SMS_PROCESSED_HASHES_KEY = 'sms_processed_hashes';
export const SMS_DEFAULT_EXPENSE_CATEGORY_KEY = 'sms_default_expense_category_id';
export const SMS_DEFAULT_INCOME_CATEGORY_KEY = 'sms_default_income_category_id';

const MAX_STORED_HASHES = 500;

export interface SmsImportResult {
  imported: number;
  skipped: number;
  failed: number;
}

export interface IncomingSmsMessage {
  body: string;
  sender?: string;
  timestamp?: number;
}

async function loadProcessedHashes(): Promise<Set<string>> {
  const raw = await getSetting(SMS_PROCESSED_HASHES_KEY);
  if (!raw) return new Set();
  try {
    const list = JSON.parse(raw) as string[];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

async function saveProcessedHashes(hashes: Set<string>): Promise<void> {
  const list = Array.from(hashes).slice(-MAX_STORED_HASHES);
  await setSetting(SMS_PROCESSED_HASHES_KEY, JSON.stringify(list));
}

export async function createSmsHash(message: IncomingSmsMessage): Promise<string> {
  const payload = `${message.sender ?? ''}|${message.body}|${message.timestamp ?? ''}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}

async function getDefaultCategoryId(type: TransactionType): Promise<number | null> {
  const key =
    type === 'income' ? SMS_DEFAULT_INCOME_CATEGORY_KEY : SMS_DEFAULT_EXPENSE_CATEGORY_KEY;
  const saved = await getSetting(key);
  if (saved) {
    const id = parseInt(saved, 10);
    if (id > 0) return id;
  }

  const categories = await getCategories(type);
  const fallback = categories.find((c) => c.name === 'Boshqa') ?? categories[0];
  return fallback?.id ?? null;
}

export async function isSmsImportEnabled(): Promise<boolean> {
  return (await getSetting(SMS_IMPORT_ENABLED_KEY)) === 'true';
}

export async function setSmsImportEnabled(enabled: boolean): Promise<void> {
  await setSetting(SMS_IMPORT_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function setDefaultSmsCategory(type: TransactionType, categoryId: number): Promise<void> {
  const key =
    type === 'income' ? SMS_DEFAULT_INCOME_CATEGORY_KEY : SMS_DEFAULT_EXPENSE_CATEGORY_KEY;
  await setSetting(key, String(categoryId));
}

export async function importParsedSms(
  parsed: ParsedSmsTransaction,
  hash: string,
  processed: Set<string>
): Promise<boolean> {
  if (processed.has(hash)) return false;

  const categoryId = await getDefaultCategoryId(parsed.type);
  if (!categoryId) return false;

  await createTransaction(parsed.type, parsed.amount, categoryId, parsed.note, parsed.date);
  processed.add(hash);
  return true;
}

export async function importSmsMessage(message: IncomingSmsMessage): Promise<boolean> {
  const parsed = parseBankSms(message.body, message.sender ?? '', message.timestamp);
  if (!parsed) return false;

  const hash = await createSmsHash(message);
  const processed = await loadProcessedHashes();
  const imported = await importParsedSms(parsed, hash, processed);
  if (imported) await saveProcessedHashes(processed);
  return imported;
}

export async function importSmsBatch(messages: IncomingSmsMessage[]): Promise<SmsImportResult> {
  const processed = await loadProcessedHashes();
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const message of messages) {
    const parsed = parseBankSms(message.body, message.sender ?? '', message.timestamp);
    if (!parsed) {
      skipped += 1;
      continue;
    }

    try {
      const hash = await createSmsHash(message);
      const ok = await importParsedSms(parsed, hash, processed);
      if (ok) imported += 1;
      else skipped += 1;
    } catch {
      failed += 1;
    }
  }

  await saveProcessedHashes(processed);
  return { imported, skipped, failed };
}

export async function importSmsText(body: string, sender = ''): Promise<SmsImportResult> {
  return importSmsBatch([{ body, sender, timestamp: Date.now() }]);
}

export function isSmsImportSupported(): boolean {
  return Platform.OS === 'android';
}

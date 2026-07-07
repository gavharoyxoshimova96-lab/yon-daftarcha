import { TransactionType } from '@/types';
import { toDateString } from '@/utils/date';

export interface ParsedSmsTransaction {
  type: TransactionType;
  amount: number;
  note: string;
  date: string;
  bank?: string;
}

const INCOME_KEYWORDS = [
  'popolnenie',
  'popolneniye',
  'kirim',
  'credit',
  'credited',
  'qabul',
  'keldi',
  "o'tkazildi",
  'otkazildi',
  'zachislenie',
  'postuplenie',
  'зачисление',
  'поступление',
  'popolnen',
];

const EXPENSE_KEYWORDS = [
  'xarid',
  'spisanie',
  'spisaniye',
  'chiqim',
  "to'lov",
  'tolov',
  'debit',
  'platezh',
  'payment',
  'списание',
  'покупка',
  'oplata',
  'pokupka',
  'sarflandi',
];

const BANK_SENDERS = [
  { pattern: /humo|uzcard|uzbekistan\s*24/i, name: 'Humo/Uzcard' },
  { pattern: /kapital|kapitalbank/i, name: 'Kapitalbank' },
  { pattern: /ipak\s*yuli|ipakyuli/i, name: 'Ipak Yuli' },
  { pattern: /hamkorbank|hamkor/i, name: 'Hamkorbank' },
  { pattern: /agrobank/i, name: 'Agrobank' },
  { pattern: /sqb|sanoat/i, name: 'SQB' },
  { pattern: /tbc/i, name: 'TBC' },
  { pattern: /click/i, name: 'Click' },
  { pattern: /payme/i, name: 'Payme' },
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/['`]/g, "'");
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function extractAmount(body: string): number | null {
  const patterns = [
    /(\d[\d\s]*(?:[.,]\d{2})?)\s*(?:uzs|so'?m|sum|сум|сўм)/i,
    /(?:summa|amount|sum|сумма)[:\s]+(\d[\d\s]*(?:[.,]\d{2})?)/i,
    /(\d[\d\s]*(?:[.,]\d{2})?)\s*uzs/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match?.[1]) {
      const amount = parseAmount(match[1]);
      if (amount) return amount;
    }
  }

  const fallback = body.match(/(\d{2,}[\d\s]*(?:[.,]\d{2})?)/);
  if (fallback?.[1]) {
    const amount = parseAmount(fallback[1]);
    if (amount && amount >= 1000) return amount;
  }

  return null;
}

function extractDate(body: string, timestamp?: number): string {
  const match = body.match(/(\d{2})[./](\d{2})[./](\d{2,4})/);
  if (match) {
    const day = match[1];
    const month = match[2];
    let year = match[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  if (timestamp) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) return toDateString(date);
  }

  return toDateString();
}

function detectType(text: string): TransactionType | null {
  const hasIncome = INCOME_KEYWORDS.some((k) => text.includes(k));
  const hasExpense = EXPENSE_KEYWORDS.some((k) => text.includes(k));

  if (hasIncome && !hasExpense) return 'income';
  if (hasExpense && !hasIncome) return 'expense';
  if (hasIncome) return 'income';
  if (hasExpense) return 'expense';

  if (/\bminus\b|-\s*\d|spisan/i.test(text)) return 'expense';
  if (/\+|popoln|credit|kirim/i.test(text)) return 'income';

  return null;
}

function extractMerchant(body: string): string {
  const parts = body.split(/[;\n]/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (/xarid|spisanie|to'lov|popolnenie|payment/i.test(part)) continue;
    if (/\d{2}[./]\d{2}[./]\d{2}/.test(part)) continue;
    if (/(?:uzs|so'm|sum|\*+\d)/i.test(part)) continue;
    if (part.length >= 3 && part.length <= 60) return part;
  }

  const compact = body.replace(/\s+/g, ' ').trim();
  return compact.length > 80 ? `${compact.slice(0, 77)}...` : compact;
}

function detectBank(sender: string, body: string): string | undefined {
  const combined = `${sender} ${body}`;
  return BANK_SENDERS.find((b) => b.pattern.test(combined))?.name;
}

export function parseBankSms(body: string, sender = '', timestamp?: number): ParsedSmsTransaction | null {
  const trimmed = body.trim();
  if (!trimmed || trimmed.length < 10) return null;

  const text = normalizeText(trimmed);
  const amount = extractAmount(trimmed);
  const type = detectType(text);

  if (!amount || !type) return null;

  const bank = detectBank(sender, trimmed);
  const merchant = extractMerchant(trimmed);
  const note = bank ? `[SMS] ${bank}: ${merchant}` : `[SMS] ${merchant}`;

  return {
    type,
    amount,
    note,
    date: extractDate(trimmed, timestamp),
    bank,
  };
}

export function isLikelyBankSms(body: string, sender = ''): boolean {
  const text = normalizeText(`${sender} ${body}`);
  if (extractAmount(body)) {
    return (
      INCOME_KEYWORDS.some((k) => text.includes(k)) ||
      EXPENSE_KEYWORDS.some((k) => text.includes(k)) ||
      /uzs|so'm|humo|uzcard|humocard/i.test(text)
    );
  }
  return false;
}

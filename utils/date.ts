import { getActiveLocale, getMonthName as getMonthNameI18n, formatMonthYear as formatMonthYearI18n } from '@/i18n';

export function toDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

export function getMonthRange(date: Date = new Date()): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: toDateString(start), end: toDateString(end) };
}

export function getMonthName(date: Date = new Date()): string {
  return getMonthNameI18n(date, getActiveLocale());
}

export function formatMonthYear(date: Date = new Date()): string {
  return formatMonthYearI18n(date, getActiveLocale());
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

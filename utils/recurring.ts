import { RecurringFrequency } from '@/types';
import { parseDateString, toDateString } from '@/utils/date';

export function advanceRecurringDate(dateStr: string, frequency: RecurringFrequency): string {
  const date = parseDateString(dateStr);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return toDateString(date);
}

export const RECURRING_FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

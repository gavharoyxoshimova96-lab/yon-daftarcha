import { processDueRecurringTransactions } from '@/database';

export async function runRecurringPayments(): Promise<number> {
  return processDueRecurringTransactions();
}

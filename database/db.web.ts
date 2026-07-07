import {
  Category,
  CategoryType,
  Debt,
  DebtStatus,
  DebtType,
  DailySummary,
  MonthlyReport,
  Transaction,
  TransactionFilter,
  TransactionType,
  SavingsGoal,
  Budget,
  BudgetStatus,
  BackupData,
  RecurringTransaction,
  RecurringFrequency,
} from '@/types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, CHART_COLORS } from '@/constants/defaultCategories';
import { getMonthRange, toDateString } from '@/utils/date';
import { toMonthKey } from '@/utils/month';
import { advanceRecurringDate } from '@/utils/recurring';

const STORAGE_KEY = 'yondaftarcha_db';

interface WebStore {
  categories: Category[];
  transactions: Omit<Transaction, 'category_name'>[];
  debts: Debt[];
  savings_goals: SavingsGoal[];
  budgets: Budget[];
  recurring_transactions: RecurringTransaction[];
  settings: Record<string, string>;
  nextCategoryId: number;
  nextTransactionId: number;
  nextDebtId: number;
  nextSavingsId: number;
  nextBudgetId: number;
  nextRecurringId: number;
}

let store: WebStore | null = null;

function loadStore(): WebStore {
  if (typeof localStorage === 'undefined') {
    return createEmptyStore();
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyStore();
  try {
    return normalizeStore(JSON.parse(raw) as Partial<WebStore>);
  } catch {
    return createEmptyStore();
  }
}

function createEmptyStore(): WebStore {
  return {
    categories: [],
    transactions: [],
    debts: [],
    savings_goals: [],
    budgets: [],
    recurring_transactions: [],
    settings: {},
    nextCategoryId: 1,
    nextTransactionId: 1,
    nextDebtId: 1,
    nextSavingsId: 1,
    nextBudgetId: 1,
    nextRecurringId: 1,
  };
}

function normalizeStore(raw: Partial<WebStore>): WebStore {
  const empty = createEmptyStore();
  return {
    ...empty,
    ...raw,
    categories: raw.categories ?? empty.categories,
    transactions: raw.transactions ?? empty.transactions,
    debts: raw.debts ?? empty.debts,
    savings_goals: raw.savings_goals ?? empty.savings_goals,
    budgets: raw.budgets ?? empty.budgets,
    recurring_transactions: raw.recurring_transactions ?? empty.recurring_transactions,
    settings: raw.settings ?? empty.settings,
    nextCategoryId: raw.nextCategoryId ?? empty.nextCategoryId,
    nextTransactionId: raw.nextTransactionId ?? empty.nextTransactionId,
    nextDebtId: raw.nextDebtId ?? empty.nextDebtId,
    nextSavingsId: raw.nextSavingsId ?? empty.nextSavingsId,
    nextBudgetId: raw.nextBudgetId ?? empty.nextBudgetId,
    nextRecurringId: raw.nextRecurringId ?? empty.nextRecurringId,
  };
}

function persist(): void {
  if (typeof localStorage !== 'undefined' && store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

function seedCategories(): void {
  if (!store || store.categories.length > 0) return;
  for (const cat of [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
    store.categories.push({
      id: store.nextCategoryId++,
      name: cat.name,
      type: cat.type,
    });
  }
  persist();
}

function ensureReady(): WebStore {
  if (!store) {
    store = loadStore();
    seedCategories();
  }
  return store;
}

function getCategoryName(categoryId: number): string | undefined {
  return ensureReady().categories.find((c) => c.id === categoryId)?.name;
}

function withCategoryName(tx: Omit<Transaction, 'category_name'>): Transaction {
  return { ...tx, category_name: getCategoryName(tx.category_id) };
}

function filterTransactions(filter: TransactionFilter): Transaction[] {
  const data = ensureReady();
  let rows = data.transactions.map(withCategoryName);

  if (filter.type) rows = rows.filter((t) => t.type === filter.type);
  if (filter.categoryId) rows = rows.filter((t) => t.category_id === filter.categoryId);
  if (filter.startDate) rows = rows.filter((t) => t.date >= filter.startDate!);
  if (filter.endDate) rows = rows.filter((t) => t.date <= filter.endDate!);
  if (filter.searchText) {
    const q = filter.searchText.toLowerCase();
    rows = rows.filter((t) => t.note.toLowerCase().includes(q));
  }

  rows.sort((a, b) => (b.date === a.date ? b.id - a.id : b.date.localeCompare(a.date)));
  return rows;
}

export async function getDatabase(): Promise<{ ready: true }> {
  ensureReady();
  return { ready: true };
}

// --- Categories ---

export async function getCategories(type?: CategoryType): Promise<Category[]> {
  const data = ensureReady();
  let rows = [...data.categories];
  if (type) rows = rows.filter((c) => c.type === type);
  rows.sort((a, b) =>
    type ? a.name.localeCompare(b.name) : a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type)
  );
  return rows;
}

export async function createCategory(name: string, type: CategoryType): Promise<number> {
  const data = ensureReady();
  const id = data.nextCategoryId++;
  data.categories.push({ id, name: name.trim(), type });
  persist();
  return id;
}

export async function updateCategory(id: number, name: string): Promise<void> {
  const data = ensureReady();
  const cat = data.categories.find((c) => c.id === id);
  if (cat) {
    cat.name = name.trim();
    persist();
  }
}

export async function getCategoryTransactionCount(id: number): Promise<number> {
  const data = ensureReady();
  return data.transactions.filter((t) => t.category_id === id).length;
}

export async function deleteCategory(id: number): Promise<void> {
  const count = await getCategoryTransactionCount(id);
  if (count > 0) {
    throw new Error('CATEGORY_IN_USE');
  }
  const data = ensureReady();
  data.categories = data.categories.filter((c) => c.id !== id);
  persist();
}

// --- Transactions ---

export async function createTransaction(
  type: TransactionType,
  amount: number,
  categoryId: number,
  note: string,
  date: string
): Promise<number> {
  const data = ensureReady();
  const id = data.nextTransactionId++;
  data.transactions.push({
    id,
    type,
    amount,
    category_id: categoryId,
    note: note.trim(),
    date,
  });
  persist();
  return id;
}

export async function updateTransaction(
  id: number,
  amount: number,
  categoryId: number,
  note: string,
  date: string
): Promise<void> {
  const data = ensureReady();
  const tx = data.transactions.find((t) => t.id === id);
  if (tx) {
    tx.amount = amount;
    tx.category_id = categoryId;
    tx.note = note.trim();
    tx.date = date;
    persist();
  }
}

export async function deleteTransaction(id: number): Promise<void> {
  const data = ensureReady();
  data.transactions = data.transactions.filter((t) => t.id !== id);
  persist();
}

export async function getTransaction(id: number): Promise<Transaction | null> {
  const data = ensureReady();
  const tx = data.transactions.find((t) => t.id === id);
  return tx ? withCategoryName(tx) : null;
}

export async function getTransactions(filter: TransactionFilter = {}, limit?: number): Promise<Transaction[]> {
  const rows = filterTransactions(filter);
  return limit ? rows.slice(0, limit) : rows;
}

export async function getRecentTransactions(limit = 10): Promise<Transaction[]> {
  return getTransactions({}, limit);
}

export async function getMonthlyTotals(date: Date = new Date()): Promise<{
  income: number;
  expense: number;
  balance: number;
}> {
  const { start, end } = getMonthRange(date);
  const data = ensureReady();

  const monthIncome = data.transactions
    .filter((t) => t.type === 'income' && t.date >= start && t.date <= end)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = data.transactions
    .filter((t) => t.type === 'expense' && t.date >= start && t.date <= end)
    .reduce((sum, t) => sum + t.amount, 0);

  const allIncome = data.transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const allExpense = data.transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return {
    income: monthIncome,
    expense: monthExpense,
    balance: allIncome - allExpense,
  };
}

export async function getDailySummaries(year: number, month: number): Promise<DailySummary[]> {
  const data = ensureReady();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;

  const map = new Map<string, DailySummary>();
  for (const tx of data.transactions) {
    if (tx.date < start || tx.date > end) continue;
    const existing = map.get(tx.date) ?? { date: tx.date, income: 0, expense: 0 };
    if (tx.type === 'income') existing.income += tx.amount;
    else existing.expense += tx.amount;
    map.set(tx.date, existing);
  }
  return Array.from(map.values());
}

export async function getMonthlyReport(date: Date = new Date()): Promise<MonthlyReport> {
  const { start, end } = getMonthRange(date);
  const data = ensureReady();
  const totals = await getMonthlyTotals(date);

  const categoryTotals = new Map<string, number>();
  for (const tx of data.transactions) {
    if (tx.type !== 'expense' || tx.date < start || tx.date > end) continue;
    const name = getCategoryName(tx.category_id) ?? '—';
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + tx.amount);
  }

  const categoryRows = Array.from(categoryTotals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const dailyMap = new Map<string, number>();
  for (const tx of data.transactions) {
    if (tx.type !== 'expense' || tx.date < start || tx.date > end) continue;
    dailyMap.set(tx.date, (dailyMap.get(tx.date) ?? 0) + tx.amount);
  }
  const dailyRows = Array.from(dailyMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const avgDaily = totals.expense / daysInMonth;

  return {
    totalIncome: totals.income,
    totalExpense: totals.expense,
    netBalance: totals.income - totals.expense,
    categoryBreakdown: categoryRows.map((row, i) => ({
      name: row.name,
      amount: row.amount,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    dailySpending: dailyRows,
    mostExpensiveCategory: categoryRows[0]?.name ?? '—',
    averageDailySpending: avgDaily,
  };
}

// --- Debts ---

export async function createDebt(
  personName: string,
  amount: number,
  date: string,
  dueDate: string | null,
  note: string,
  debtType: DebtType
): Promise<number> {
  const data = ensureReady();
  const id = data.nextDebtId++;
  data.debts.push({
    id,
    person_name: personName.trim(),
    amount,
    paid_amount: 0,
    date,
    due_date: dueDate,
    note: note.trim(),
    status: 'active',
    debt_type: debtType,
  });
  persist();
  return id;
}

export async function updateDebt(
  id: number,
  personName: string,
  amount: number,
  date: string,
  dueDate: string | null,
  note: string
): Promise<void> {
  const data = ensureReady();
  const debt = data.debts.find((d) => d.id === id);
  if (debt) {
    debt.person_name = personName.trim();
    debt.amount = amount;
    debt.date = date;
    debt.due_date = dueDate;
    debt.note = note.trim();
    persist();
  }
}

export async function deleteDebt(id: number): Promise<void> {
  const data = ensureReady();
  data.debts = data.debts.filter((d) => d.id !== id);
  persist();
}

export async function getDebt(id: number): Promise<Debt | null> {
  const data = ensureReady();
  return data.debts.find((d) => d.id === id) ?? null;
}

export async function getDebts(status?: DebtStatus, debtType?: DebtType): Promise<Debt[]> {
  const data = ensureReady();
  let rows = [...data.debts];
  if (status) rows = rows.filter((d) => d.status === status);
  if (debtType) rows = rows.filter((d) => d.debt_type === debtType);
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows;
}

export async function markDebtPaid(id: number): Promise<void> {
  const data = ensureReady();
  const debt = data.debts.find((d) => d.id === id);
  if (!debt) return;
  debt.paid_amount = debt.amount;
  debt.status = 'paid';
  persist();
}

export async function addDebtPayment(id: number, payment: number): Promise<void> {
  const data = ensureReady();
  const debt = data.debts.find((d) => d.id === id);
  if (!debt) return;
  const newPaid = Math.min(debt.paid_amount + payment, debt.amount);
  debt.paid_amount = newPaid;
  debt.status = newPaid >= debt.amount ? 'paid' : 'active';
  persist();
}

// --- Savings Goals ---

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const data = ensureReady();
  return [...data.savings_goals].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getSavingsGoal(id: number): Promise<SavingsGoal | null> {
  const data = ensureReady();
  return data.savings_goals.find((g) => g.id === id) ?? null;
}

export async function createSavingsGoal(
  name: string,
  targetAmount: number,
  deadline: string | null,
  createdAt: string
): Promise<number> {
  const data = ensureReady();
  const id = data.nextSavingsId++;
  data.savings_goals.push({
    id,
    name: name.trim(),
    target_amount: targetAmount,
    current_amount: 0,
    deadline,
    created_at: createdAt,
  });
  persist();
  return id;
}

export async function updateSavingsGoal(
  id: number,
  name: string,
  targetAmount: number,
  deadline: string | null
): Promise<void> {
  const data = ensureReady();
  const goal = data.savings_goals.find((g) => g.id === id);
  if (goal) {
    goal.name = name.trim();
    goal.target_amount = targetAmount;
    goal.deadline = deadline;
    persist();
  }
}

export async function deleteSavingsGoal(id: number): Promise<void> {
  const data = ensureReady();
  data.savings_goals = data.savings_goals.filter((g) => g.id !== id);
  persist();
}

export async function addSavingsContribution(id: number, amount: number): Promise<void> {
  const data = ensureReady();
  const goal = data.savings_goals.find((g) => g.id === id);
  if (!goal) return;
  goal.current_amount = Math.min(goal.current_amount + amount, goal.target_amount);
  persist();
}

// --- Budgets ---

export async function getBudgets(month?: string): Promise<Budget[]> {
  const data = ensureReady();
  const targetMonth = month ?? toMonthKey();
  return data.budgets
    .filter((b) => b.month === targetMonth)
    .map((b) => ({ ...b, category_name: getCategoryName(b.category_id) }))
    .sort((a, b) => (a.category_name ?? '').localeCompare(b.category_name ?? ''));
}

export async function setBudget(categoryId: number, month: string, limitAmount: number): Promise<void> {
  const data = ensureReady();
  const existing = data.budgets.find((b) => b.category_id === categoryId && b.month === month);
  if (existing) {
    existing.limit_amount = limitAmount;
  } else {
    data.budgets.push({
      id: data.nextBudgetId++,
      category_id: categoryId,
      month,
      limit_amount: limitAmount,
    });
  }
  persist();
}

export async function deleteBudget(id: number): Promise<void> {
  const data = ensureReady();
  data.budgets = data.budgets.filter((b) => b.id !== id);
  persist();
}

export async function getBudgetStatuses(month?: string): Promise<BudgetStatus[]> {
  const data = ensureReady();
  const targetMonth = month ?? toMonthKey();
  const { start, end } = getMonthRange(new Date(`${targetMonth}-01`));
  const budgets = await getBudgets(targetMonth);

  return budgets.map((budget) => {
    const spent = data.transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category_id === budget.category_id &&
          t.date >= start &&
          t.date <= end
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      categoryId: budget.category_id,
      categoryName: budget.category_name ?? '—',
      month: targetMonth,
      limit: budget.limit_amount,
      spent,
    };
  });
}

// --- Recurring transactions ---

export async function getRecurringTransactions(activeOnly = false): Promise<RecurringTransaction[]> {
  const data = ensureReady();
  const items = data.recurring_transactions
    .filter((r) => !activeOnly || r.is_active === 1)
    .map((r) => ({
      ...r,
      category_name: data.categories.find((c) => c.id === r.category_id)?.name,
    }));
  return items.sort((a, b) => {
    if (a.is_active !== b.is_active) return b.is_active - a.is_active;
    return a.next_run_date.localeCompare(b.next_run_date);
  });
}

export async function getRecurringTransaction(id: number): Promise<RecurringTransaction | null> {
  const data = ensureReady();
  const item = data.recurring_transactions.find((r) => r.id === id);
  if (!item) return null;
  return {
    ...item,
    category_name: data.categories.find((c) => c.id === item.category_id)?.name,
  };
}

export async function createRecurringTransaction(
  type: TransactionType,
  amount: number,
  categoryId: number,
  note: string,
  frequency: RecurringFrequency,
  startDate: string,
  endDate: string | null
): Promise<number> {
  const data = ensureReady();
  const id = data.nextRecurringId++;
  data.recurring_transactions.push({
    id,
    type,
    amount,
    category_id: categoryId,
    note,
    frequency,
    start_date: startDate,
    next_run_date: startDate,
    end_date: endDate,
    is_active: 1,
  });
  persist();
  return id;
}

export async function updateRecurringTransaction(
  id: number,
  type: TransactionType,
  amount: number,
  categoryId: number,
  note: string,
  frequency: RecurringFrequency,
  nextRunDate: string,
  endDate: string | null,
  isActive: boolean
): Promise<void> {
  const data = ensureReady();
  const item = data.recurring_transactions.find((r) => r.id === id);
  if (!item) return;
  Object.assign(item, {
    type,
    amount,
    category_id: categoryId,
    note,
    frequency,
    next_run_date: nextRunDate,
    end_date: endDate,
    is_active: isActive ? 1 : 0,
  });
  persist();
}

export async function deleteRecurringTransaction(id: number): Promise<void> {
  const data = ensureReady();
  data.recurring_transactions = data.recurring_transactions.filter((r) => r.id !== id);
  persist();
}

export async function processDueRecurringTransactions(): Promise<number> {
  const data = ensureReady();
  const today = toDateString();
  const due = data.recurring_transactions.filter(
    (r) => r.is_active === 1 && r.next_run_date <= today
  );

  let processed = 0;
  for (const item of due) {
    const note = item.note || '';
    await createTransaction(item.type, item.amount, item.category_id, note, item.next_run_date);

    const nextDate = advanceRecurringDate(item.next_run_date, item.frequency);
    item.next_run_date = nextDate;
    if (item.end_date && nextDate > item.end_date) {
      item.is_active = 0;
    }
    processed += 1;
  }

  if (processed > 0) persist();
  return processed;
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
  const data = ensureReady();
  return data.settings[key] ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const data = ensureReady();
  data.settings[key] = value;
  persist();
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const data = ensureReady();
  return { ...data.settings };
}

// --- Backup ---

export async function exportBackup(): Promise<BackupData> {
  const data = ensureReady();
  return {
    version: 2,
    exported_at: new Date().toISOString(),
    categories: [...data.categories],
    transactions: [...data.transactions],
    debts: [...data.debts],
    savings_goals: [...data.savings_goals],
    budgets: data.budgets.map(({ id, category_id, month, limit_amount }) => ({
      id,
      category_id,
      month,
      limit_amount,
    })),
    recurring_transactions: data.recurring_transactions.map(
      ({ id, type, amount, category_id, note, frequency, start_date, next_run_date, end_date, is_active }) => ({
        id, type, amount, category_id, note, frequency, start_date, next_run_date, end_date, is_active,
      })
    ),
    settings: { ...data.settings },
  };
}

export async function importBackup(backup: BackupData): Promise<void> {
  if (backup.version !== 1 && backup.version !== 2) throw new Error('UNSUPPORTED_VERSION');

  const nextId = (items: { id: number }[]) =>
    items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;

  store = {
    categories: [...backup.categories],
    transactions: [...backup.transactions],
    debts: [...backup.debts],
    savings_goals: [...backup.savings_goals],
    budgets: backup.budgets.map((b) => ({ ...b })),
    recurring_transactions: (backup.recurring_transactions ?? []).map((r) => ({ ...r })),
    settings: { ...backup.settings },
    nextCategoryId: nextId(backup.categories),
    nextTransactionId: nextId(backup.transactions),
    nextDebtId: nextId(backup.debts),
    nextSavingsId: nextId(backup.savings_goals),
    nextBudgetId: nextId(backup.budgets),
    nextRecurringId: nextId(backup.recurring_transactions ?? []),
  };
  persist();
}

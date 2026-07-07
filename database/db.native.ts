import * as SQLite from 'expo-sqlite';
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

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('yondaftarcha.db');
    await initDatabase(db);
  }
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      note TEXT DEFAULT '',
      date TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_name TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      date TEXT NOT NULL,
      due_date TEXT,
      note TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paid')),
      debt_type TEXT NOT NULL CHECK(debt_type IN ('borrowed', 'lent'))
    );
    CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      UNIQUE(category_id, month)
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      note TEXT DEFAULT '',
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
      start_date TEXT NOT NULL,
      next_run_date TEXT NOT NULL,
      end_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  const count = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (count && count.count === 0) {
    for (const cat of [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
      await database.runAsync(
        'INSERT INTO categories (name, type) VALUES (?, ?)',
        [cat.name, cat.type]
      );
    }
  }
}

// --- Categories ---

export async function getCategories(type?: CategoryType): Promise<Category[]> {
  const database = await getDatabase();
  if (type) {
    return database.getAllAsync<Category>(
      'SELECT * FROM categories WHERE type = ? ORDER BY name',
      [type]
    );
  }
  return database.getAllAsync<Category>('SELECT * FROM categories ORDER BY type, name');
}

export async function createCategory(name: string, type: CategoryType): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO categories (name, type) VALUES (?, ?)',
    [name.trim(), type]
  );
  return result.lastInsertRowId;
}

export async function updateCategory(id: number, name: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE categories SET name = ? WHERE id = ?', [name.trim(), id]);
}

export async function getCategoryTransactionCount(id: number): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
    [id]
  );
  return row?.count ?? 0;
}

export async function deleteCategory(id: number): Promise<void> {
  const count = await getCategoryTransactionCount(id);
  if (count > 0) {
    throw new Error('CATEGORY_IN_USE');
  }
  const database = await getDatabase();
  await database.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

// --- Transactions ---

export async function createTransaction(
  type: TransactionType,
  amount: number,
  categoryId: number,
  note: string,
  date: string
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO transactions (type, amount, category_id, note, date) VALUES (?, ?, ?, ?, ?)',
    [type, amount, categoryId, note.trim(), date]
  );
  return result.lastInsertRowId;
}

export async function updateTransaction(
  id: number,
  amount: number,
  categoryId: number,
  note: string,
  date: string
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE transactions SET amount = ?, category_id = ?, note = ?, date = ? WHERE id = ?',
    [amount, categoryId, note.trim(), date, id]
  );
}

export async function deleteTransaction(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getTransaction(id: number): Promise<Transaction | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Transaction>(
    `SELECT t.*, c.name as category_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id]
  );
}

function buildTransactionQuery(filter: TransactionFilter): { sql: string; params: (string | number)[] } {
  let sql = `SELECT t.*, c.name as category_name
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE 1=1`;
  const params: (string | number)[] = [];

  if (filter.type) {
    sql += ' AND t.type = ?';
    params.push(filter.type);
  }
  if (filter.categoryId) {
    sql += ' AND t.category_id = ?';
    params.push(filter.categoryId);
  }
  if (filter.startDate) {
    sql += ' AND t.date >= ?';
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    sql += ' AND t.date <= ?';
    params.push(filter.endDate);
  }
  if (filter.searchText) {
    sql += ' AND t.note LIKE ?';
    params.push(`%${filter.searchText}%`);
  }

  sql += ' ORDER BY t.date DESC, t.id DESC';
  return { sql, params };
}

export async function getTransactions(filter: TransactionFilter = {}, limit?: number): Promise<Transaction[]> {
  const database = await getDatabase();
  const { sql, params } = buildTransactionQuery(filter);
  const finalSql = limit ? `${sql} LIMIT ?` : sql;
  const finalParams = limit ? [...params, limit] : params;
  return database.getAllAsync<Transaction>(finalSql, finalParams);
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
  const database = await getDatabase();

  const income = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE type = 'income' AND date >= ? AND date <= ?`,
    [start, end]
  );
  const expense = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE type = 'expense' AND date >= ? AND date <= ?`,
    [start, end]
  );

  const incomeTotal = income?.total ?? 0;
  const expenseTotal = expense?.total ?? 0;

  const allIncome = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'`
  );
  const allExpense = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`
  );

  return {
    income: incomeTotal,
    expense: expenseTotal,
    balance: (allIncome?.total ?? 0) - (allExpense?.total ?? 0),
  };
}

export async function getDailySummaries(year: number, month: number): Promise<DailySummary[]> {
  const database = await getDatabase();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;

  const rows = await database.getAllAsync<{ date: string; type: string; total: number }>(
    `SELECT date, type, SUM(amount) as total
     FROM transactions
     WHERE date >= ? AND date <= ?
     GROUP BY date, type`,
    [start, end]
  );

  const map = new Map<string, DailySummary>();
  for (const row of rows) {
    const existing = map.get(row.date) ?? { date: row.date, income: 0, expense: 0 };
    if (row.type === 'income') existing.income = row.total;
    else existing.expense = row.total;
    map.set(row.date, existing);
  }
  return Array.from(map.values());
}

export async function getMonthlyReport(date: Date = new Date()): Promise<MonthlyReport> {
  const { start, end } = getMonthRange(date);
  const database = await getDatabase();

  const totals = await getMonthlyTotals(date);

  const categoryRows = await database.getAllAsync<{ name: string; amount: number }>(
    `SELECT c.name, SUM(t.amount) as amount
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY c.id
     ORDER BY amount DESC`,
    [start, end]
  );

  const dailyRows = await database.getAllAsync<{ date: string; amount: number }>(
    `SELECT date, SUM(amount) as amount
     FROM transactions
     WHERE type = 'expense' AND date >= ? AND date <= ?
     GROUP BY date
     ORDER BY date`,
    [start, end]
  );

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
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO debts (person_name, amount, paid_amount, date, due_date, note, status, debt_type)
     VALUES (?, ?, 0, ?, ?, ?, 'active', ?)`,
    [personName.trim(), amount, date, dueDate, note.trim(), debtType]
  );
  return result.lastInsertRowId;
}

export async function updateDebt(
  id: number,
  personName: string,
  amount: number,
  date: string,
  dueDate: string | null,
  note: string
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE debts SET person_name = ?, amount = ?, date = ?, due_date = ?, note = ? WHERE id = ?`,
    [personName.trim(), amount, date, dueDate, note.trim(), id]
  );
}

export async function deleteDebt(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM debts WHERE id = ?', [id]);
}

export async function getDebt(id: number): Promise<Debt | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Debt>('SELECT * FROM debts WHERE id = ?', [id]);
}

export async function getDebts(status?: DebtStatus, debtType?: DebtType): Promise<Debt[]> {
  const database = await getDatabase();
  let sql = 'SELECT * FROM debts WHERE 1=1';
  const params: string[] = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (debtType) {
    sql += ' AND debt_type = ?';
    params.push(debtType);
  }

  sql += ' ORDER BY date DESC';
  return database.getAllAsync<Debt>(sql, params);
}

export async function markDebtPaid(id: number): Promise<void> {
  const database = await getDatabase();
  const debt = await getDebt(id);
  if (!debt) return;
  await database.runAsync(
    'UPDATE debts SET paid_amount = ?, status = ? WHERE id = ?',
    [debt.amount, 'paid', id]
  );
}

export async function addDebtPayment(id: number, payment: number): Promise<void> {
  const database = await getDatabase();
  const debt = await getDebt(id);
  if (!debt) return;
  const newPaid = Math.min(debt.paid_amount + payment, debt.amount);
  const status: DebtStatus = newPaid >= debt.amount ? 'paid' : 'active';
  await database.runAsync(
    'UPDATE debts SET paid_amount = ?, status = ? WHERE id = ?',
    [newPaid, status, id]
  );
}

// --- Savings Goals ---

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const database = await getDatabase();
  return database.getAllAsync<SavingsGoal>(
    'SELECT * FROM savings_goals ORDER BY created_at DESC'
  );
}

export async function getSavingsGoal(id: number): Promise<SavingsGoal | null> {
  const database = await getDatabase();
  return database.getFirstAsync<SavingsGoal>('SELECT * FROM savings_goals WHERE id = ?', [id]);
}

export async function createSavingsGoal(
  name: string,
  targetAmount: number,
  deadline: string | null,
  createdAt: string
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO savings_goals (name, target_amount, current_amount, deadline, created_at) VALUES (?, ?, 0, ?, ?)',
    [name.trim(), targetAmount, deadline, createdAt]
  );
  return result.lastInsertRowId;
}

export async function updateSavingsGoal(
  id: number,
  name: string,
  targetAmount: number,
  deadline: string | null
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE savings_goals SET name = ?, target_amount = ?, deadline = ? WHERE id = ?',
    [name.trim(), targetAmount, deadline, id]
  );
}

export async function deleteSavingsGoal(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM savings_goals WHERE id = ?', [id]);
}

export async function addSavingsContribution(id: number, amount: number): Promise<void> {
  const database = await getDatabase();
  const goal = await getSavingsGoal(id);
  if (!goal) return;
  const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);
  await database.runAsync(
    'UPDATE savings_goals SET current_amount = ? WHERE id = ?',
    [newAmount, id]
  );
}

// --- Budgets ---

export async function getBudgets(month?: string): Promise<Budget[]> {
  const database = await getDatabase();
  const targetMonth = month ?? toMonthKey();
  return database.getAllAsync<Budget>(
    `SELECT b.*, c.name as category_name
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.month = ?
     ORDER BY c.name`,
    [targetMonth]
  );
}

export async function setBudget(categoryId: number, month: string, limitAmount: number): Promise<void> {
  const database = await getDatabase();
  const existing = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM budgets WHERE category_id = ? AND month = ?',
    [categoryId, month]
  );
  if (existing) {
    await database.runAsync(
      'UPDATE budgets SET limit_amount = ? WHERE id = ?',
      [limitAmount, existing.id]
    );
  } else {
    await database.runAsync(
      'INSERT INTO budgets (category_id, month, limit_amount) VALUES (?, ?, ?)',
      [categoryId, month, limitAmount]
    );
  }
}

export async function deleteBudget(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
}

export async function getBudgetStatuses(month?: string): Promise<BudgetStatus[]> {
  const database = await getDatabase();
  const targetMonth = month ?? toMonthKey();
  const { start, end } = getMonthRange(new Date(`${targetMonth}-01`));

  const budgets = await getBudgets(targetMonth);
  const statuses: BudgetStatus[] = [];

  for (const budget of budgets) {
    const spent = await database.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE type = 'expense' AND category_id = ? AND date >= ? AND date <= ?`,
      [budget.category_id, start, end]
    );
    statuses.push({
      categoryId: budget.category_id,
      categoryName: budget.category_name ?? '—',
      month: targetMonth,
      limit: budget.limit_amount,
      spent: spent?.total ?? 0,
    });
  }

  return statuses;
}

// --- Recurring transactions ---

export async function getRecurringTransactions(activeOnly = false): Promise<RecurringTransaction[]> {
  const database = await getDatabase();
  const query = activeOnly
    ? `SELECT r.*, c.name as category_name
       FROM recurring_transactions r
       JOIN categories c ON r.category_id = c.id
       WHERE r.is_active = 1
       ORDER BY r.next_run_date`
    : `SELECT r.*, c.name as category_name
       FROM recurring_transactions r
       JOIN categories c ON r.category_id = c.id
       ORDER BY r.is_active DESC, r.next_run_date`;
  return database.getAllAsync<RecurringTransaction>(query);
}

export async function getRecurringTransaction(id: number): Promise<RecurringTransaction | null> {
  const database = await getDatabase();
  return (
    (await database.getFirstAsync<RecurringTransaction>(
      `SELECT r.*, c.name as category_name
       FROM recurring_transactions r
       JOIN categories c ON r.category_id = c.id
       WHERE r.id = ?`,
      [id]
    )) ?? null
  );
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
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO recurring_transactions
     (type, amount, category_id, note, frequency, start_date, next_run_date, end_date, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [type, amount, categoryId, note, frequency, startDate, startDate, endDate]
  );
  return result.lastInsertRowId;
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
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE recurring_transactions
     SET type = ?, amount = ?, category_id = ?, note = ?, frequency = ?,
         next_run_date = ?, end_date = ?, is_active = ?
     WHERE id = ?`,
    [type, amount, categoryId, note, frequency, nextRunDate, endDate, isActive ? 1 : 0, id]
  );
}

export async function deleteRecurringTransaction(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM recurring_transactions WHERE id = ?', [id]);
}

export async function processDueRecurringTransactions(): Promise<number> {
  const database = await getDatabase();
  const today = toDateString();
  const due = await database.getAllAsync<RecurringTransaction>(
    `SELECT * FROM recurring_transactions
     WHERE is_active = 1 AND next_run_date <= ?`,
    [today]
  );

  let processed = 0;
  for (const item of due) {
    const note = item.note || '';
    await createTransaction(item.type, item.amount, item.category_id, note, item.next_run_date);

    let nextDate = advanceRecurringDate(item.next_run_date, item.frequency);
    let isActive = 1;
    if (item.end_date && nextDate > item.end_date) {
      isActive = 0;
    }

    await database.runAsync(
      'UPDATE recurring_transactions SET next_run_date = ?, is_active = ? WHERE id = ?',
      [nextDate, isActive, item.id]
    );
    processed += 1;
  }

  return processed;
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings'
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// --- Backup ---

export async function exportBackup(): Promise<BackupData> {
  const database = await getDatabase();
  const categories = await getCategories();
  const transactions = await database.getAllAsync<Omit<Transaction, 'category_name'>>(
    'SELECT id, type, amount, category_id, note, date FROM transactions ORDER BY id'
  );
  const debts = await database.getAllAsync<Debt>('SELECT * FROM debts ORDER BY id');
  const savings_goals = await getSavingsGoals();
  const budgets = await database.getAllAsync<Budget>(
    'SELECT id, category_id, month, limit_amount FROM budgets ORDER BY id'
  );
  const recurring_transactions = await database.getAllAsync<RecurringTransaction>(
    'SELECT id, type, amount, category_id, note, frequency, start_date, next_run_date, end_date, is_active FROM recurring_transactions ORDER BY id'
  );
  const settings = await getAllSettings();

  return {
    version: 2,
    exported_at: new Date().toISOString(),
    categories,
    transactions,
    debts,
    savings_goals,
    budgets,
    recurring_transactions,
    settings,
  };
}

async function updateSequence(database: SQLite.SQLiteDatabase, table: string): Promise<void> {
  await database.runAsync(
    `UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM ${table}) WHERE name = ?`,
    [table]
  );
}

export async function importBackup(data: BackupData): Promise<void> {
  if (data.version !== 1 && data.version !== 2) throw new Error('UNSUPPORTED_VERSION');

  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM transactions;
    DELETE FROM recurring_transactions;
    DELETE FROM budgets;
    DELETE FROM debts;
    DELETE FROM savings_goals;
    DELETE FROM categories;
    DELETE FROM app_settings;
  `);

  for (const cat of data.categories) {
    await database.runAsync(
      'INSERT INTO categories (id, name, type) VALUES (?, ?, ?)',
      [cat.id, cat.name, cat.type]
    );
  }
  for (const tx of data.transactions) {
    await database.runAsync(
      'INSERT INTO transactions (id, type, amount, category_id, note, date) VALUES (?, ?, ?, ?, ?, ?)',
      [tx.id, tx.type, tx.amount, tx.category_id, tx.note, tx.date]
    );
  }
  for (const debt of data.debts) {
    await database.runAsync(
      `INSERT INTO debts (id, person_name, amount, paid_amount, date, due_date, note, status, debt_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        debt.id, debt.person_name, debt.amount, debt.paid_amount,
        debt.date, debt.due_date, debt.note, debt.status, debt.debt_type,
      ]
    );
  }
  for (const goal of data.savings_goals) {
    await database.runAsync(
      `INSERT INTO savings_goals (id, name, target_amount, current_amount, deadline, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [goal.id, goal.name, goal.target_amount, goal.current_amount, goal.deadline, goal.created_at]
    );
  }
  for (const budget of data.budgets) {
    await database.runAsync(
      'INSERT INTO budgets (id, category_id, month, limit_amount) VALUES (?, ?, ?, ?)',
      [budget.id, budget.category_id, budget.month, budget.limit_amount]
    );
  }
  for (const recurring of data.recurring_transactions ?? []) {
    await database.runAsync(
      `INSERT INTO recurring_transactions
       (id, type, amount, category_id, note, frequency, start_date, next_run_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recurring.id, recurring.type, recurring.amount, recurring.category_id, recurring.note,
        recurring.frequency, recurring.start_date, recurring.next_run_date, recurring.end_date,
        recurring.is_active,
      ]
    );
  }
  for (const [key, value] of Object.entries(data.settings)) {
    await setSetting(key, value);
  }

  for (const table of ['categories', 'transactions', 'debts', 'savings_goals', 'budgets', 'recurring_transactions']) {
    await updateSequence(database, table);
  }
}

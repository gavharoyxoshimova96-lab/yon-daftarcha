export type TransactionType = 'income' | 'expense';
export type CategoryType = 'income' | 'expense';
export type DebtType = 'borrowed' | 'lent';
export type DebtStatus = 'active' | 'paid';

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category_id: number;
  note: string;
  date: string;
  category_name?: string;
}

export interface Debt {
  id: number;
  person_name: string;
  amount: number;
  paid_amount: number;
  date: string;
  due_date: string | null;
  note: string;
  status: DebtStatus;
  debt_type: DebtType;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
}

export interface Budget {
  id: number;
  category_id: number;
  month: string;
  limit_amount: number;
  category_name?: string;
}

export interface BudgetStatus {
  categoryId: number;
  categoryName: string;
  month: string;
  limit: number;
  spent: number;
}

export interface DailySummary {
  date: string;
  income: number;
  expense: number;
}

export interface MonthlyReport {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryBreakdown: { name: string; amount: number; color: string }[];
  dailySpending: { date: string; amount: number }[];
  mostExpensiveCategory: string;
  averageDailySpending: number;
}

export interface TransactionFilter {
  type?: TransactionType;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  searchText?: string;
}

export interface BackupData {
  version: 1;
  exported_at: string;
  categories: Category[];
  transactions: Omit<Transaction, 'category_name'>[];
  debts: Debt[];
  savings_goals: SavingsGoal[];
  budgets: Budget[];
  settings: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface FinancialContext {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netMonthly: number;
  topExpenses: { name: string; amount: number }[];
  activeDebtCount: number;
  totalDebtRemaining: number;
  savingsProgress: { name: string; percent: number; remaining: number }[];
  budgetAlerts: string[];
  monthName: string;
}

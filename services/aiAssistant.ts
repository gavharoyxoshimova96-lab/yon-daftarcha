import {
  getBudgetStatuses,
  getDebts,
  getMonthlyReport,
  getMonthlyTotals,
  getSavingsGoals,
} from '@/database';
import { FinancialContext } from '@/types';
import { formatCurrency } from '@/utils/format';
import { getMonthName } from '@/utils/date';

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[''`]/g, "'");
}

export async function buildFinancialContext(): Promise<FinancialContext> {
  const [totals, report, debts, goals, budgetStatuses] = await Promise.all([
    getMonthlyTotals(),
    getMonthlyReport(),
    getDebts('active'),
    getSavingsGoals(),
    getBudgetStatuses(),
  ]);

  const totalDebtRemaining = debts.reduce(
    (sum, d) => sum + (d.amount - d.paid_amount),
    0
  );

  return {
    balance: totals.balance,
    monthlyIncome: totals.income,
    monthlyExpense: totals.expense,
    netMonthly: totals.income - totals.expense,
    topExpenses: report.categoryBreakdown.slice(0, 5).map((c) => ({
      name: c.name,
      amount: c.amount,
    })),
    activeDebtCount: debts.length,
    totalDebtRemaining,
    savingsProgress: goals.map((g) => ({
      name: g.name,
      percent: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
      remaining: Math.max(0, g.target_amount - g.current_amount),
    })),
    budgetAlerts: budgetStatuses
      .filter((s) => s.limit > 0 && s.spent > s.limit)
      .map((s) => `${s.categoryName} (${Math.round((s.spent / s.limit) * 100)}%)`),
    monthName: getMonthName(),
  };
}

export async function getWelcomeMessage(): Promise<string> {
  const ctx = await buildFinancialContext();
  const parts: string[] = [`Salom! Men sizning moliyaviy yordamchingizman.`];

  if (ctx.netMonthly >= 0) {
    parts.push(
      `${ctx.monthName} oyida sof foyda ${formatCurrency(ctx.netMonthly)} — yaxshi natija!`
    );
  } else {
    parts.push(
      `${ctx.monthName} oyida xarajatlar kirimdan ${formatCurrency(Math.abs(ctx.netMonthly))} ko'p. Ehtiyot bo'ling.`
    );
  }

  if (ctx.budgetAlerts.length > 0) {
    parts.push(`Diqqat: ${ctx.budgetAlerts.length} ta kategoriyada byudjet oshgan.`);
  }

  if (ctx.activeDebtCount > 0) {
    parts.push(`Faol qarzlar: ${ctx.activeDebtCount} ta, qolgan ${formatCurrency(ctx.totalDebtRemaining)}.`);
  }

  parts.push(`Savol bering yoki tezkor tugmalardan foydalaning.`);
  return parts.join('\n\n');
}

function monthlySummary(ctx: FinancialContext): string {
  return [
    `📊 ${ctx.monthName} oyi xulosasi:`,
    `• Kirim: ${formatCurrency(ctx.monthlyIncome)}`,
    `• Chiqim: ${formatCurrency(ctx.monthlyExpense)}`,
    `• Sof balans: ${formatCurrency(ctx.netMonthly)}`,
    `• Umumiy balans: ${formatCurrency(ctx.balance)}`,
  ].join('\n');
}

function expenseBreakdown(ctx: FinancialContext): string {
  if (ctx.topExpenses.length === 0) {
    return 'Bu oy hali chiqimlar qayd etilmagan.';
  }
  const lines = ctx.topExpenses.map(
    (c, i) => `${i + 1}. ${c.name} — ${formatCurrency(c.amount)}`
  );
  return `Eng ko'p sarflangan kategoriyalar:\n${lines.join('\n')}`;
}

function debtSummary(ctx: FinancialContext): string {
  if (ctx.activeDebtCount === 0) {
    return 'Hozircha faol qarzlaringiz yo\'q. Ajoyib!';
  }
  return [
    `Qarzlar holati:`,
    `• Faol qarzlar: ${ctx.activeDebtCount} ta`,
    `• To'lanishi kerak: ${formatCurrency(ctx.totalDebtRemaining)}`,
    `Maslahat: muddatli qarzlarni avval to'lang.`,
  ].join('\n');
}

function budgetSummary(ctx: FinancialContext): string {
  if (ctx.budgetAlerts.length === 0) {
    return 'Barcha byudjetlar nazorat ostida. Yaxshi ishlayapsiz!';
  }
  return `Byudjet oshgan kategoriyalar:\n• ${ctx.budgetAlerts.join('\n• ')}\n\nKeyingi oy uchun limitlarni qayta ko'rib chiqing.`;
}

function savingsSummary(ctx: FinancialContext): string {
  if (ctx.savingsProgress.length === 0) {
    return 'Jamg\'arma maqsadlari hali yo\'q. "Ko\'proq" bo\'limidan maqsad qo\'shing.';
  }
  const lines = ctx.savingsProgress.map(
    (g) => `• ${g.name}: ${g.percent}% (qolgan ${formatCurrency(g.remaining)})`
  );
  return `Jamg'arma maqsadlari:\n${lines.join('\n')}`;
}

function generateAdvice(ctx: FinancialContext): string {
  const tips: string[] = [];

  if (ctx.netMonthly < 0) {
    tips.push('Chiqimlarni kamaytiring yoki qo\'shimcha kirim manbalarini qidiring.');
  }
  if (ctx.topExpenses[0]) {
    tips.push(`"${ctx.topExpenses[0].name}" eng katta xarajat — bu yerda tejash imkoniyatini qidiring.`);
  }
  if (ctx.budgetAlerts.length > 0) {
    tips.push('Byudjet oshgan kategoriyalarda 1 hafta xarajatlarni qayd qilib kuzating.');
  }
  if (ctx.totalDebtRemaining > ctx.monthlyIncome * 0.5 && ctx.monthlyIncome > 0) {
    tips.push('Qarz yuki baland — har oy ma\'lum summani qarzga ajrating.');
  }
  if (ctx.savingsProgress.some((g) => g.percent < 30)) {
    tips.push('Jamg\'arma maqsadlariga kichik, lekin muntazam to\'lovlar qiling.');
  }
  if (tips.length === 0) {
    tips.push('Moliyaviy holatingiz barqaror. Xarajatlarni yozib borishda davom eting.');
  }

  return `💡 Maslahatlarim:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
}

export async function answerLocally(question: string, ctx?: FinancialContext): Promise<string> {
  const context = ctx ?? (await buildFinancialContext());
  const q = normalize(question);

  if (/xulosa|hisobot|holat|summary|bu oy/.test(q)) {
    return monthlySummary(context);
  }
  if (/chiqim|xarajat|sarfl/.test(q) && !/kirim/.test(q)) {
    return `Bu oy chiqim: ${formatCurrency(context.monthlyExpense)}\n\n${expenseBreakdown(context)}`;
  }
  if (/kirim|daromad|maosh/.test(q)) {
    return `Bu oy kirim: ${formatCurrency(context.monthlyIncome)}`;
  }
  if (/balans|qoldiq/.test(q)) {
    return `Umumiy balans: ${formatCurrency(context.balance)}\nBu oy sof: ${formatCurrency(context.netMonthly)}`;
  }
  if (/qarz/.test(q)) {
    return debtSummary(context);
  }
  if (/byudjet|limit/.test(q)) {
    return budgetSummary(context);
  }
  if (/jamg'arma|maqsad|tejash/.test(q)) {
    return savingsSummary(context);
  }
  if (/kategoriya|nima uchun|eng ko'p/.test(q)) {
    return expenseBreakdown(context);
  }
  if (/maslahat|tavsiya|nima qil|yordam/.test(q)) {
    return generateAdvice(context);
  }
  if (/salom|assalom|hello|hi/.test(q)) {
    return await getWelcomeMessage();
  }

  return [
    'Savolingizni to\'liq tushunmadim. Quyidagilarni so\'rashingiz mumkin:',
    '• "Bu oy xulosasi"',
    '• "Qarzlarim holati"',
    '• "Byudjet holati"',
    '• "Maslahat ber"',
    '• "Eng ko\'p nima uchun sarfladim?"',
  ].join('\n');
}

export const QUICK_QUESTIONS = [
  'Bu oy xulosasi',
  'Maslahat ber',
  'Qarzlarim holati',
  'Byudjet holati',
  'Eng ko\'p sarflanganlar',
];

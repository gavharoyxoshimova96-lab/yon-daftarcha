import { getSetting, setSetting } from '@/database';
import { FinancialContext } from '@/types';
import { formatCurrency } from '@/utils/format';

const API_KEY_SETTING = 'openai_api_key';

export async function getOpenAiApiKey(): Promise<string | null> {
  const key = await getSetting(API_KEY_SETTING);
  return key?.trim() || null;
}

export async function setOpenAiApiKey(key: string): Promise<void> {
  await setSetting(API_KEY_SETTING, key.trim());
}

export async function clearOpenAiApiKey(): Promise<void> {
  await setSetting(API_KEY_SETTING, '');
}

function buildSystemPrompt(ctx: FinancialContext): string {
  return `Sen "Yon Daftarcha" ilovasining O'zbek tilidagi moliyaviy yordamchisisan.
Faqat berilgan ma'lumotlar asosida javob ber. Raqamlarni aniq ko'rsat.
Qisqa, tushunarli va amaliy maslahatlar ber.

Foydalanuvchi moliyaviy ma'lumotlari:
- Umumiy balans: ${formatCurrency(ctx.balance)}
- Bu oy kirim: ${formatCurrency(ctx.monthlyIncome)}
- Bu oy chiqim: ${formatCurrency(ctx.monthlyExpense)}
- Bu oy sof: ${formatCurrency(ctx.netMonthly)}
- Faol qarzlar: ${ctx.activeDebtCount} ta, qolgan ${formatCurrency(ctx.totalDebtRemaining)}
- Byudjet ogohlantirishlari: ${ctx.budgetAlerts.join(', ') || 'yo\'q'}
- Top chiqimlar: ${ctx.topExpenses.map((e) => `${e.name} ${formatCurrency(e.amount)}`).join(', ') || 'yo\'q'}
- Jamg'arma: ${ctx.savingsProgress.map((s) => `${s.name} ${s.percent}%`).join(', ') || 'yo\'q'}`;
}

export async function askOpenAi(
  question: string,
  ctx: FinancialContext,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(ctx) },
        { role: 'user', content: question },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 401) throw new Error('INVALID_KEY');
    throw new Error(err || 'API_ERROR');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('EMPTY_RESPONSE');
  return content.trim();
}

export async function answerWithAi(
  question: string,
  ctx: FinancialContext
): Promise<string | null> {
  const apiKey = await getOpenAiApiKey();
  if (!apiKey) return null;
  try {
    return await askOpenAi(question, ctx, apiKey);
  } catch {
    return null;
  }
}

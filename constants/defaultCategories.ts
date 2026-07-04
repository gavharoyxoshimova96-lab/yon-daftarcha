import { CategoryType } from '@/types';

export const DEFAULT_EXPENSE_CATEGORIES: { name: string; type: CategoryType }[] = [
  { name: 'Bozorlik', type: 'expense' },
  { name: 'Kommunal', type: 'expense' },
  { name: "Bog'cha", type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: "Ta'lim", type: 'expense' },
  { name: "Sog'liq", type: 'expense' },
  { name: 'Kiyim', type: 'expense' },
  { name: 'Xayriya', type: 'expense' },
  { name: 'Boshqa', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: { name: string; type: CategoryType }[] = [
  { name: 'Maosh', type: 'income' },
  { name: 'Biznes', type: 'income' },
  { name: 'Sovg\'a', type: 'income' },
  { name: 'Boshqa', type: 'income' },
];

export const CHART_COLORS = [
  '#2E7D32',
  '#1976D2',
  '#F57C00',
  '#7B1FA2',
  '#C62828',
  '#00838F',
  '#558B2F',
  '#AD1457',
  '#4527A0',
  '#EF6C00',
];

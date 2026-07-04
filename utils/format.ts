export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + " so'm";
}

export function formatShortCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace('.0', '') + ' mln';
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + ' ming';
  }
  return String(Math.round(amount));
}

export function parseAmount(text: string): number {
  const cleaned = text.replace(/[^\d.]/g, '');
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

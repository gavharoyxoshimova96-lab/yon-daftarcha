import { LocaleConfig } from 'react-native-calendars';

import { AppLocale, TranslationSchema } from './types';
import { uz } from './locales/uz';
import { ru } from './locales/ru';
import { en } from './locales/en';

export const LOCALE_KEY = 'app_locale';

export const translations: Record<AppLocale, TranslationSchema> = { uz, ru, en };

export const localeLabels: Record<AppLocale, string> = {
  uz: uz.languages.uz,
  ru: uz.languages.ru,
  en: uz.languages.en,
};

function registerCalendarLocale(locale: AppLocale, t: TranslationSchema): void {
  LocaleConfig.locales[locale] = {
    monthNames: t.months,
    monthNamesShort: t.monthsShort,
    dayNames: t.calendarLocale.dayNames,
    dayNamesShort: t.calendarLocale.dayNamesShort,
    today: t.calendarLocale.today,
  };
}

for (const locale of ['uz', 'ru', 'en'] as AppLocale[]) {
  registerCalendarLocale(locale, translations[locale]);
}

let activeLocale: AppLocale = 'uz';

export function getActiveLocale(): AppLocale {
  return activeLocale;
}

export function configureCalendarLocale(locale: AppLocale): void {
  activeLocale = locale;
  LocaleConfig.defaultLocale = locale;
}

export function getMonthName(date: Date, locale: AppLocale): string {
  return translations[locale].months[date.getMonth()];
}

export function formatMonthYear(date: Date, locale: AppLocale): string {
  return `${getMonthName(date, locale)} ${date.getFullYear()}`;
}

export function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

export function translate(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>
): string {
  const value = getNestedValue(translations[locale], key);
  if (typeof value === 'string') {
    return interpolate(value, params);
  }
  return key;
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === 'uz' || value === 'ru' || value === 'en';
}

configureCalendarLocale('uz');

export type { AppLocale, TranslationSchema };

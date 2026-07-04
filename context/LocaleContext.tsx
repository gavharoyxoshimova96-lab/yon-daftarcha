import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getSetting, setSetting } from '@/database';
import {
  AppLocale,
  configureCalendarLocale,
  formatMonthYear as formatMonthYearI18n,
  getMonthName as getMonthNameI18n,
  isAppLocale,
  LOCALE_KEY,
  translate,
  translations,
} from '@/i18n';
import { TranslationSchema } from '@/i18n/types';

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  strings: TranslationSchema;
  getMonthName: (date?: Date) => string;
  formatMonthYear: (date?: Date) => string;
  ready: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('uz');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getSetting(LOCALE_KEY);
      const initial: AppLocale = isAppLocale(saved) ? saved : 'uz';
      configureCalendarLocale(initial);
      setLocaleState(initial);
      setReady(true);
    })();
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    await setSetting(LOCALE_KEY, next);
    configureCalendarLocale(next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const getMonthName = useCallback(
    (date: Date = new Date()) => getMonthNameI18n(date, locale),
    [locale]
  );

  const formatMonthYear = useCallback(
    (date: Date = new Date()) => formatMonthYearI18n(date, locale),
    [locale]
  );

  const strings = useMemo(() => translations[locale], [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, strings, getMonthName, formatMonthYear, ready }),
    [locale, setLocale, t, strings, getMonthName, formatMonthYear, ready]
  );

  if (!ready) return null;

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

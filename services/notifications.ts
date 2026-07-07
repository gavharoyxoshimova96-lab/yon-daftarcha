import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { getDebts, getBudgetStatuses, getSetting, setSetting } from '@/database';
import { areNotificationsEnabled, setNotificationsEnabled } from '@/services/security';
import { getNestedValue, interpolate, isAppLocale, LOCALE_KEY, translations } from '@/i18n';
import { AppLocale } from '@/i18n/types';

const DEBT_PREFIX = 'debt-reminder-';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getNotificationLocale(): Promise<AppLocale> {
  const saved = await getSetting(LOCALE_KEY);
  return isAppLocale(saved) ? saved : 'uz';
}

function nt(locale: AppLocale, key: string, params?: Record<string, string | number>): string {
  const value = getNestedValue(translations[locale], key);
  if (typeof value !== 'string') return key;
  return interpolate(value, params);
}

async function cancelDebtReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(DEBT_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function enableNotifications(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (granted) {
    await setNotificationsEnabled(true);
    await syncNotifications();
  }
  return granted;
}

export async function disableNotifications(): Promise<void> {
  await setNotificationsEnabled(false);
  await cancelDebtReminders();
}

export async function scheduleDebtReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!(await areNotificationsEnabled())) return;

  const locale = await getNotificationLocale();
  await cancelDebtReminders();
  const debts = await getDebts('active');
  const now = new Date();

  for (const debt of debts) {
    if (!debt.due_date) continue;
    const due = new Date(debt.due_date);
    const remind = new Date(due);
    remind.setDate(remind.getDate() - 1);
    remind.setHours(9, 0, 0, 0);
    if (remind <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${DEBT_PREFIX}${debt.id}`,
      content: {
        title: nt(locale, 'notifications.debtReminderTitle'),
        body: nt(locale, 'notifications.debtReminderBody', {
          name: debt.person_name,
          date: debt.due_date,
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: remind,
      },
    });
  }
}

export async function checkBudgetAlerts(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!(await areNotificationsEnabled())) return;

  const locale = await getNotificationLocale();
  const statuses = await getBudgetStatuses();

  for (const status of statuses) {
    if (status.limit <= 0) continue;
    const ratio = status.spent / status.limit;
    const baseKey = `budget_alert_${status.month}_${status.categoryId}`;
    const percent = String(Math.round(ratio * 100));

    if (ratio >= 1) {
      const key = `${baseKey}_100`;
      if ((await getSetting(key)) === 'sent') continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: nt(locale, 'notifications.budgetExceededTitle'),
          body: nt(locale, 'notifications.budgetExceededBody', {
            category: status.categoryName,
            percent,
          }),
        },
        trigger: null,
      });
      await setSetting(key, 'sent');
    } else if (ratio >= 0.8) {
      const key = `${baseKey}_80`;
      if ((await getSetting(key)) === 'sent') continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: nt(locale, 'notifications.budgetWarningTitle'),
          body: nt(locale, 'notifications.budgetWarningBody', {
            category: status.categoryName,
            percent,
          }),
        },
        trigger: null,
      });
      await setSetting(key, 'sent');
    }
  }
}

export async function syncNotifications(): Promise<void> {
  if (!(await areNotificationsEnabled())) return;
  await scheduleDebtReminders();
  await checkBudgetAlerts();
}

export async function getExceededBudgetMessages(): Promise<string[]> {
  const statuses = await getBudgetStatuses();
  return statuses
    .filter((s) => s.limit > 0 && s.spent > s.limit)
    .map((s) => `${s.categoryName}: byudjet oshdi (${Math.round((s.spent / s.limit) * 100)}%)`);
}

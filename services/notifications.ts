import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { getDebts } from '@/database';
import { areNotificationsEnabled, setNotificationsEnabled } from '@/services/security';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
    await scheduleDebtReminders();
  }
  return granted;
}

export async function disableNotifications(): Promise<void> {
  await setNotificationsEnabled(false);
  if (Platform.OS !== 'web') {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export async function scheduleDebtReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!(await areNotificationsEnabled())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
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
      content: {
        title: 'Qarz muddati yaqinlashmoqda',
        body: `${debt.person_name} — ${debt.due_date} ga qadar to'lash kerak`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: remind,
      },
    });
  }
}

export async function getExceededBudgetMessages(): Promise<string[]> {
  const { getBudgetStatuses } = await import('@/database');
  const statuses = await getBudgetStatuses();
  return statuses
    .filter((s) => s.limit > 0 && s.spent > s.limit)
    .map((s) => `${s.categoryName}: byudjet oshdi (${Math.round((s.spent / s.limit) * 100)}%)`);
}

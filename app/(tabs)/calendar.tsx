import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Text, useTheme } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';

import { useDatabase } from '@/context/DatabaseContext';
import { useLocale } from '@/context/LocaleContext';
import { getDailySummaries } from '@/database';
import { DailySummary } from '@/types';
import { formatShortCurrency } from '@/utils/format';
import { useAppColors } from '@/hooks/useAppColors';

export default function CalendarScreen() {
  const theme = useTheme();
  const colors = useAppColors();
  const { t, locale } = useLocale();
  const { refreshKey } = useDatabase();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summaries, setSummaries] = useState<DailySummary[]>([]);

  const loadData = useCallback(async () => {
    const data = await getDailySummaries(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
    setSummaries(data);
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  const markedDates: Record<string, object> = {};
  for (const summary of summaries) {
    markedDates[summary.date] = {
      marked: true,
      dotColor: summary.expense > summary.income ? colors.expense : colors.income,
      customStyles: {
        text: { fontWeight: '600' as const },
      },
    };
  }

  const onDayPress = (day: DateData) => {
    router.push(`/calendar/${day.dateString}`);
  };

  const onMonthChange = (month: DateData) => {
    setCurrentDate(new Date(month.year, month.month - 1, 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Calendar
        key={locale}
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        markedDates={markedDates}
        markingType="dot"
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.onSurface,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#fff',
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          monthTextColor: theme.colors.onSurface,
          arrowColor: theme.colors.primary,
        }}
        style={styles.calendar}
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.income }]} />
          <Text variant="bodySmall">{t('calendar.income')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.expense }]} />
          <Text variant="bodySmall">{t('calendar.expense')}</Text>
        </View>
      </View>
      <Text variant="bodySmall" style={styles.hint}>
        {t('calendar.hint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  calendar: {
    borderRadius: 16,
    elevation: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hint: {
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.6,
  },
});

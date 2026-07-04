import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from 'expo-router';

import { useDatabase } from '@/context/DatabaseContext';
import { getMonthlyReport } from '@/database';
import { MonthlyReport } from '@/types';
import { formatCurrency } from '@/utils/format';
import { addMonths } from '@/utils/date';
import { useAppColors } from '@/hooks/useAppColors';
import { useLocale } from '@/context/LocaleContext';

const screenWidth = Dimensions.get('window').width - 32;

export default function ReportsScreen() {
  const theme = useTheme();
  const colors = useAppColors();
  const { t, formatMonthYear } = useLocale();
  const { refreshKey } = useDatabase();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [month, setMonth] = useState(() => new Date());

  const loadReport = useCallback(async () => {
    setReport(await getMonthlyReport(month));
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport, refreshKey])
  );

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (!report) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.loading}>{t('common.loading')}</Text>
      </View>
    );
  }

  const pieData = report.categoryBreakdown.map((item) => ({
    name: item.name,
    amount: item.amount,
    color: item.color,
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12,
  }));

  const step = report.dailySpending.length > 7 ? 2 : 1;
  const sampled = report.dailySpending.filter((_, i) => i % step === 0);
  const barData = {
    labels: sampled.map((d) => d.date.split('-')[2]),
    datasets: [{ data: sampled.map((d) => d.amount / 1000) }],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: () => theme.colors.onSurface,
    style: { borderRadius: 16 },
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.monthNav}>
        <IconButton icon="chevron-left" onPress={() => setMonth((m) => addMonths(m, -1))} />
        <Text variant="titleLarge" style={styles.monthTitle}>
          {formatMonthYear(month)} {t('reports.reportOf')}
        </Text>
        <IconButton icon="chevron-right" onPress={() => setMonth((m) => addMonths(m, 1))} />
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium">{t('common.income')}</Text>
            <Text variant="titleLarge" style={{ color: colors.income, fontWeight: '700' }}>
              {formatCurrency(report.totalIncome)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium">{t('common.expense')}</Text>
            <Text variant="titleLarge" style={{ color: colors.expense, fontWeight: '700' }}>
              {formatCurrency(report.totalExpense)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="labelMedium">{t('reports.netBalance')}</Text>
          <Text
            variant="headlineMedium"
            style={{
              color: report.netBalance >= 0 ? colors.income : colors.expense,
              fontWeight: '700',
            }}
          >
            {formatCurrency(report.netBalance)}
          </Text>
        </Card.Content>
      </Card>

      {pieData.length > 0 && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              {t('reports.byCategory')}
            </Text>
            <PieChart
              data={pieData}
              width={screenWidth - 32}
              height={200}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          </Card.Content>
        </Card>
      )}

      {report.dailySpending.length > 0 && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              {t('reports.dailyExpenses')}
            </Text>
            <BarChart
              data={barData}
              width={screenWidth - 32}
              height={200}
              chartConfig={chartConfig}
              yAxisLabel=""
              yAxisSuffix=""
              style={styles.chart}
              showValuesOnTopOfBars={false}
            />
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>
            {t('reports.statistics')}
          </Text>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">{t('reports.mostExpensive')}:</Text>
            <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
              {report.mostExpensiveCategory}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="bodyMedium">{t('reports.avgDaily')}:</Text>
            <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
              {formatCurrency(report.averageDailySpending)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loading: {
    textAlign: 'center',
    marginTop: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthTitle: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  chartTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
});

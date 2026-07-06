import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format';
import { formatDisplayDate } from '@/utils/date';
import { useAppColors } from '@/hooks/useAppColors';
import { useLocale } from '@/context/LocaleContext';
import { radii } from '@/constants/design';

interface TransactionListProps {
  transactions: Transaction[];
  onPress?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  emptyMessage?: string;
}

function getDescription(tx: Transaction): string {
  const dateStr = formatDisplayDate(tx.date);
  return tx.note ? `${dateStr} · ${tx.note}` : dateStr;
}

export function TransactionList({
  transactions,
  onPress,
  onEdit,
  onDelete,
  emptyMessage,
}: TransactionListProps) {
  const theme = useTheme();
  const colors = useAppColors();
  const { t } = useLocale();
  const empty = emptyMessage ?? t('common.noData');
  const isIncome = (tx: Transaction) => tx.type === 'income';

  if (transactions.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.colors.surfaceVariant, borderRadius: radii.md }]}>
        <MaterialCommunityIcons
          name="receipt-text-outline"
          size={36}
          color={theme.colors.onSurfaceVariant}
          style={{ marginBottom: 8, opacity: 0.5 }}
        />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {empty}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {transactions.map((tx) => {
        const accent = isIncome(tx) ? colors.income : colors.expense;
        const content = (
          <SurfaceCard accentColor={accent}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
                <MaterialCommunityIcons
                  name={isIncome(tx) ? 'arrow-up' : 'arrow-down'}
                  size={22}
                  color={accent}
                />
              </View>
              <View style={styles.body}>
                <Text variant="titleSmall" style={styles.title} numberOfLines={1}>
                  {tx.category_name ?? '—'}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                  {getDescription(tx)}
                </Text>
              </View>
              <View style={styles.right}>
                <Text variant="titleMedium" style={{ color: accent, fontWeight: '700' }}>
                  {isIncome(tx) ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </Text>
                {(onEdit || onDelete) && (
                  <View style={styles.actions}>
                    {onEdit && (
                      <IconButton
                        icon="pencil-outline"
                        size={18}
                        onPress={() => onEdit(tx.id)}
                        style={styles.actionBtn}
                      />
                    )}
                    {onDelete && (
                      <IconButton
                        icon="delete-outline"
                        size={18}
                        iconColor={theme.colors.error}
                        onPress={() => onDelete(tx.id)}
                        style={styles.actionBtn}
                      />
                    )}
                  </View>
                )}
              </View>
            </View>
          </SurfaceCard>
        );

        if (onPress) {
          return (
            <Pressable key={tx.id} onPress={() => onPress(tx.id)}>
              {content}
            </Pressable>
          );
        }

        return <View key={tx.id}>{content}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 36,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    marginTop: -6,
    marginRight: -10,
  },
  actionBtn: {
    margin: 0,
  },
});

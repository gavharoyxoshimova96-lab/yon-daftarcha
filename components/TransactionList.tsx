import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, List, Text, useTheme } from 'react-native-paper';

import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format';
import { formatDisplayDate } from '@/utils/date';
import { useAppColors } from '@/hooks/useAppColors';
import { useLocale } from '@/context/LocaleContext';

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

  if (transactions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {empty}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {transactions.map((tx) => {
        const content = (
          <List.Item
            title={tx.category_name ?? '—'}
            description={getDescription(tx)}
            left={(props) => (
              <List.Icon
                {...props}
                icon={tx.type === 'income' ? 'arrow-up-bold' : 'arrow-down-bold'}
                color={tx.type === 'income' ? colors.income : colors.expense}
              />
            )}
            right={() => (
              <View style={styles.right}>
                <Text
                  variant="titleMedium"
                  style={{
                    color: tx.type === 'income' ? colors.income : colors.expense,
                    fontWeight: '600',
                  }}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </Text>
                {(onEdit || onDelete) && (
                  <View style={styles.actions}>
                    {onEdit && (
                      <IconButton icon="pencil" size={18} onPress={() => onEdit(tx.id)} />
                    )}
                    {onDelete && (
                      <IconButton icon="delete" size={18} onPress={() => onDelete(tx.id)} />
                    )}
                  </View>
                )}
              </View>
            )}
            style={styles.item}
          />
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
    padding: 32,
    alignItems: 'center',
  },
  item: {
    paddingVertical: 4,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    marginTop: -4,
  },
});

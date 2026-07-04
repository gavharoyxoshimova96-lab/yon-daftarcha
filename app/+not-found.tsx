import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { useLocale } from '@/context/LocaleContext';

export default function NotFoundScreen() {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <>
      <Stack.Screen options={{ title: t('screens.notFound') }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall" style={styles.title}>
          {t('notFound.title')}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
          {t('notFound.description')}
        </Text>
        <Link href="/" asChild>
          <Button mode="contained" icon="home">
            {t('notFound.goHome')}
          </Button>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});

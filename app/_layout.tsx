import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { DatabaseProvider } from '@/context/DatabaseContext';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';
import { SecurityProvider } from '@/context/SecurityContext';
import { lightTheme, darkTheme } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { t } = useLocale();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="transaction/income"
        options={{ title: t('screens.addIncome'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="transaction/expense"
        options={{ title: t('screens.addExpense'), presentation: 'modal' }}
      />
      <Stack.Screen name="transaction/[id]" options={{ title: t('screens.edit') }} />
      <Stack.Screen
        name="debt/add"
        options={{ title: t('screens.addDebt'), presentation: 'modal' }}
      />
      <Stack.Screen name="debt/[id]" options={{ title: t('screens.editDebt') }} />
      <Stack.Screen name="categories" options={{ title: t('screens.categories') }} />
      <Stack.Screen name="search" options={{ title: t('screens.search') }} />
      <Stack.Screen name="calendar/[date]" options={{ title: t('screens.dailyReport') }} />
      <Stack.Screen name="savings" options={{ title: t('screens.savings') }} />
      <Stack.Screen name="savings/[id]" options={{ title: t('screens.goal') }} />
      <Stack.Screen name="budget" options={{ title: t('screens.budget') }} />
      <Stack.Screen name="backup" options={{ title: t('screens.backup') }} />
      <Stack.Screen name="security" options={{ title: t('screens.security') }} />
      <Stack.Screen name="ai" options={{ title: t('screens.ai') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <DatabaseProvider>
        <LocaleProvider>
          <SecurityProvider>
            <AppStack />
          </SecurityProvider>
        </LocaleProvider>
      </DatabaseProvider>
    </PaperProvider>
  );
}

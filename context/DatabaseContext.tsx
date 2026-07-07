import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { getDatabase } from '@/database';

interface DatabaseContextValue {
  ready: boolean;
  refreshKey: number;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  ready: false,
  refreshKey: 0,
  refresh: () => {},
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getDatabase().then(async () => {
      setReady(true);
      try {
        const { runRecurringPayments } = await import('@/services/recurringPayments');
        const { syncNotifications } = await import('@/services/notifications');
        await runRecurringPayments();
        await syncNotifications();
      } catch {
        // notifications optional until packages installed
      }
    });
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    import('@/services/recurringPayments')
      .then((m) => m.runRecurringPayments())
      .catch(() => {});
    import('@/services/notifications')
      .then((m) => m.syncNotifications())
      .catch(() => {});
  }, []);

  const value = { ready, refreshKey, refresh };

  if (!ready) {
    return (
      <DatabaseContext.Provider value={value}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      </DatabaseContext.Provider>
    );
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

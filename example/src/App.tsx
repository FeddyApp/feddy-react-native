import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feddy, FeedbackListView } from 'feddy-react-native';

const DEMO_API_KEY = 'feddy_cbfe5fe6d88f2ba24f73f112a63f06d1';

export default function App(): ReactElement {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      Feddy.configure({
        apiKey: DEMO_API_KEY,
        enableDebugLogging: true,
      });
      Feddy.updateUser({
        email: 'demo@feddy.app',
        name: 'Feddy Demo User',
      });
      setReady(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to initialise Feddy'
      );
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : ready ? (
        <FeedbackListView />
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator color="#38bdf8" />
          <Text style={styles.loading}>Initialising Feddy…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  error: {
    fontSize: 16,
    color: '#F87171',
  },
  loading: {
    color: '#94A3B8',
  },
});

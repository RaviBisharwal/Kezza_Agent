import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth-store';

function RouteGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { isHydrated, accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    const inAuth = segments[0] === '(auth)';
    const inAdmin = segments[0] === 'admin';

    if (!accessToken && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (accessToken && inAuth) {
      if (user?.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }

    if (accessToken && inAdmin && user?.role !== 'admin') {
      router.replace('/(tabs)');
    }
  }, [accessToken, isHydrated, router, segments, user]);

  return null;
}

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);

  return (
    <View style={styles.shell}>
      <View style={styles.frame}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <RouteGuard />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.canvas } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="add-patient" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
  },
});

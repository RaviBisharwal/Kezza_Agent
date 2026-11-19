import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth-store';

function RouteGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { isHydrated, accessToken } = useAuthStore();
  useEffect(() => {
    if (!isHydrated) return;
    const inAuth = segments[0] === '(auth)';
    if (!accessToken && !inAuth) router.replace('/(auth)/login');
    if (accessToken && inAuth) router.replace('/(tabs)');
  }, [accessToken, isHydrated, router, segments]);
  return null;
}

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <RouteGuard />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F7F6' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-patient" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}

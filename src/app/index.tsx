import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';

export default function IndexRoute() {
  const { isHydrated, accessToken, user } = useAuthStore();
  if (!isHydrated) return <View style={styles.loading}><ActivityIndicator color={Colors.teal} /></View>;
  if (!accessToken) return <Redirect href="/(auth)/login" />;
  return <Redirect href={user?.role === 'admin' ? '/admin' : '/(tabs)'} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.canvas } });

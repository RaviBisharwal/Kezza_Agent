import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { BackBar, Card, PageHeading, Screen } from '@/components/Screen';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';

function dismissModal() {
  // profile is a modal — use router.dismiss(); fall back to replace.
  if (router.canDismiss()) {
    router.dismiss();
  } else {
    router.replace('/(tabs)');
  }
}

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  async function logout() { await signOut(); router.replace('/(auth)/login'); }
  return (
    <Screen header={<BackBar onPress={dismissModal} label="Overview" />}>
      <PageHeading eyebrow="Agent account" title="Your profile" subtitle="Your Kezza Agent session and identity." />
      <Card>
        <Info label="Name" value={user?.fullName ?? '—'} />
        <Info label="Mobile" value={user?.phone ?? '—'} />
        <Info label="Agent code" value={user?.agentCode ?? 'Available in your referral card'} />
        <InlineNotice tone="info">{'This is a separate agent app connected to the same Kezza API. Sign out here to clear this app\'s saved session.'}</InlineNotice>
      </Card>
      <Button variant="secondary" onPress={dismissModal}>Back to dashboard</Button>
      <Button onPress={logout}>Sign out</Button>
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></>;
}

const styles = StyleSheet.create({
  label: { color: Colors.inkMuted, fontSize: 12, fontWeight: '700' },
  value: { color: Colors.ink, fontSize: 15, fontWeight: '700', marginTop: -8 },
});

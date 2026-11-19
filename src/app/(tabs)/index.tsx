import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, Share, StyleSheet, Text, View } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { Card, Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { Colors, Space } from '@/constants/theme';
import { useAgentReferralCode, useAgentReferrals } from '@/features/referrals/hooks';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';

export default function OverviewScreen() {
  const user = useAuthStore((state) => state.user);
  const referrals = useAgentReferrals();
  const code = useAgentReferralCode();
  const [copied, setCopied] = useState(false);
  const refreshing = referrals.isRefetching || code.isRefetching;
  const items = referrals.data ?? [];
  const converted = items.filter((item) => item.status === 'converted').length;
  const active = items.filter((item) => ['registered', 'contacted', 'consultation_booked'].includes(item.status)).length;
  const link = code.data?.referral_link ?? '';

  async function copyCode() {
    if (!code.data?.agent_code) return;
    await Clipboard.setStringAsync(code.data.agent_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    if (!link) return;
    await Share.share({ message: `Join Kezza with my referral link: ${link}` });
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void referrals.refetch(); void code.refetch(); }} tintColor={Colors.teal} />}>
      <View style={styles.topline}>
        <View><Text style={styles.kicker}>KEZZA AGENT</Text><Text style={styles.greeting}>Hello, {user?.fullName.split(' ')[0] ?? 'Agent'}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={styles.avatar}><Text style={styles.avatarText}>{user?.fullName.slice(0, 1).toUpperCase() ?? 'A'}</Text></Pressable>
      </View>
      <Text style={styles.subheading}>Your referral workspace at a glance.</Text>

      <View style={styles.statsRow}>
        <Stat label="Patients added" value={String(code.data?.total_referrals ?? items.length)} />
        <Stat label="In progress" value={String(active)} />
        <Stat label="Converted" value={String(code.data?.converted_count ?? converted)} accent />
      </View>

      <Card style={styles.inviteCard}>
        <View style={styles.cardHead}><Text style={styles.inviteEyebrow}>YOUR REFERRAL CODE</Text><Text style={styles.code}>{code.data?.agent_code ?? '—'}</Text></View>
        <Text style={styles.cardCopy}>Share your code with a patient or add their details directly to track the referral.</Text>
        <View style={styles.actionRow}>
          <View style={styles.actionCell}><Button variant="secondary" onPress={copyCode}>{copied ? 'Copied' : 'Copy code'}</Button></View>
          <View style={styles.actionCell}><Button variant="secondary" onPress={shareLink}>Share link</Button></View>
        </View>
      </Card>

      <Button onPress={() => router.push('/add-patient')}>＋  Add a patient</Button>

      {referrals.isError || code.isError ? <InlineNotice tone="error">{getErrorMessage(referrals.error ?? code.error, 'Could not load your latest referrals. Pull down to retry.')}</InlineNotice> : null}

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent referrals</Text><Pressable onPress={() => router.push('/patients')}><Text style={styles.seeAll}>View all</Text></Pressable></View>
      {referrals.isLoading ? <Card><Text style={styles.muted}>Loading your referral activity…</Text></Card> : items.length === 0 ? (
        <Card><Text style={styles.emptyTitle}>Your first referral starts here</Text><Text style={styles.muted}>Add a patient or share your code. New referrals will appear here as their status changes.</Text></Card>
      ) : items.slice(0, 3).map((item) => (
        <Pressable key={item.id} onPress={() => router.push('/patients')}>
          <Card style={styles.referralCard}>
            <View style={styles.referralTop}><Text style={styles.patientName} numberOfLines={1}>{item.patient_name}</Text><StatusBadge status={item.status} /></View>
            <Text style={styles.muted}>{item.service_interest || 'No service selected'} · Added {formatDate(item.created_at)}</Text>
          </Card>
        </Pressable>
      ))}
      <Text style={styles.disclaimer}>Patient records and earnings are loaded from Kezza’s secure API.</Text>
    </Screen>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <View style={styles.stat}><Text style={[styles.statValue, accent && { color: Colors.teal }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Space.sm },
  kicker: { fontSize: 10, letterSpacing: 1.4, color: Colors.teal, fontWeight: '900' },
  greeting: { fontSize: 27, lineHeight: 33, fontWeight: '900', color: Colors.ink, marginTop: 3 },
  subheading: { color: Colors.inkMuted, fontSize: 14, marginTop: -Space.md },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.softTeal, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.tealDark, fontSize: 18, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: Space.sm },
  stat: { flex: 1, minHeight: 84, borderRadius: 16, backgroundColor: Colors.white, borderColor: Colors.line, borderWidth: 1, padding: Space.md, justifyContent: 'center', gap: 4 },
  statValue: { color: Colors.ink, fontSize: 23, fontWeight: '900' },
  statLabel: { color: Colors.inkMuted, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  inviteCard: { backgroundColor: Colors.ink, borderColor: Colors.ink, paddingVertical: Space.xl },
  cardHead: { gap: Space.xs },
  inviteEyebrow: { color: '#B8D9D4', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  code: { color: Colors.white, fontSize: 29, letterSpacing: 2, fontWeight: '900' },
  cardCopy: { color: '#D9E8E5', fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: Space.md },
  actionCell: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Space.sm },
  sectionTitle: { color: Colors.ink, fontSize: 18, fontWeight: '800' },
  seeAll: { color: Colors.teal, fontSize: 13, fontWeight: '800' },
  referralCard: { padding: Space.lg },
  referralTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  patientName: { color: Colors.ink, fontWeight: '800', fontSize: 15, flex: 1 },
  muted: { color: Colors.inkMuted, fontSize: 13, lineHeight: 19 },
  emptyTitle: { color: Colors.ink, fontSize: 16, fontWeight: '800' },
  disclaimer: { textAlign: 'center', marginTop: Space.sm, color: Colors.inkMuted, fontSize: 11, lineHeight: 16 },
});

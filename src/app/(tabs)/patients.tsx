import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Card, PageHeading, Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { Colors, Space } from '@/constants/theme';
import { useAgentReferrals } from '@/features/referrals/hooks';
import type { ReferralStatus } from '@/features/referrals/types';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';

const filters: { label: string; value: 'all' | ReferralStatus }[] = [
  { label: 'All', value: 'all' }, { label: 'Registered', value: 'registered' }, { label: 'In progress', value: 'contacted' }, { label: 'Converted', value: 'converted' },
];

export default function PatientsScreen() {
  const referrals = useAgentReferrals();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ReferralStatus>('all');
  const filtered = useMemo(() => (referrals.data ?? []).filter((item) => {
    const matchesSearch = `${item.patient_name} ${item.patient_phone_e164} ${item.service_interest ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'contacted' ? ['contacted', 'consultation_booked'].includes(item.status) : item.status === filter);
    return matchesSearch && matchesFilter;
  }), [filter, referrals.data, search]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={referrals.isRefetching} onRefresh={() => void referrals.refetch()} tintColor={Colors.teal} />}>
      <PageHeading eyebrow="Patient management" title="Your patients" subtitle="Keep track of the people you’ve referred and their next step." />
      <Button onPress={() => router.push('/add-patient')}>＋  Add a patient</Button>
      <FormField label="Search referrals" value={search} onChangeText={setSearch} placeholder="Name, number, or service" />
      <View style={styles.filters}>{filters.map((item) => {
        const selected = filter === item.value;
        return <Pressable key={item.value} onPress={() => setFilter(item.value)} style={[styles.filter, selected && styles.filterSelected]}><Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text></Pressable>;
      })}</View>
      {referrals.isError ? <InlineNotice tone="error">{getErrorMessage(referrals.error, 'Could not load referrals. Pull down to retry.')}</InlineNotice> : null}
      {referrals.isLoading ? <Card><Text style={styles.muted}>Loading referral records…</Text></Card> : filtered.length === 0 ? (
        <Card><Text style={styles.emptyTitle}>{(referrals.data ?? []).length ? 'No matching referrals' : 'No patients added yet'}</Text><Text style={styles.muted}>{(referrals.data ?? []).length ? 'Try a different search or status filter.' : 'Add a patient to create your first tracked referral.'}</Text></Card>
      ) : filtered.map((item) => (
        <Card key={item.id} style={styles.patientCard}>
          <View style={styles.cardHead}><Text style={styles.name}>{item.patient_name}</Text><StatusBadge status={item.status} /></View>
          <Text style={styles.phone}>{item.patient_phone_e164}</Text>
          <View style={styles.rule} />
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Service</Text><Text style={styles.metaValue}>{item.service_interest || 'Not specified'}</Text></View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Added</Text><Text style={styles.metaValue}>{formatDate(item.created_at)}</Text></View>
          {item.converted_at ? <View style={styles.metaRow}><Text style={styles.metaLabel}>Converted</Text><Text style={styles.metaValue}>{formatDate(item.converted_at)}</Text></View> : null}
        </Card>
      ))}
      <Text style={styles.privacy}>Patient details are visible only after the agent API authorizes this session.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  filter: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.line },
  filterSelected: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  filterText: { color: Colors.inkMuted, fontSize: 12, fontWeight: '700' },
  filterTextSelected: { color: Colors.white },
  patientCard: { gap: Space.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  name: { color: Colors.ink, fontSize: 16, fontWeight: '800', flex: 1 },
  phone: { color: Colors.inkMuted, fontSize: 13 },
  rule: { height: 1, backgroundColor: Colors.line, marginVertical: Space.xs },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Space.md },
  metaLabel: { color: Colors.inkMuted, fontSize: 12 },
  metaValue: { color: Colors.ink, fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'right' },
  emptyTitle: { color: Colors.ink, fontSize: 16, fontWeight: '800' },
  muted: { color: Colors.inkMuted, fontSize: 13, lineHeight: 19 },
  privacy: { textAlign: 'center', color: Colors.inkMuted, fontSize: 11, lineHeight: 16, marginTop: Space.sm },
});

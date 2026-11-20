import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { Card, PageHeading, Screen } from '@/components/Screen';
import { CommissionStatusBadge } from '@/components/StatusBadge';
import { FormField } from '@/components/FormField';
import { Colors, Space } from '@/constants/theme';
import { useAdminOverview, useAdminPatientSearch, useAdminReferrals, useApproveAllCommissions, useApproveCommission, useBranchFinancials, useGrantPatientPoints, usePendingCommissions } from '@/features/admin/hooks';
import { formatDate, formatMoney } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';

export default function AdminScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const pendingQuery = usePendingCommissions();
  const overviewQuery = useAdminOverview();
  const approveMutation = useApproveCommission();
  const approveAllMutation = useApproveAllCommissions();

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [grantPoints, setGrantPoints] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const referralsQuery = useAdminReferrals();
  const branchesQuery = useBranchFinancials();
  const patientsQuery = useAdminPatientSearch(patientSearch);
  const grantMutation = useGrantPatientPoints();
  const visibleReferrals = useMemo(() => referralsQuery.data ?? [], [referralsQuery.data]);

  const items = pendingQuery.data ?? [];
  const totalPendingMinorUnits = items.reduce((acc, curr) => acc + curr.amount_minor_units, 0);

  async function handleLogout() {
    await signOut();
    router.replace('/(auth)/login');
  }

  async function handleApproveSingle(commissionId: string, agentName: string) {
    setApprovingId(commissionId);
    setSuccessMessage('');
    try {
      await approveMutation.mutateAsync(commissionId);
      setSuccessMessage(`Approved commission for ${agentName}.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (caught) {
      Alert.alert('Approval Failed', getErrorMessage(caught, 'Could not approve commission.'));
    } finally {
      setApprovingId(null);
    }
  }

  async function handleApproveAll() {
    if (items.length === 0) return;
    setSuccessMessage('');
    try {
      const result = await approveAllMutation.mutateAsync();
      setSuccessMessage(`Successfully batch-approved ${result.approved_count} commission(s).`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (caught) {
      Alert.alert('Batch Approval Failed', getErrorMessage(caught, 'Could not batch approve commissions.'));
    }
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={pendingQuery.isRefetching}
          onRefresh={() => { void Promise.all([pendingQuery.refetch(), overviewQuery.refetch(), referralsQuery.refetch(), branchesQuery.refetch()]); }}
          tintColor={Colors.teal}
        />
      }
    >
      <View style={styles.topBar}>
        <View>
          <Text style={styles.kicker}>KEZZA PLATFORM ADMIN</Text>
          <Text style={styles.adminTitle}>Admin Portal</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>

      <PageHeading
        title="Super Admin"
        subtitle={`Platform overview · ${user?.fullName || 'Administrator'}`}
      />
      {successMessage ? <InlineNotice tone="success">{successMessage}</InlineNotice> : null}

      {overviewQuery.data ? (
        <View style={styles.overviewGrid}>
          {[
            ['Patients', overviewQuery.data.patients.toLocaleString()],
            ['Active patients', overviewQuery.data.active_patients.toLocaleString()],
            ['Active agents', overviewQuery.data.active_agents.toLocaleString()],
            ['Open referrals', overviewQuery.data.open_referrals.toLocaleString()],
            ['Branches', overviewQuery.data.active_branches.toLocaleString()],
            ['Pending approvals', overviewQuery.data.pending_commissions.toLocaleString()],
            ['Coins issued', overviewQuery.data.loyalty_points_issued.toLocaleString()],
            ['Coins available', overviewQuery.data.loyalty_points_available.toLocaleString()],
            ['Coins redeemed', overviewQuery.data.loyalty_points_redeemed.toLocaleString()],
            ['Verified payments', formatMoney(overviewQuery.data.verified_payments_minor_units, overviewQuery.data.currency)],
            ['Commissions paid', formatMoney(overviewQuery.data.approved_commissions_minor_units, overviewQuery.data.currency)],
          ].map(([label, value]) => (
            <Card key={label} style={styles.overviewCard}>
              <Text style={styles.metricLabel}>{label.toUpperCase()}</Text>
              <Text style={styles.overviewValue}>{value}</Text>
            </Card>
          ))}
        </View>
      ) : overviewQuery.isError ? (
        <InlineNotice tone="error">{getErrorMessage(overviewQuery.error, 'Could not load platform overview.')}</InlineNotice>
      ) : null}

      <PageHeading title="Platform operations" subtitle="Live records from the Kezza API" />
      <Card style={styles.dataCard}>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Referral tracking</Text><Text style={styles.queueCount}>{visibleReferrals.length} latest</Text></View>
        <Text style={styles.mutedText}>Up to 200 most recent referrals, with source partner and current status.</Text>
        {referralsQuery.isLoading ? <ActivityIndicator color={Colors.teal} /> : referralsQuery.isError ? <InlineNotice tone="error">{getErrorMessage(referralsQuery.error, 'Could not load referrals.')}</InlineNotice> : visibleReferrals.length === 0 ? <Text style={styles.mutedText}>No referrals have been recorded.</Text> : visibleReferrals.slice(0, 8).map((referral) => (
          <View key={referral.referral_id} style={styles.dataRow}>
            <View style={styles.rowMain}><Text style={styles.agentName}>{referral.patient_name}</Text><Text style={styles.patientInfo}>{referral.agent_name} · {referral.agent_code}</Text><Text style={styles.patientInfo}>{referral.patient_phone_e164}{referral.branch_name ? ` · ${referral.branch_name}` : ''}</Text></View>
            <Text style={styles.statusText}>{referral.status.replaceAll('_', ' ')}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.dataCard}>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Branch performance</Text><Text style={styles.queueCount}>{branchesQuery.data?.length ?? 0} branches</Text></View>
        {branchesQuery.isLoading ? <ActivityIndicator color={Colors.teal} /> : branchesQuery.isError ? <InlineNotice tone="error">{getErrorMessage(branchesQuery.error, 'Could not load branch reports.')}</InlineNotice> : (branchesQuery.data ?? []).length === 0 ? <Text style={styles.mutedText}>No branches are configured.</Text> : branchesQuery.data?.map((branch) => (
          <View key={branch.branch_id} style={styles.dataRow}><View style={styles.rowMain}><Text style={styles.agentName}>{branch.name} · {branch.city}</Text><Text style={styles.patientInfo}>{branch.verified_payments} verified payments · {branch.is_active ? 'Active' : 'Inactive'}</Text></View><Text style={styles.branchRevenue}>{formatMoney(branch.verified_revenue_minor_units, branch.currency)}</Text></View>
        ))}
      </Card>

      <Card style={styles.dataCard}>
        <PageHeading title="Patient wallets" subtitle="Search active patients and issue an audited points credit" />
        <FormField label="Search patients" value={patientSearch} onChangeText={setPatientSearch} placeholder="Name or phone (2+ characters)" />
        <FormField label="Points to credit" value={grantPoints} onChangeText={setGrantPoints} placeholder="e.g. 250" keyboardType="number-pad" />
        <FormField label="Audit reason" value={grantReason} onChangeText={setGrantReason} placeholder="Reason for this adjustment" maxLength={220} />
        {patientsQuery.isError ? <InlineNotice tone="error">{getErrorMessage(patientsQuery.error, 'Could not search patients.')}</InlineNotice> : null}
        {patientSearch.trim().length < 2 ? <Text style={styles.mutedText}>Enter at least two letters or digits to search.</Text> : patientsQuery.isLoading ? <ActivityIndicator color={Colors.teal} /> : patientsQuery.data?.length === 0 ? <Text style={styles.mutedText}>No matching active patients.</Text> : patientsQuery.data?.map((patient) => (
          <View key={patient.patient_id} style={styles.patientResult}>
            <View style={styles.rowMain}><Text style={styles.agentName}>{patient.full_name}</Text><Text style={styles.patientInfo}>{patient.phone_e164} · {patient.total_points.toLocaleString()} points</Text></View>
            <Button variant="secondary" loading={grantMutation.isPending} disabled={!/^\d+$/.test(grantPoints) || Number(grantPoints) < 1 || Number(grantPoints) > 1_000_000 || grantReason.trim().length < 3} onPress={async () => {
              try { await grantMutation.mutateAsync({ patientId: patient.patient_id, points: Number(grantPoints), reason: grantReason.trim() }); setSuccessMessage(`Added ${Number(grantPoints).toLocaleString()} points to ${patient.full_name}.`); setGrantPoints(''); setGrantReason(''); }
              catch (caught) { Alert.alert('Points adjustment failed', getErrorMessage(caught, 'Could not grant points.')); }
            }}>Credit points</Button>
          </View>
        ))}
      </Card>

      <PageHeading title="Commission approvals" subtitle="Review verified referral commissions" />

      {pendingQuery.isError ? (
        <InlineNotice tone="error">
          {getErrorMessage(pendingQuery.error, 'Could not load pending commissions.')}
        </InlineNotice>
      ) : null}

      {/* Overview Metric Banner */}
      <Card style={styles.metricCard}>
        <View style={styles.metricRow}>
          <View>
            <Text style={styles.metricLabel}>AWAITING APPROVAL</Text>
            <Text style={styles.metricCount}>{items.length} pending</Text>
          </View>
          <View style={styles.amountWrap}>
            <Text style={styles.metricLabel}>TOTAL VALUE</Text>
            <Text style={styles.metricAmount}>
              {formatMoney(totalPendingMinorUnits, 'INR')}
            </Text>
          </View>
        </View>

        {items.length > 0 ? (
          <Button
            variant="primary"
            onPress={handleApproveAll}
            loading={approveAllMutation.isPending}
          >
            Approve all ({items.length}) commissions
          </Button>
        ) : null}
      </Card>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Pending queue</Text>
        <Text style={styles.queueCount}>{items.length} items</Text>
      </View>

      {pendingQuery.isLoading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={Colors.teal} />
          <Text style={styles.mutedText}>Fetching pending commissions…</Text>
        </Card>
      ) : items.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCheck}>✓</Text>
          <Text style={styles.emptyTitle}>Queue is all clear</Text>
          <Text style={styles.mutedText}>
            No agent commissions are currently waiting for admin review. When new verified patient payments occur, they will automatically appear here.
          </Text>
        </Card>
      ) : (
        items.map((item) => {
          const isProcessing = approvingId === item.commission_id;
          return (
            <Card key={item.commission_id} style={styles.commissionCard}>
              <View style={styles.cardHeader}>
                <View style={styles.treatmentInfo}>
                  <Text style={styles.treatmentName} numberOfLines={1}>
                    {item.treatment_name || 'Patient treatment'}
                  </Text>
                  <Text style={styles.patientInfo}>
                    Patient: {item.patient_name} ({item.patient_phone_e164})
                  </Text>
                </View>
                <Text style={styles.commissionAmount}>
                  {formatMoney(item.amount_minor_units, item.currency)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.agentMeta}>
                <View>
                  <Text style={styles.agentLabel}>REFERRING AGENT</Text>
                  <Text style={styles.agentName}>
                    {item.agent_name} <Text style={styles.agentCode}>({item.agent_code})</Text>
                  </Text>
                  <Text style={styles.agentPhone}>{item.agent_phone_e164}</Text>
                </View>
                <View style={styles.badgeWrap}>
                  <CommissionStatusBadge status="pending" />
                  <Text style={styles.tierRate}>{item.tier_percent}% {item.tier_name}</Text>
                </View>
              </View>

              <Text style={styles.dateStamp}>
                Recorded on {formatDate(item.created_at)}
              </Text>

              <Button
                variant="secondary"
                onPress={() => handleApproveSingle(item.commission_id, item.agent_name)}
                loading={isProcessing}
                disabled={approveAllMutation.isPending || (approvingId !== null && !isProcessing)}
              >
                Approve commission
              </Button>
            </Card>
          );
        })
      )}

      <Text style={styles.footerNote}>
        Kezza Administration Console · Actions are cryptographically audited.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  dataCard: { gap: Space.md },
  dataRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.md, borderTopWidth: 1, borderTopColor: Colors.line, paddingTop: Space.md },
  rowMain: { flex: 1, gap: 3 },
  statusText: { color: Colors.tealDark, backgroundColor: Colors.softTeal, paddingHorizontal: Space.sm, paddingVertical: 5, borderRadius: 8, fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  branchRevenue: { color: Colors.ink, fontSize: 14, fontWeight: '900' },
  patientResult: { gap: Space.sm, borderTopWidth: 1, borderTopColor: Colors.line, paddingTop: Space.md },
  overviewCard: { width: '48%', flexGrow: 1, padding: Space.md, gap: Space.xs },
  overviewValue: { color: Colors.ink, fontSize: 21, fontWeight: '900' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Space.sm,
    marginBottom: Space.sm,
  },
  kicker: { color: Colors.teal, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  adminTitle: { color: Colors.ink, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  logoutBtn: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  pressed: { opacity: 0.6 },
  logoutText: { color: Colors.red, fontSize: 13, fontWeight: '700' },
  metricCard: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
    gap: Space.lg,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricLabel: { color: '#9BE7EE', fontSize: 10, letterSpacing: 1.2, fontWeight: '900' },
  metricCount: { color: Colors.white, fontSize: 22, fontWeight: '900', marginTop: 2 },
  amountWrap: { alignItems: 'flex-end' },
  metricAmount: { color: '#68E1EE', fontSize: 22, fontWeight: '900', marginTop: 2 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Space.sm,
  },
  sectionTitle: { color: Colors.ink, fontSize: 18, fontWeight: '800' },
  queueCount: { color: Colors.inkMuted, fontSize: 13, fontWeight: '700' },
  loadingCard: { alignItems: 'center', justifyContent: 'center', padding: Space.xxl, gap: Space.md },
  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: Space.xxl, gap: Space.sm, textAlign: 'center' },
  emptyCheck: {
    color: Colors.green,
    backgroundColor: Colors.greenSoft,
    overflow: 'hidden',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: Space.xs,
  },
  emptyTitle: { color: Colors.ink, fontSize: 18, fontWeight: '800' },
  mutedText: { color: Colors.inkMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  commissionCard: { gap: Space.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Space.md },
  treatmentInfo: { flex: 1 },
  treatmentName: { color: Colors.ink, fontSize: 16, fontWeight: '800' },
  patientInfo: { color: Colors.inkMuted, fontSize: 13, marginTop: 2 },
  commissionAmount: { color: Colors.teal, fontSize: 18, fontWeight: '900' },
  divider: { height: 1, backgroundColor: Colors.line },
  agentMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Space.md },
  agentLabel: { color: Colors.inkMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  agentName: { color: Colors.ink, fontSize: 14, fontWeight: '800', marginTop: 2 },
  agentCode: { color: Colors.teal, fontWeight: '800' },
  agentPhone: { color: Colors.inkMuted, fontSize: 12, marginTop: 1 },
  badgeWrap: { alignItems: 'flex-end', gap: 4 },
  tierRate: { color: Colors.inkMuted, fontSize: 11, fontWeight: '700' },
  dateStamp: { color: Colors.inkMuted, fontSize: 11, marginTop: -Space.xs },
  footerNote: { textAlign: 'center', color: Colors.inkMuted, fontSize: 11, lineHeight: 16, marginTop: Space.md },
});

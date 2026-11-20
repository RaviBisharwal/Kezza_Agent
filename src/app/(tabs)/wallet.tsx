import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { Card, PageHeading, Screen } from '@/components/Screen';
import { CommissionStatusBadge } from '@/components/StatusBadge';
import { Colors, Space } from '@/constants/theme';
import { useAgentEarnings } from '@/features/wallet/hooks';
import { formatDate, formatMoney } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';

export default function WalletScreen() {
  const earnings = useAgentEarnings();
  const currencies = Object.entries(earnings.data?.earnings_by_currency ?? {});

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={earnings.isRefetching}
          onRefresh={() => void earnings.refetch()}
          tintColor={Colors.teal}
        />
      }
    >
      <PageHeading
        eyebrow="Earnings"
        title="Your commission"
        subtitle="Commissions are automatically calculated when a referred patient receives treatment, and credited once approved by Kezza admin."
      />

      {earnings.isError ? (
        <InlineNotice tone="error">
          {getErrorMessage(earnings.error, 'Could not load earnings. Pull down to retry.')}
        </InlineNotice>
      ) : null}

      {earnings.isLoading ? (
        <Card>
          <Text style={styles.muted}>Loading your commission details…</Text>
        </Card>
      ) : earnings.data ? (
        <>
          <Card style={styles.tierCard}>
            <Text style={styles.eyebrow}>CURRENT COMMISSION TIER</Text>
            <Text style={styles.tierName}>{earnings.data.commission_tier}</Text>
            <Text style={styles.tierSub}>
              {earnings.data.tier_percent}% commission rate · {earnings.data.eligible_direct_agents} active direct recruits
            </Text>
          </Card>

          {currencies.length === 0 ? (
            <Card>
              <Text style={styles.emptyTitle}>No commission activity yet</Text>
              <Text style={styles.muted}>
                Commission appears automatically after a verified patient payment is recorded for one of your referrals.
              </Text>
            </Card>
          ) : (
            currencies.map(([currency, totals]) => (
              <View key={currency} style={styles.currencyGroup}>
                <Text style={styles.groupTitle}>{currency} balance</Text>
                <Card>
                  <MoneyRow
                    label="Total earned"
                    value={totals.total_earned_minor_units}
                    currency={currency}
                    strong
                  />
                  <View style={styles.rule} />
                  <MoneyRow label="Approved" value={totals.approved_minor_units} currency={currency} />
                  <MoneyRow label="Pending admin approval" value={totals.pending_minor_units} currency={currency} highlightPending={totals.pending_minor_units > 0} />
                  <MoneyRow label="Paid out" value={totals.paid_minor_units} currency={currency} />
                </Card>
              </View>
            ))
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.groupTitle}>Commission activity</Text>
            <Text style={styles.count}>{earnings.data.ledger.length} entries</Text>
          </View>

          {earnings.data.ledger.length === 0 ? (
            <Card>
              <Text style={styles.muted}>No commission entries have been recorded yet.</Text>
            </Card>
          ) : (
            earnings.data.ledger.slice(0, 30).map((entry) => (
              <Card key={entry.id} style={styles.ledgerCard}>
                <View style={styles.ledgerTop}>
                  <Text style={styles.treatment} numberOfLines={1}>
                    {entry.treatment_name || 'Referral commission'}
                  </Text>
                  <Text style={styles.amount}>{formatMoney(entry.amount_minor_units, entry.currency)}</Text>
                </View>

                <View style={styles.ledgerMeta}>
                  <CommissionStatusBadge status={entry.status} />
                  <Text style={styles.ledgerSub}>
                    {entry.tier_percent}% rate · {formatDate(entry.created_at)}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </>
      ) : (
        <Card>
          <Text style={styles.muted}>Earnings are currently unavailable.</Text>
          <Button variant="secondary" onPress={() => void earnings.refetch()}>
            Try again
          </Button>
        </Card>
      )}

      <Text style={styles.footer}>
        Commissions are tracked on the Kezza ledger with verified audit records.
      </Text>
    </Screen>
  );
}

function MoneyRow({
  label,
  value,
  currency,
  strong = false,
  highlightPending = false,
}: {
  label: string;
  value: number;
  currency: string;
  strong?: boolean;
  highlightPending?: boolean;
}) {
  return (
    <View style={styles.moneyRow}>
      <Text style={[styles.moneyLabel, strong && styles.totalLabel]}>{label}</Text>
      <Text
        style={[
          styles.moneyValue,
          strong && styles.totalValue,
          highlightPending && styles.pendingValue,
        ]}
      >
        {formatMoney(value, currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tierCard: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  eyebrow: { color: '#9BE7EE', fontSize: 10, letterSpacing: 1.2, fontWeight: '900' },
  tierName: { color: Colors.white, fontSize: 22, fontWeight: '900' },
  tierSub: { color: '#D5F5F8', fontSize: 13, lineHeight: 19 },
  currencyGroup: { gap: Space.md },
  groupTitle: { color: Colors.ink, fontSize: 17, fontWeight: '800' },
  moneyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Space.md, alignItems: 'center' },
  moneyLabel: { color: Colors.inkMuted, fontSize: 13 },
  moneyValue: { color: Colors.ink, fontSize: 14, fontWeight: '700' },
  totalLabel: { color: Colors.ink, fontWeight: '800' },
  totalValue: { color: Colors.teal, fontSize: 20, fontWeight: '900' },
  pendingValue: { color: Colors.amber, fontWeight: '800' },
  rule: { height: 1, backgroundColor: Colors.line },
  emptyTitle: { color: Colors.ink, fontWeight: '800', fontSize: 16 },
  muted: { color: Colors.inkMuted, fontSize: 13, lineHeight: 19 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Space.sm },
  count: { color: Colors.inkMuted, fontSize: 12, fontWeight: '700' },
  ledgerCard: { padding: Space.lg, gap: Space.sm },
  ledgerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.md },
  treatment: { flex: 1, color: Colors.ink, fontWeight: '800', fontSize: 15 },
  amount: { color: Colors.teal, fontSize: 15, fontWeight: '900' },
  ledgerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  ledgerSub: { color: Colors.inkMuted, fontSize: 12, fontWeight: '600' },
  footer: { textAlign: 'center', color: Colors.inkMuted, fontSize: 11, lineHeight: 16, marginTop: Space.sm },
});

import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import type { ReferralStatus } from '@/features/referrals/types';

const referralLabels: Record<ReferralStatus, string> = {
  registered: 'Registered',
  contacted: 'Contacted',
  consultation_booked: 'Consultation booked',
  converted: 'Converted',
  not_converted: 'Not converted',
  rejected: 'Closed',
};

export function StatusBadge({ status }: { status: ReferralStatus }) {
  const positive = status === 'converted';
  const progress = status === 'contacted' || status === 'consultation_booked';
  const palette = positive
    ? { bg: Colors.greenSoft, fg: Colors.green }
    : progress
    ? { bg: Colors.amberSoft, fg: Colors.amber }
    : { bg: Colors.softTeal, fg: Colors.tealDark };
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{referralLabels[status] ?? 'Registered'}</Text>
    </View>
  );
}

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'reversed';

const commissionLabels: Record<CommissionStatus, string> = {
  pending: 'Pending approval',
  approved: 'Approved',
  paid: 'Paid',
  reversed: 'Reversed',
};

export function CommissionStatusBadge({ status }: { status: CommissionStatus | string }) {
  const isApproved = status === 'approved';
  const isPaid = status === 'paid';
  const isPending = status === 'pending';
  const palette = isApproved
    ? { bg: Colors.greenSoft, fg: Colors.green }
    : isPaid
    ? { bg: Colors.softTeal, fg: Colors.tealDark }
    : isPending
    ? { bg: Colors.amberSoft, fg: Colors.amber }
    : { bg: Colors.redSoft, fg: Colors.red };

  const label =
    commissionLabels[status as CommissionStatus] ??
    (status.charAt(0).toUpperCase() + status.slice(1));

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
  },
});

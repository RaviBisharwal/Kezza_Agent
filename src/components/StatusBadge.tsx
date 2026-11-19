import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import type { ReferralStatus } from '@/features/referrals/types';

const labels: Record<ReferralStatus, string> = {
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
  const palette = positive ? { bg: Colors.greenSoft, fg: Colors.green } : progress ? { bg: Colors.amberSoft, fg: Colors.amber } : { bg: '#EDF1F2', fg: Colors.inkMuted };
  return <View style={[styles.badge, { backgroundColor: palette.bg }]}><Text style={[styles.text, { color: palette.fg }]}>{labels[status] ?? 'Registered'}</Text></View>;
}

const styles = StyleSheet.create({ badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, alignSelf: 'flex-start' }, text: { fontSize: 11, fontWeight: '800' } });

import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Space } from '@/constants/theme';

export function Button({ children, onPress, loading = false, disabled = false, variant = 'primary' }: PropsWithChildren<{
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet';
}>) {
  const secondary = variant === 'secondary';
  const quiet = variant === 'quiet';
  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, quiet && styles.quiet, (disabled || loading) && styles.disabled, pressed && styles.pressed]}>
      {loading ? <ActivityIndicator color={secondary || quiet ? Colors.teal : Colors.white} /> : <Text style={[styles.label, (secondary || quiet) && styles.secondaryLabel]}>{children}</Text>}
    </Pressable>
  );
}

export function InlineNotice({ children, tone = 'info' }: PropsWithChildren<{ tone?: 'info' | 'success' | 'error' }>) {
  const palette = tone === 'success' ? { background: Colors.greenSoft, color: Colors.green } : tone === 'error' ? { background: Colors.redSoft, color: Colors.red } : { background: Colors.softTeal, color: Colors.tealDark };
  return <View style={[styles.notice, { backgroundColor: palette.background }]}><Text style={[styles.noticeText, { color: palette.color }]}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 14, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Space.xl },
  secondary: { backgroundColor: Colors.softTeal, borderColor: '#C6E1DA', borderWidth: 1 },
  quiet: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78 },
  label: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  secondaryLabel: { color: Colors.tealDark },
  notice: { padding: Space.md, borderRadius: 12 },
  noticeText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
});

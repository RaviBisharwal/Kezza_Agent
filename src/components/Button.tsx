import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Space } from '@/constants/theme';

export function Button({ children, onPress, loading = false, disabled = false, variant = 'primary' }: PropsWithChildren<{
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet' | 'onDark';
}>) {
  const secondary = variant === 'secondary';
  const quiet = variant === 'quiet';
  const onDark = variant === 'onDark';
  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, quiet && styles.quiet, onDark && styles.onDark, (disabled || loading) && styles.disabled, pressed && styles.pressed]}>
      {loading ? <ActivityIndicator color={secondary || quiet || onDark ? Colors.tealDark : Colors.white} /> : <Text style={[styles.label, (secondary || quiet || onDark) && styles.secondaryLabel]}>{children}</Text>}
    </Pressable>
  );
}

export function InlineNotice({ children, tone = 'info' }: PropsWithChildren<{ tone?: 'info' | 'success' | 'error' }>) {
  const palette = tone === 'success' ? { background: Colors.greenSoft, color: Colors.green } : tone === 'error' ? { background: Colors.redSoft, color: Colors.red } : { background: Colors.softTeal, color: Colors.tealDark };
  return <View style={[styles.notice, { backgroundColor: palette.background }]}><Text style={[styles.noticeText, { color: palette.color }]}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 18, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Space.xl },
  secondary: { backgroundColor: Colors.softTeal, borderColor: Colors.line, borderWidth: 1 },
  onDark: { backgroundColor: '#E4F8FB', borderColor: '#BDE9F0', borderWidth: 1 },
  quiet: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78 },
  label: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  secondaryLabel: { color: Colors.tealDark },
  notice: { padding: Space.md, borderRadius: 12 },
  noticeText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
});

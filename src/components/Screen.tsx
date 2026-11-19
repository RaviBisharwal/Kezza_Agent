import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Space } from '@/constants/theme';

export function Screen({ children, scroll = true, bottom, refreshControl }: PropsWithChildren<{ scroll?: boolean; bottom?: ReactNode; refreshControl?: ReactElement<RefreshControlProps> | null }>) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={refreshControl ?? undefined}>{children}</ScrollView> : <View style={styles.content}>{children}</View>}
      {bottom}
    </SafeAreaView>
  );
}

export function PageHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.heading}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: Colors.canvas },
  content: { padding: Space.xl, paddingBottom: Space.xxxl, gap: Space.lg, flexGrow: 1 },
  heading: { gap: Space.xs, marginBottom: Space.xs },
  eyebrow: { color: Colors.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: Colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.inkMuted, fontSize: 15, lineHeight: 22, marginTop: 2 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, borderColor: Colors.line, borderWidth: 1, padding: Space.xl, gap: Space.md },
});

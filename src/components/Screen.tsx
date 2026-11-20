import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Space } from '@/constants/theme';

/**
 * Safe back navigation: dismisses a modal if possible,
 * goes back in stack if there's history, or replaces to fallback.
 */
export function goBack(fallback: string = '/(auth)/login') {
  if (router.canDismiss()) {
    router.dismiss();
  } else if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as Parameters<typeof router.replace>[0]);
  }
}

/** Slim sticky back-navigation bar rendered above the scroll content. */
export function BackBar({ onPress, label = 'Back' }: { onPress?: () => void; label?: string }) {
  const handlePress = onPress ?? (() => goBack());
  return (
    <View style={barStyles.bar}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Go back: ${label}`}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={({ pressed }) => [barStyles.btn, pressed && barStyles.pressed]}
      >
        {/* Arrow pill badge */}
        <View style={barStyles.arrowBadge}>
          <Text style={barStyles.arrowText}>{'‹'}</Text>
        </View>
        <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      </Pressable>
    </View>
  );
}

export function Screen({ children, scroll = true, bottom, header, refreshControl }: PropsWithChildren<{ scroll?: boolean; bottom?: ReactNode; header?: ReactNode; refreshControl?: ReactElement<RefreshControlProps> | null }>) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {header ?? null}
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

const barStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: Colors.canvas,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.xs,
    borderRadius: 10,
  },
  pressed: { opacity: 0.5 },
  arrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.softTeal,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: Colors.tealDark,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: -1,
  },
  label: {
    color: Colors.tealDark,
    fontSize: 15,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: Colors.canvas },
  content: { padding: Space.xl, paddingBottom: 96, gap: Space.lg, flexGrow: 1 },
  heading: { gap: Space.xs, marginBottom: Space.xs },
  eyebrow: { color: Colors.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: Colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.inkMuted, fontSize: 15, lineHeight: 22, marginTop: 2 },
  card: { backgroundColor: Colors.surface, borderRadius: 22, borderColor: Colors.line, borderWidth: 1, padding: Space.xl, gap: Space.md },
});

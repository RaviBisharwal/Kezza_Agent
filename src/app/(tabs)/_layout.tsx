import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';
import { Colors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Tab Icons — drawn with View primitives, no library required.
// ---------------------------------------------------------------------------

function HomeIcon({ color, size }: { color: ColorValue; size: number }) {
  const s = size * 0.88;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{
        position: 'absolute', top: 0, alignSelf: 'center',
        width: 0, height: 0,
        borderLeftWidth: s * 0.46, borderRightWidth: s * 0.46,
        borderBottomWidth: s * 0.5,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
      }} />
      <View style={{ width: s * 0.56, height: s * 0.44, backgroundColor: color, borderTopLeftRadius: 1, borderTopRightRadius: 1 }}>
        <View style={{
          position: 'absolute', bottom: 0, alignSelf: 'center',
          width: s * 0.2, height: s * 0.25,
          backgroundColor: 'rgba(255,255,255,0.88)',
          borderTopLeftRadius: 2, borderTopRightRadius: 2,
        }} />
      </View>
    </View>
  );
}

function PeopleIcon({ color, size }: { color: ColorValue; size: number }) {
  const s = size * 0.88;
  const hr = s * 0.13;
  const bh = s * 0.26;
  const bw = s * 0.28;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row', gap: s * 0.05 }}>
      <View style={{ alignItems: 'center', marginRight: -(s * 0.09), opacity: 0.55 }}>
        <View style={{ width: hr * 2, height: hr * 2, borderRadius: hr, backgroundColor: color }} />
        <View style={{ width: bw * 0.82, height: bh * 0.88, backgroundColor: color, borderTopLeftRadius: 5, borderTopRightRadius: 5, marginTop: 2 }} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: hr * 2, height: hr * 2, borderRadius: hr, backgroundColor: color }} />
        <View style={{ width: bw, height: bh, backgroundColor: color, borderTopLeftRadius: 5, borderTopRightRadius: 5, marginTop: 2 }} />
      </View>
    </View>
  );
}

function WalletIcon({ color, size }: { color: ColorValue; size: number }) {
  const s = size * 0.88;
  return (
    <View style={{ width: s, height: s * 0.74, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: s, height: s * 0.66,
        borderRadius: s * 0.13,
        borderWidth: s * 0.072,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: s * 0.09,
      }}>
        <View style={{ width: s * 0.24, height: s * 0.24, borderRadius: s * 0.12, backgroundColor: color }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// GlassTabBackground — layered frosted-glass look using only RN primitives.
// Renders inside the tab bar bounds via tabBarBackground prop.
// ---------------------------------------------------------------------------

function GlassTabBackground() {
  return (
    <View style={glass.root} pointerEvents="none">
      {/* Layer 1: frosted canvas base */}
      <View style={glass.base} />
      {/* Layer 2: white surface sheen */}
      <View style={glass.sheen} />
      {/* Layer 3: 1px top rim highlight */}
      <View style={glass.rim} />
      {/* Layer 4: soft teal ambient glow */}
      <View style={glass.glow} />
    </View>
  );
}

const FILL = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

const glass = StyleSheet.create({
  root:  { ...FILL, overflow: 'hidden' },
  base:  { ...FILL, backgroundColor: 'rgba(241,252,254,0.93)' },
  sheen: { ...FILL, top: 1, backgroundColor: 'rgba(255,255,255,0.42)', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  rim:   { position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.95)' },
  glow:  { position: 'absolute', bottom: -20, alignSelf: 'center', width: 140, height: 50, borderRadius: 70, backgroundColor: 'rgba(5,170,189,0.10)' },
});

// ---------------------------------------------------------------------------
// Active tab indicator pill
// ---------------------------------------------------------------------------
function ActivePill() {
  return <View style={{ width: 26, height: 3, borderRadius: 2, backgroundColor: Colors.teal, marginBottom: 3, alignSelf: 'center' }} />;
}

function Gap() { return <View style={{ height: 6 }} />; }

// ---------------------------------------------------------------------------
// Tab Layout
// ---------------------------------------------------------------------------

const TAB_HEIGHT = Platform.OS === 'ios' ? 80 : 64;
const TAB_BOTTOM = Platform.OS === 'ios' ? 22 : 6;

export default function AgentTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Colors.inkMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 0 },
        tabBarStyle: {
          // position:absolute is SAFE now because the entire navigator
          // sits inside the maxWidth:480 frame in _layout.tsx.
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: TAB_HEIGHT,
          paddingTop: 4,
          paddingBottom: TAB_BOTTOM,
          borderTopWidth: 0,          // rim drawn by GlassTabBackground
          backgroundColor: 'transparent',
          // Soft upward teal shadow
          shadowColor: '#05AABD',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.13,
          shadowRadius: 20,
          elevation: 20,
        },
        tabBarBackground: () => <GlassTabBackground />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarAccessibilityLabel: 'Overview',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? <ActivePill /> : <Gap />}
              <HomeIcon color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarAccessibilityLabel: 'Patients',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? <ActivePill /> : <Gap />}
              <PeopleIcon color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Earnings',
          tabBarAccessibilityLabel: 'Earnings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? <ActivePill /> : <Gap />}
              <WalletIcon color={color} size={size} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

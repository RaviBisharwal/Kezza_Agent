import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AgentTabs() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.teal,
      tabBarInactiveTintColor: Colors.inkMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: 3 },
      tabBarStyle: { width: '100%', maxWidth: 480, alignSelf: 'center', height: 66, paddingTop: 8, borderTopColor: Colors.line, backgroundColor: Colors.white },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Overview', tabBarAccessibilityLabel: 'Overview' }} />
      <Tabs.Screen name="patients" options={{ title: 'Patients', tabBarAccessibilityLabel: 'Patients' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Earnings', tabBarAccessibilityLabel: 'Earnings' }} />
    </Tabs>
  );
}

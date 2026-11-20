import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { BackBar, Card, PageHeading, Screen } from '@/components/Screen';
import { Colors } from '@/constants/theme';
import { useRegisterAgent } from '@/features/auth/hooks';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';

export default function RegisterScreen() {
  const { phone: rawPhone } = useLocalSearchParams<{ phone?: string }>();
  const phone = typeof rawPhone === 'string' ? rawPhone : '';
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const registration = useRegisterAgent();

  async function submit() {
    setError('');
    if (name.trim().length < 2) { setError('Enter your full name to continue.'); return; }
    try {
      const result = await registration.mutateAsync({ phone_e164: phone, full_name: name.trim(), role: 'agent' });
      const user = result.user;
      if (user.role !== 'agent' || !user.agent_id) { setError('Kezza could not create an agent profile for this account. Contact support.'); return; }
      await useAuthStore.getState().signIn(result.access_token, {
        id: user.id, fullName: user.full_name, phone: user.phone_e164, agentId: user.agent_id, agentCode: user.agent_code ?? undefined,
      });
      router.replace('/(tabs)');
    } catch (caught) { setError(getErrorMessage(caught, 'We could not create your agent account.')); }
  }

  return (
    <Screen header={<BackBar label="Verify number" />}>
      <PageHeading eyebrow="Agent profile" title="Complete your setup" subtitle="Your mobile number is verified. Add your name to create your agent profile." />
      <Card>
        <FormField label="Full name" value={name} onChangeText={setName} placeholder="Enter your full name" autoCapitalize="words" maxLength={150} />
        <FormField label="Verified mobile number" value={phone} onChangeText={() => undefined} placeholder="+91" editable={false} />
        <Text style={styles.note}>Your agent referral code will be assigned by Kezza after registration.</Text>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <Button onPress={submit} loading={registration.isPending}>Create agent account</Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ note: { color: Colors.inkMuted, fontSize: 13, lineHeight: 19 } });

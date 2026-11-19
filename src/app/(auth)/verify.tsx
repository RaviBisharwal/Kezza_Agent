import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { Card, PageHeading, Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { Colors } from '@/constants/theme';
import { useVerifyOtp } from '@/features/auth/hooks';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ phone?: string; devCode?: string }>();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const devCode = typeof params.devCode === 'string' ? params.devCode : '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const verifyOtp = useVerifyOtp();

  async function submit() {
    setError('');
    if (!/^\d{6}$/.test(code)) { setError('Enter the six-digit code.'); return; }
    try {
      const result = await verifyOtp.mutateAsync({ phone_e164: phone, otp_code: code });
      if (result.status === 'needs_registration') {
        router.replace({ pathname: '/(auth)/register', params: { phone } });
        return;
      }
      const user = result.user;
      if (user?.role !== 'agent' || !user.agent_id || !result.access_token) {
        setError('This mobile number is not linked to an active agent account. Please use an agent number or contact Kezza support.');
        return;
      }
      await useAuthStore.getState().signIn(result.access_token, {
        id: user.id, fullName: user.full_name, phone: user.phone_e164, agentId: user.agent_id, agentCode: user.agent_code ?? undefined,
      });
      router.replace('/(tabs)');
    } catch (caught) { setError(getErrorMessage(caught, 'That code could not be verified.')); }
  }

  return (
    <Screen>
      <PageHeading eyebrow="Step 2 of 2" title="Verify your number" subtitle={`Enter the six-digit code sent to ${phone || 'your mobile number'}.`} />
      {devCode ? <InlineNotice tone="info">Development OTP: {devCode}. This appears only when the API is running in development mode.</InlineNotice> : null}
      <Card>
        <FormField label="Verification code" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad" maxLength={6} />
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <Button onPress={submit} loading={verifyOtp.isPending}>Verify and sign in</Button>
        <Button variant="quiet" onPress={() => router.back()}>Change mobile number</Button>
      </Card>
      <Text style={styles.security}>Your account is checked by the Kezza API before access is granted.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({ security: { color: Colors.inkMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 'auto', paddingTop: 24 } });

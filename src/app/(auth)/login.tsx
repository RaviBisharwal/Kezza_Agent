import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { Card, PageHeading, Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { Colors, Space } from '@/constants/theme';
import { useRequestOtp } from '@/features/auth/hooks';
import { getErrorMessage } from '@/lib/errors';
import { isIndianMobile, normalizeIndianMobile, toE164 } from '@/lib/phone';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const requestOtp = useRequestOtp();
  const normalized = normalizeIndianMobile(phone);

  function handlePhoneChange(value: string) {
    setPhone(normalizeIndianMobile(value));
    if (error) setError('');
  }

  async function submit() {
    setError('');
    if (!isIndianMobile(normalized)) { setError('Enter a valid 10-digit Indian mobile number.'); return; }
    try {
      const result = await requestOtp.mutateAsync(toE164(normalized));
      router.push({ pathname: '/(auth)/verify', params: { phone: toE164(normalized), devCode: result.dev_code ?? '' } });
    } catch (caught) { setError(getErrorMessage(caught, 'We could not send the verification code.')); }
  }

  return (
    <Screen>
      <View style={styles.brand}><View style={styles.mark}><Text style={styles.markText}>K</Text></View><Text style={styles.brandName}>KEZZA <Text style={styles.brandAccent}>AGENT</Text></Text></View>
      <PageHeading eyebrow="Agent workspace" title="Welcome back" subtitle="Sign in to manage patient referrals and follow up with confidence." />
      <Card>
        <Text style={styles.cardTitle}>Secure sign in</Text>
        <Text style={styles.body}>We’ll send a one-time verification code to your mobile number.</Text>
        <FormField
          label="Mobile number"
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder="9876543210"
          keyboardType="number-pad"
          maxLength={10}
          prefix="+91"
        />
        <Text style={styles.helper}>Enter your 10-digit mobile number.</Text>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <Button onPress={submit} loading={requestOtp.isPending}>Continue with OTP</Button>
      </Card>

      <View style={styles.adminDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>MANAGEMENT</Text>
        <View style={styles.dividerLine} />
      </View>

      <Button
        variant="secondary"
        onPress={() => router.push('/(auth)/admin-login')}
      >
        Sign in as Administrator
      </Button>

      <Text style={styles.footnote}>Agent & Administrator workspaces · Secure session management.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginTop: Space.xxl, marginBottom: Space.md },
  mark: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
  markText: { color: Colors.white, fontSize: 25, fontWeight: '900' },
  brandName: { color: Colors.ink, fontSize: 15, letterSpacing: 1.3, fontWeight: '900' },
  brandAccent: { color: Colors.teal },
  cardTitle: { fontSize: 19, fontWeight: '800', color: Colors.ink },
  body: { color: Colors.inkMuted, fontSize: 14, lineHeight: 21 },
  helper: { color: Colors.inkMuted, fontSize: 12, lineHeight: 18, marginTop: -Space.xs },
  adminDivider: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginVertical: Space.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.line },
  dividerText: { color: Colors.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  footnote: { marginTop: 'auto', paddingTop: Space.xl, textAlign: 'center', color: Colors.inkMuted, fontSize: 12, lineHeight: 18 },
});

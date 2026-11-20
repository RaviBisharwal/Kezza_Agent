import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { BackBar, Card, PageHeading, Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { Colors, Space } from '@/constants/theme';
import { useAdminLogin } from '@/features/auth/hooks';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const adminLogin = useAdminLogin();

  function handleEmailChange(value: string) {
    setEmail(value.trim());
    if (error) setError('');
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (error) setError('');
  }

  async function submit() {
    setError('');
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      const result = await adminLogin.mutateAsync({ email, password });
      const user = result.user;
      await useAuthStore.getState().signIn(result.access_token, {
        id: user.id,
        fullName: user.full_name,
        phone: user.phone_e164,
        email: user.email ?? undefined,
        role: 'admin',
      });
      router.replace('/admin');
    } catch (caught) {
      setError(getErrorMessage(caught, 'Invalid email or password. Please try again.'));
    }
  }

  return (
    <Screen header={<BackBar label="Agent sign in" />}>
      {/* Brand mark */}
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Text style={styles.markText}>★</Text>
        </View>
        <Text style={styles.brandName}>
          KEZZA <Text style={styles.brandAccent}>ADMIN</Text>
        </Text>
      </View>

      <PageHeading
        eyebrow="Platform control"
        title="Administration portal"
        subtitle="Sign in with your administrator credentials to review commissions and manage platform operations."
      />

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Secure admin sign-in</Text>

        <FormField
          label="Email address"
          value={email}
          onChangeText={handleEmailChange}
          placeholder="admin@kezza.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormField
          label="Password"
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          rightElement={
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </Pressable>
          }
        />

        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

        <Button onPress={submit} loading={adminLogin.isPending}>
          Sign in to Admin Portal
        </Button>
      </Card>

      <Text style={styles.footnote}>
        Provisioned administrators only · Credentials are securely verified.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginTop: Space.sm, marginBottom: Space.xs },
  mark: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  markText: { color: Colors.teal, fontSize: 20, fontWeight: '900' },
  brandName: { color: Colors.ink, fontSize: 15, letterSpacing: 1.3, fontWeight: '900' },
  brandAccent: { color: Colors.teal },
  card: { borderColor: Colors.line, gap: Space.md },
  cardTitle: { fontSize: 19, fontWeight: '800', color: Colors.ink },
  eyeIcon: { fontSize: 18 },
  footnote: { textAlign: 'center', color: Colors.inkMuted, fontSize: 12, lineHeight: 18, marginTop: Space.xl },
});

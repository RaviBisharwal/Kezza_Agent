import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, InlineNotice } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { BackBar, Card, PageHeading, Screen } from '@/components/Screen';
import { Colors, Space } from '@/constants/theme';
import { useCreateReferralLead } from '@/features/referrals/hooks';
import { getErrorMessage } from '@/lib/errors';
import { isIndianMobile, normalizeIndianMobile, toE164 } from '@/lib/phone';

function dismissModal() {
  // add-patient is a modal — router.dismiss() is the correct API.
  // Falls back to replace so the app never shows a dead GO_BACK error.
  if (router.canDismiss()) {
    router.dismiss();
  } else {
    router.replace('/(tabs)');
  }
}

export default function AddPatientScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const createLead = useCreateReferralLead();
  const mobile = normalizeIndianMobile(phone);

  async function submit() {
    setError('');
    if (name.trim().length < 2) { setError("Enter the patient's full name."); return; }
    if (!isIndianMobile(mobile)) { setError('Enter a valid 10-digit Indian mobile number.'); return; }
    if (!consent) { setError('Confirm that the patient agreed to have their details shared with Kezza.'); return; }
    try {
      await createLead.mutateAsync({
        patient_name: name.trim(),
        patient_phone_e164: toE164(mobile),
        ...(service.trim() ? { service_interest: service.trim() } : {}),
      });
    } catch (caught) { setError(getErrorMessage(caught, 'The patient referral could not be saved.')); }
  }

  if (createLead.isSuccess) {
    return (
      <Screen header={<BackBar onPress={dismissModal} label="Overview" />}>
        <PageHeading eyebrow="Referral created" title="Patient added" subtitle="The referral is now linked to your agent account." />
        <Card>
          <Text style={styles.successMark}>✓</Text>
          <Text style={styles.successTitle}>{createLead.data.patient_name}</Text>
          <Text style={styles.muted}>Status: Registered</Text>
          <Text style={styles.muted}>You can track this referral in your Patients list.</Text>
        </Card>
        <Button onPress={dismissModal}>Done</Button>
        <Button variant="secondary" onPress={() => { createLead.reset(); setName(''); setPhone(''); setService(''); setConsent(false); }}>Add another patient</Button>
      </Screen>
    );
  }

  return (
    <Screen header={<BackBar onPress={dismissModal} label="Overview" />}>
      <PageHeading eyebrow="New referral" title="Add a patient" subtitle="Create a tracked referral for a patient who has agreed to be contacted by Kezza." />
      <Card>
        <FormField label="Patient full name" value={name} onChangeText={setName} placeholder="Enter full name" autoCapitalize="words" maxLength={150} />
        <FormField label="Mobile number" value={phone} onChangeText={setPhone} placeholder="98765 43210" keyboardType="phone-pad" maxLength={14} />
        <FormField label="Service interest (optional)" value={service} onChangeText={setService} placeholder="For example, dental care" autoCapitalize="sentences" maxLength={120} />
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent((c) => !c)} style={styles.consentRow}>
          <View style={[styles.checkbox, consent && styles.checked]}>{consent ? <Text style={styles.check}>✓</Text> : null}</View>
          <Text style={styles.consentText}>The patient has agreed that I may share these details with Kezza for referral follow-up.</Text>
        </Pressable>
        <InlineNotice tone="info">The current backend accepts the referral details but does not store a consent record. Do not submit patient details without permission.</InlineNotice>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <Button onPress={submit} loading={createLead.isPending}>Save patient referral</Button>
        <Button variant="quiet" onPress={dismissModal}>Cancel</Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.md, paddingVertical: Space.xs },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  check: { color: Colors.white, fontSize: 14, fontWeight: '900' },
  consentText: { flex: 1, color: Colors.ink, fontSize: 13, lineHeight: 19 },
  successMark: { color: Colors.green, backgroundColor: Colors.greenSoft, overflow: 'hidden', width: 44, height: 44, borderRadius: 22, textAlign: 'center', textAlignVertical: 'center', fontSize: 25, fontWeight: '900' },
  successTitle: { color: Colors.ink, fontSize: 19, fontWeight: '800' },
  muted: { color: Colors.inkMuted, fontSize: 14, lineHeight: 20 },
});

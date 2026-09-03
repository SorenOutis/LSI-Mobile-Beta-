import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    terms: false,
  });

  // Validation mirrors Register.vue + ValidationRules.php
  const firstNameValid = useMemo(() => {
    const v = form.first_name.trim();
    return v.length >= 2 && v.length <= 255;
  }, [form.first_name]);
  const middleNameValid = useMemo(() => form.middle_name.trim().length <= 255, [form.middle_name]);
  const lastNameValid = useMemo(() => {
    const v = form.last_name.trim();
    return v.length >= 2 && v.length <= 255;
  }, [form.last_name]);
  const emailValid = useMemo(() => EMAIL_PATTERN.test(form.email.trim()), [form.email]);
  const passwordValid = useMemo(() => form.password.length >= 8 && /[a-zA-Z]/.test(form.password) && /\d/.test(form.password), [form.password]);
  const confirmValid = useMemo(() => form.password_confirmation.length > 0 && form.password_confirmation === form.password, [form.password, form.password_confirmation]);
  const termsValid = form.terms;

  const passwordScore = useMemo(() => {
    let s = 0;
    if (form.password.length >= 8) s++;
    if (/[a-zA-Z]/.test(form.password)) s++;
    if (/\d/.test(form.password)) s++;
    if (/[^A-Za-z0-9]/.test(form.password)) s++;
    return s;
  }, [form.password]);

  const meterLabel = passwordScore <= 1 ? 'Weak' : passwordScore === 2 ? 'Fair' : passwordScore === 3 ? 'Good' : 'Strong';
  const meterColor = passwordScore <= 1 ? '#EF4444' : passwordScore === 2 ? '#F59E0B' : '#10B981';

  const canProceedStep0 = firstNameValid && middleNameValid && lastNameValid && emailValid && passwordValid && confirmValid;
  const canSubmit = termsValid;

  const markTouchedStep0 = () => setTouched({ ...touched, first_name: true, last_name: true, middle_name: true, email: true, password: true, password_confirmation: true });

  const goNext = () => {
    markTouchedStep0();
    if (!canProceedStep0) return;
    setStep(1);
  };

  const onSubmit = async () => {
    if (!canSubmit) {
      setTouched({ ...touched, terms: true });
      Alert.alert('Terms required', 'You must accept the Terms and Conditions.');
      return;
    }
    setProcessing(true);
    try {
      await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        middle_name: form.middle_name.trim() || null,
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        terms: form.terms ? '1' : '0',
      });
      router.replace('/(tabs)' as any);
    } catch (e) {
      Alert.alert('Registration failed', errorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  const err = (key: string, msg: string) => (touched[key] ? msg : '');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.branding}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>LSI</Text>
          </View>
          <Text style={styles.logoSub}>KOAMISHIN</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Complete the steps below to get started</Text>
          </View>

          {/* Stepper - mirrors Register.vue */}
          <View style={styles.stepper}>
            <View style={styles.stepperTop}>
              <Text style={styles.stepCount}>Step {step + 1} of 2</Text>
              <Text style={styles.stepTitle}>{step === 0 ? 'Your details and password' : 'Review & confirm'}</Text>
            </View>
            <View style={styles.stepperRow}>
              <TouchableOpacity onPress={() => step === 1 && setStep(0)} style={styles.stepNode}>
                <View style={[styles.stepCircle, step > 0 ? styles.stepDone : step === 0 ? styles.stepActive : styles.stepIdle]}>
                  {step > 0 ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={[styles.stepNum, step === 0 && { color: '#D96A3E' }]}>1</Text>}
                </View>
                <Text style={[styles.stepLabel, step === 0 && { color: '#1A1E22' }]}>Details</Text>
              </TouchableOpacity>
              <View style={[styles.connector, step >= 1 && { backgroundColor: '#D96A3E' }]} />
              <View style={styles.stepNode}>
                <View style={[styles.stepCircle, step === 1 ? styles.stepActive : styles.stepIdle]}>
                  <Text style={[styles.stepNum, step === 1 && { color: '#D96A3E' }]}>2</Text>
                </View>
                <Text style={[styles.stepLabel, step === 1 && { color: '#1A1E22' }]}>Confirm</Text>
              </View>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFg, { width: step === 0 ? '50%' : '100%' }]} />
            </View>
          </View>

          {step === 0 ? (
            <View style={{ gap: 14 }}>
              <View style={styles.row2}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>First name</Text>
                  <View style={[styles.inputWrap, touched.first_name && !firstNameValid && styles.inputError]}>
                    <TextInput value={form.first_name} onChangeText={(v) => setForm({ ...form, first_name: v })} onBlur={() => setTouched({ ...touched, first_name: true })} placeholder="John" placeholderTextColor="#9AA0A6" style={styles.input} />
                  </View>
                  {!!err('first_name', !firstNameValid ? 'First name 2-255 chars.' : '') && <Text style={styles.error}>{err('first_name', 'First name 2-255 chars.')}</Text>}
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Last name</Text>
                  <View style={[styles.inputWrap, touched.last_name && !lastNameValid && styles.inputError]}>
                    <TextInput value={form.last_name} onChangeText={(v) => setForm({ ...form, last_name: v })} onBlur={() => setTouched({ ...touched, last_name: true })} placeholder="Doe" placeholderTextColor="#9AA0A6" style={styles.input} />
                  </View>
                  {!!err('last_name', !lastNameValid ? 'Last name 2-255 chars.' : '') && <Text style={styles.error}>{err('last_name', 'Last name 2-255 chars.')}</Text>}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Middle name (optional)</Text>
                <View style={[styles.inputWrap, touched.middle_name && !middleNameValid && styles.inputError]}>
                  <TextInput value={form.middle_name} onChangeText={(v) => setForm({ ...form, middle_name: v })} onBlur={() => setTouched({ ...touched, middle_name: true })} placeholder="Optional" placeholderTextColor="#9AA0A6" style={styles.input} />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email address</Text>
                <View style={[styles.inputWrap, touched.email && !emailValid && styles.inputError]}>
                  <TextInput value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} onBlur={() => setTouched({ ...touched, email: true })} placeholder="you@example.com" placeholderTextColor="#9AA0A6" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                </View>
                {!!err('email', !emailValid ? 'Valid email required.' : '') && <Text style={styles.error}>Valid email required.</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrap, touched.password && !passwordValid && styles.inputError]}>
                  <TextInput value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} onBlur={() => setTouched({ ...touched, password: true })} placeholder="••••••••" placeholderTextColor="#9AA0A6" secureTextEntry={!showPassword} style={[styles.input, { flex: 1 }]} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6B7280" /></TouchableOpacity>
                </View>
                {!!err('password', !passwordValid ? '8+ chars, letters & numbers.' : '') && <Text style={styles.error}>8+ chars, letters & numbers required.</Text>}
                {form.password.length > 0 && (
                  <View style={{ gap: 6, marginTop: 4 }}>
                    <View style={styles.meterRow}>
                      {[1, 2, 3, 4].map((s) => (
                        <View key={s} style={[styles.meterSeg, { backgroundColor: s <= passwordScore ? meterColor : '#EAE5DE' }]} />
                      ))}
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: meterColor }}>{meterLabel} password</Text>
                  </View>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm password</Text>
                <View style={[styles.inputWrap, touched.password_confirmation && !confirmValid && styles.inputError]}>
                  <TextInput value={form.password_confirmation} onChangeText={(v) => setForm({ ...form, password_confirmation: v })} onBlur={() => setTouched({ ...touched, password_confirmation: true })} placeholder="••••••••" placeholderTextColor="#9AA0A6" secureTextEntry={!showPassword} style={styles.input} />
                </View>
                {form.password_confirmation.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Ionicons name={confirmValid ? 'checkmark-circle' : 'close-circle'} size={14} color={confirmValid ? '#10B981' : '#EF4444'} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: confirmValid ? '#10B981' : '#EF4444' }}>{confirmValid ? 'Passwords match' : "Passwords don't match"}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.hint}>Use at least 8 characters with letters and numbers.</Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <View style={styles.reviewCard}>
                <View style={styles.reviewHead}>
                  <Text style={styles.reviewHeadText}>Review your details</Text>
                </View>
                <View style={styles.reviewRow}>
                  <View>
                    <Text style={styles.reviewLabel}>Full name</Text>
                    <Text style={styles.reviewValue}>{[form.first_name, form.middle_name, form.last_name].filter(Boolean).join(' ') || '—'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(0)}><Text style={styles.editLink}>Edit</Text></TouchableOpacity>
                </View>
                <View style={styles.reviewRow}>
                  <View>
                    <Text style={styles.reviewLabel}>Email address</Text>
                    <Text style={styles.reviewValue}>{form.email || '—'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(0)}><Text style={styles.editLink}>Edit</Text></TouchableOpacity>
                </View>
                <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
                  <View>
                    <Text style={styles.reviewLabel}>Password</Text>
                    <Text style={styles.reviewValue}>••••••••••</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(0)}><Text style={styles.editLink}>Edit</Text></TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.termsRow} onPress={() => setForm({ ...form, terms: !form.terms })}>
                <View style={[styles.checkbox, form.terms && styles.checkboxChecked]}>{form.terms && <Ionicons name="checkmark" size={12} color="#fff" />}</View>
                <Text style={styles.termsText}>I accept the </Text>
                <TouchableOpacity onPress={() => setShowTermsModal(true)}><Text style={styles.termsLink}>Terms and Conditions</Text></TouchableOpacity>
              </TouchableOpacity>
              {touched.terms && !termsValid && <Text style={styles.error}>You must accept the Terms.</Text>}
              <Text style={styles.hintCenter}>Selecting Create account will finalize your registration.</Text>
            </View>
          )}

          {/* Navigation */}
          <View style={styles.navRow}>
            {step > 0 ? (
              <TouchableOpacity style={styles.outlineBtn} onPress={() => setStep(0)}>
                <Ionicons name="chevron-back" size={16} color="#1A1E22" />
                <Text style={styles.outlineText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            {step === 0 ? (
              <TouchableOpacity style={[styles.primaryBtn, !canProceedStep0 && { opacity: 0.5 }]} onPress={goNext}>
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.primaryBtn, processing && { opacity: 0.7 }]} onPress={onSubmit} disabled={processing}>
                <Text style={styles.primaryBtnText}>{processing ? 'Creating...' : 'Create account'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerMuted}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Log in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Terms Modal */}
        <Modal visible={showTermsModal} transparent animationType="fade" onRequestClose={() => setShowTermsModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Terms and Conditions</Text>
              <Text style={styles.modalSub}>Effective date: April 17, 2026.</Text>
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {[
                  ['1. Account Responsibility', 'You are responsible for maintaining confidentiality of your credentials.'],
                  ['2. Acceptable Use', 'Do not abuse, disrupt, scrape, or attempt unauthorized access.'],
                  ['3. Content and Conduct', 'You retain ownership of submitted content, grant LUA V6 permission to process it.'],
                  ['4. Availability', 'We may update, suspend, or discontinue parts of the service without notice.'],
                  ['5. Limitation of Liability', 'Platform is provided as-is, not liable for indirect damages.'],
                  ['6. Changes to Terms', 'Terms may be revised; continued use means acceptance.'],
                ].map(([h, p]) => (
                  <View key={h} style={{ marginBottom: 12 }}>
                    <Text style={styles.modalHeading}>{h}</Text>
                    <Text style={styles.modalP}>{p}</Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowTermsModal(false)}>
                <Text style={styles.primaryBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
  branding: { alignItems: 'center', gap: 8, marginBottom: 12 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: '900', color: '#1A1E22' },
  logoSub: { fontSize: 11, letterSpacing: 3, color: '#6B7280', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 16, gap: 14 },
  header: { alignItems: 'center', gap: 6 },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1E22', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  stepper: { gap: 10 },
  stepperTop: { flexDirection: 'row', justifyContent: 'space-between' },
  stepCount: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  stepTitle: { fontSize: 11, color: '#1A1E22', fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepNode: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepActive: { borderColor: '#D96A3E', backgroundColor: '#FFF0EB' },
  stepDone: { borderColor: '#D96A3E', backgroundColor: '#D96A3E' },
  stepIdle: { borderColor: '#EAE5DE', backgroundColor: '#fff' },
  stepNum: { fontSize: 12, fontWeight: '800', color: '#9AA0A6' },
  stepLabel: { fontSize: 10, color: '#9AA0A6', fontWeight: '600' },
  connector: { flex: 1, height: 1, backgroundColor: '#EAE5DE' },
  progressBg: { height: 6, backgroundColor: '#EAE5DE', borderRadius: 3 },
  progressFg: { height: 6, backgroundColor: '#D96A3E', borderRadius: 3 },
  row2: { flexDirection: 'row', gap: 10 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFEFC' },
  inputError: { borderColor: '#EF4444' },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A1E22' },
  error: { fontSize: 11, color: '#EF4444' },
  hint: { fontSize: 11, color: '#6B7280' },
  hintCenter: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  meterRow: { flexDirection: 'row', gap: 6 },
  meterSeg: { flex: 1, height: 4, borderRadius: 2 },
  reviewCard: { borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, overflow: 'hidden' },
  reviewHead: { backgroundColor: '#F9F7F4', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EAE5DE' },
  reviewHeadText: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EAE5DE' },
  reviewLabel: { fontSize: 11, color: '#6B7280' },
  reviewValue: { fontSize: 13, fontWeight: '700', color: '#1A1E22', marginTop: 2 },
  editLink: { fontSize: 11, fontWeight: '700', color: '#D96A3E' },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#CFCFCF', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#1A1E22', borderColor: '#1A1E22' },
  termsText: { fontSize: 12, color: '#6B7280' },
  termsLink: { fontSize: 12, fontWeight: '700', color: '#1A1E22', textDecorationLine: 'underline' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#15181E', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  outlineText: { fontWeight: '700', fontSize: 13, color: '#1A1E22' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  footerMuted: { fontSize: 12, color: '#6B7280' },
  footerLink: { fontSize: 12, fontWeight: '700', color: '#1A1E22', textDecorationLine: 'underline' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12, maxHeight: '80%' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22', textTransform: 'uppercase' },
  modalSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  modalHeading: { fontSize: 12, fontWeight: '800', color: '#1A1E22', textTransform: 'uppercase' },
  modalP: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 16 },
});

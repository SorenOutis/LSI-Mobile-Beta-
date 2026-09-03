import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';

/**
 * Second leg of a 2FA sign-in. The login screen stores the credentials in
 * AuthContext when the live backend answers {requires_two_factor: true};
 * submitting a code (TOTP or recovery) completes the same login and issues
 * the token.
 */
export default function TwoFactorScreen() {
  const router = useRouter();
  const { pendingTwoFactor, completeTwoFactor, cancelTwoFactor } = useAuth();
  const [showRecovery, setShowRecovery] = useState(false);
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [processing, setProcessing] = useState(false);

  const onSubmit = async () => {
    const val = (showRecovery ? recoveryCode : code).trim();
    if (!val) {
      Alert.alert('Error', 'Please enter the code.');
      return;
    }
    if (!showRecovery && val.length !== 6) {
      Alert.alert('Error', 'Authentication code must be 6 digits.');
      return;
    }
    setProcessing(true);
    try {
      await completeTwoFactor(val);
      router.replace('/(tabs)' as any);
    } catch (e) {
      Alert.alert('Verification failed', errorMessage(e));
      setCode('');
      setRecoveryCode('');
    } finally {
      setProcessing(false);
    }
  };

  const goBack = () => {
    cancelTwoFactor();
    router.back();
  };

  if (!pendingTwoFactor) {
    // Navigated here directly — no sign-in in progress.
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Nothing to verify</Text>
          <Text style={styles.subtitle}>Start a sign-in first.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={goBack}>
            <Text style={styles.primaryBtnText}>Back to log in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.branding}>
          <View style={styles.logoBox}><Text style={styles.logoText}>LSI</Text></View>
          <Text style={styles.logoSub}>KOAMISHIN</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{showRecovery ? 'Recovery code' : 'Authentication code'}</Text>
            <Text style={styles.subtitle}>{showRecovery ? 'Please confirm access to your account by entering one of your emergency recovery codes.' : 'Enter the authentication code provided by your authenticator application.'}</Text>
          </View>

          {!showRecovery ? (
            <View style={styles.otpWrap}>
              <View style={styles.otpRow}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={[styles.otpSlot, code.length > i && { borderColor: '#1A1E22', backgroundColor: '#FFFEFC' }]}>
                    <Text style={styles.otpChar}>{code[i] || ''}</Text>
                  </View>
                ))}
              </View>
              <TextInput value={code} onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} autoFocus style={styles.hiddenInput} />
            </View>
          ) : (
            <View style={styles.field}>
              <Text style={styles.label}>Recovery code</Text>
              <View style={styles.inputWrap}>
                <TextInput value={recoveryCode} onChangeText={setRecoveryCode} placeholder="xxxx-xxxx-xxxx" placeholderTextColor="#9AA0A6" autoCapitalize="none" style={styles.input} />
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.primaryBtn, processing && { opacity: 0.7 }]} onPress={onSubmit} disabled={processing}>
            <Text style={styles.primaryBtnText}>{processing ? 'Verifying...' : 'Continue'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setShowRecovery(!showRecovery); setCode(''); setRecoveryCode(''); }}>
            <Text style={styles.switchText}>or you can <Text style={styles.switchLink}>{showRecovery ? 'login using an authentication code' : 'login using a recovery code'}</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
  branding: { alignItems: 'center', gap: 8, marginBottom: 12 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: '900', color: '#1A1E22' },
  logoSub: { fontSize: 11, letterSpacing: 3, color: '#6B7280', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 20, gap: 16, alignItems: 'center' },
  header: { alignItems: 'center', gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1E22', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  otpWrap: { width: '100%', alignItems: 'center', gap: 8 },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpSlot: { width: 40, height: 48, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  otpChar: { fontSize: 16, fontWeight: '700', color: '#1A1E22' },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  field: { width: '100%', gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFEFC' },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A1E22' },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  switchText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  switchLink: { fontWeight: '700', color: '#1A1E22', textDecorationLine: 'underline' },
});

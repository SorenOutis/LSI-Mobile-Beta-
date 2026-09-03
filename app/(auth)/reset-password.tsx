import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  // The reset token + email must come from the emailed reset link (no fallbacks:
  // a reset without a valid token must never appear to succeed).
  const { token, email } = useLocalSearchParams<{ token?: string; email?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [processing, setProcessing] = useState(false);

  const missingToken = !token || !email;

  const onSubmit = async () => {
    if (missingToken) return;
    if (!password || password !== confirm) {
      Alert.alert('Error', 'Passwords do not match or are empty.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    setProcessing(true);
    try {
      // Fortify-style endpoint on the LUA V6 backend.
      await api.post('/auth/password/reset', {
        token: token as string,
        email: email as string,
        password,
        password_confirmation: confirm,
      });
      Alert.alert('Success', 'Password has been reset. You can now log in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login' as any) },
      ]);
    } catch (e) {
      Alert.alert('Reset failed', errorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

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
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Please enter your new password below</Text>
          </View>

          {missingToken ? (
            <View style={styles.invalidBox}>
              <Text style={styles.invalidText}>
                This reset link is incomplete or expired. Request a new one from the login screen.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(auth)/forgot-password' as any)}>
                <Text style={styles.primaryBtnText}>Request a new link</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Email address</Text>
                <View style={[styles.inputWrap, { backgroundColor: '#F9F7F4' }]}>
                  <TextInput value={email as string} editable={false} style={[styles.input, { color: '#6B7280' }]} />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>New password</Text>
                <View style={styles.inputWrap}>
                  <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#9AA0A6" secureTextEntry style={styles.input} />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm new password</Text>
                <View style={styles.inputWrap}>
                  <TextInput value={confirm} onChangeText={setConfirm} placeholder="••••••••" placeholderTextColor="#9AA0A6" secureTextEntry style={styles.input} />
                </View>
              </View>

              <Text style={styles.hint}>At least 8 characters, with letters and numbers.</Text>

              <TouchableOpacity style={[styles.primaryBtn, processing && { opacity: 0.7 }]} onPress={onSubmit} disabled={processing}>
                <Text style={styles.primaryBtnText}>{processing ? 'Resetting...' : 'Reset password'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
  branding: { alignItems: 'center', gap: 8, marginBottom: 16 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  logoText: { fontSize: 18, fontWeight: '900', color: '#1A1E22' },
  logoSub: { fontSize: 11, letterSpacing: 3, color: '#6B7280', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 24, gap: 14 },
  header: { alignItems: 'center', gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1E22', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  invalidBox: { gap: 12, alignItems: 'center' },
  invalidText: { fontSize: 12, color: '#B45309', textAlign: 'center', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, padding: 12, lineHeight: 16 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFEFC' },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A1E22' },
  hint: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

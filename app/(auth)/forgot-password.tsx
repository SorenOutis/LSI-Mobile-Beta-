import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStatus('We have emailed your password reset link.');
    }, 700);
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
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>
          </View>

          {status && <View style={styles.statusBox}><Text style={styles.statusText}>{status}</Text></View>}

          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrap}>
              <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9AA0A6" keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={styles.input} />
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, processing && { opacity: 0.7 }]} onPress={onSubmit} disabled={processing}>
            <Text style={styles.primaryBtnText}>{processing ? 'Sending link...' : 'Email password reset link'}</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerMuted}>Or, return to </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity><Text style={styles.footerLink}>log in</Text></TouchableOpacity>
            </Link>
          </View>
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
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 20, gap: 16 },
  header: { alignItems: 'center', gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1E22' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  statusBox: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 10, padding: 12 },
  statusText: { fontSize: 12, color: '#065F46', textAlign: 'center', fontWeight: '600' },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFEFC' },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A1E22' },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  footerMuted: { fontSize: 12, color: '#6B7280' },
  footerLink: { fontSize: 12, fontWeight: '700', color: '#1A1E22', textDecorationLine: 'underline' },
});

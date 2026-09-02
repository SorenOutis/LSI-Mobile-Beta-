import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const onResend = async () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStatus('A new verification link has been sent to the email address you provided during registration.');
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.branding}>
          <View style={styles.logoBox}><Text style={styles.logoText}>LSI</Text></View>
          <Text style={styles.logoSub}>KOAMISHIN</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify email</Text>
            <Text style={styles.subtitle}>Please verify your email address by clicking on the link we just emailed to you.</Text>
          </View>

          {status && (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.secondaryBtn, processing && { opacity: 0.7 }]} onPress={onResend} disabled={processing}>
            <Text style={styles.secondaryBtnText}>{processing ? 'Sending...' : 'Resend verification email'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)} style={styles.logoutLink}>
            <Text style={styles.logoutText}>Log out</Text>
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
  title: { fontSize: 20, fontWeight: '800', color: '#1A1E22' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  statusBox: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 10, padding: 12, width: '100%' },
  statusText: { fontSize: 12, color: '#065F46', textAlign: 'center', fontWeight: '600' },
  secondaryBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: '#1A1E22' },
  logoutLink: { paddingVertical: 4 },
  logoutText: { fontSize: 12, fontWeight: '700', color: '#1A1E22', textDecorationLine: 'underline' },
});

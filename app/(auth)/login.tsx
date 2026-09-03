import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, TWO_FACTOR_REQUIRED } from '@/context/AuthContext';
import { ApiError, errorMessage } from '@/lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    setProcessing(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)' as any);
    } catch (e) {
      // Password accepted — the account has 2FA enabled. Continue the same
      // login with the code (the backend re-verifies both in one call).
      if (e instanceof ApiError && e.code === TWO_FACTOR_REQUIRED) {
        router.replace('/(auth)/two-factor' as any);
        return;
      }
      Alert.alert('Login failed', errorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Branding - mirrors AuthCardLayout.vue logo */}
        <View style={styles.branding}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>LSI</Text>
          </View>
          <Text style={styles.logoSub}>KOAMISHIN</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Log in to your account</Text>
            <Text style={styles.subtitle}>Enter your email and password below to log in</Text>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9AA0A6"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9AA0A6"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.forgotRow}>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, processing && { opacity: 0.7 }]} onPress={onSubmit} disabled={processing}>
            <Text style={styles.primaryBtnText}>{processing ? 'Logging in...' : 'Log in'}</Text>
          </TouchableOpacity>

          {/* Social login is handled by the LUA V6 web app (see Settings → Connected accounts). */}

          <View style={styles.footerRow}>
            <Text style={styles.footerMuted}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/' as any)} style={styles.backToWelcome}>
          <Ionicons name="arrow-back" size={14} color="#6B7280" />
          <Text style={styles.backText}>Back to welcome</Text>
        </TouchableOpacity>
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
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 24, gap: 16 },
  header: { alignItems: 'center', gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1E22', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFEFC' },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A1E22' },
  forgotRow: { alignItems: 'flex-end', marginTop: 6 },
  forgotText: { fontSize: 12, color: '#1A1E22', fontWeight: '600', textDecorationLine: 'underline' },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: '#EAE5DE', paddingTop: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EAE5DE' },
  dividerLabel: { fontSize: 10, letterSpacing: 1, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  footerMuted: { fontSize: 12, color: '#6B7280' },
  footerLink: { fontSize: 12, fontWeight: '700', color: '#1A1E22', textDecorationLine: 'underline' },
  backToWelcome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  backText: { fontSize: 12, color: '#6B7280' },
});

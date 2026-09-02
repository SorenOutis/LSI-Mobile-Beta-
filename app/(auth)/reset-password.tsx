import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const token = (params.token as string) || 'demo-token';
  const [email, setEmail] = useState((params.email as string) || 'user@example.com');
  const [password, setPassword] = useState('');
  const [password_confirmation, setConfirm] = useState('');
  const [processing, setProcessing] = useState(false);

  const onSubmit = async () => {
    if (!password || password !== password_confirmation) {
      Alert.alert('Error', 'Passwords do not match or empty.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      Alert.alert('Success', 'Password has been reset.');
      router.replace('/(auth)/login' as any);
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.branding}>
          <View style={styles.logoBox}><Text style={styles.logoText}>LSI</Text></View>
          <Text style={styles.logoSub}>KOAMISHIN</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Please enter your new password below</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: '#F9F7F4' }]}>
              <TextInput value={email} onChangeText={setEmail} editable={false} style={[styles.input, { color: '#6B7280' }]} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#9AA0A6" secureTextEntry style={styles.input} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.inputWrap}>
              <TextInput value={password_confirmation} onChangeText={setConfirm} placeholder="••••••••" placeholderTextColor="#9AA0A6" secureTextEntry style={styles.input} />
            </View>
          </View>

          <Text style={styles.tokenHint}>Token: {token.slice(0, 16)}...</Text>

          <TouchableOpacity style={[styles.primaryBtn, processing && { opacity: 0.7 }]} onPress={onSubmit} disabled={processing}>
            <Text style={styles.primaryBtnText}>{processing ? 'Resetting...' : 'Reset password'}</Text>
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
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 20, gap: 14 },
  header: { alignItems: 'center', gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1E22' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFEFC' },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A1E22' },
  tokenHint: { fontSize: 10, color: '#9AA0A6', textAlign: 'center' },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

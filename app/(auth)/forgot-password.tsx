import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { webLink } from '@/lib/api';

/**
 * Password resets are an e-mail flow on the LUA V6 web app (the reset link is
 * one-time and single-use). This screen points there instead of faking a
 * local reset.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.branding}>
          <View style={styles.logoBox}><Text style={styles.logoText}>LSI</Text></View>
          <Text style={styles.logoSub}>KOAMISHIN</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Reset on the web</Text>
          <Text style={styles.subtitle}>
            Forgot your password? Open the web app and use “Forgot your password?” — a reset
            link is sent to your account e-mail. Then log in here with the new password.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => Linking.openURL(webLink('/forgot-password'))}>
            <Text style={styles.primaryBtnText}>Open the web reset page</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.switchLink}>Back to log in</Text>
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
  title: { fontSize: 20, fontWeight: '800', color: '#1A1E22', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  switchLink: { fontSize: 13, color: '#1A1E22', fontWeight: '700', textDecorationLine: 'underline' },
});

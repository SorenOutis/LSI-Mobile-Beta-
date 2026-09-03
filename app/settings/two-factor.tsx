import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { webLink } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Two-factor status + guidance. Enabling/disabling 2FA is done in the LUA V6
 * web app (it generates recovery codes); the login challenge itself works in
 * the mobile app (see (auth)/two-factor).
 */
export default function TwoFactorSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const twoFAEnabled = Boolean((user as any)?.two_factor_enabled ?? (user as any)?.twoFactorEnabled);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Two-Factor</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.statusCard, twoFAEnabled ? styles.statusOn : styles.statusOff]}>
            <Ionicons name={twoFAEnabled ? 'shield-checkmark' : 'shield-outline'} size={26} color={twoFAEnabled ? '#3A7D5C' : '#8A8A8A'} />
            <Text style={[styles.statusText, { color: twoFAEnabled ? '#3A7D5C' : '#6B7280' }]}>
              {twoFAEnabled ? 'Two-factor authentication is ON' : 'Two-factor authentication is OFF'}
            </Text>
            <Text style={styles.statusSub}>
              {twoFAEnabled
                ? 'You will be asked for a 6-digit code (or a recovery code) when logging in.'
                : 'Enable it in the web app to add an extra layer of security to your account.'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              1. Open “Two-Factor” in the LUA V6 web app and scan the QR code with your authenticator (Google Authenticator, Authy, …).
            </Text>
            <Text style={styles.infoText}>2. Save your recovery codes — they let you in if you lose your phone.</Text>
            <Text style={styles.infoText}>3. Log in on the mobile app: enter your 6-digit code when prompted.</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => Linking.openURL(webLink('/two-factor'))}>
            <Ionicons name="open-outline" size={16} color="#fff" />
            <Text style={styles.primaryText}>Manage in web app</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#FDFBF6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  statusCard: { borderRadius: 16, padding: 18, gap: 6, alignItems: 'center' },
  statusOn: { backgroundColor: '#EAF4E8', borderWidth: 1, borderColor: '#C8DDC8' },
  statusOff: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE' },
  statusText: { fontSize: 15, fontWeight: '900' },
  statusSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 17 },
  infoCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 16, gap: 8 },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#1A1E22' },
  infoText: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  primaryBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

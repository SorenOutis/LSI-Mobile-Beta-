import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { webLink } from '@/lib/api';

/**
 * Social/connected accounts are OAuth flows that run in the browser, so
 * connecting or disconnecting them happens in the LUA V6 web app.
 */
export default function ConnectedSettings() {
  const router = useRouter();
  const providers = [
    { icon: 'logo-google' as const, name: 'Google' },
    { icon: 'logo-github' as const, name: 'GitHub' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Connected Accounts</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {providers.map((p) => (
            <View key={p.name} style={styles.row}>
              <View style={styles.iconBox}><Ionicons name={p.icon} size={20} color="#1A1E22" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{p.name}</Text>
                <Text style={styles.rowSub}>Connect or disconnect in the web app</Text>
              </View>
              <Ionicons name="open-outline" size={16} color="#9AA0A6" />
            </View>
          ))}

          <Text style={styles.note}>
            Social login uses a browser-based sign-in, so it is managed from the LUA V6 web app. Your mobile session stays on email +
            password (and two-factor, if enabled).
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => Linking.openURL(webLink('/connected-accounts'))}>
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
  content: { padding: 14, gap: 12, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F9F7F4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EAE5DE' },
  rowTitle: { fontSize: 13, fontWeight: '700', color: '#1A1E22' },
  rowSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  note: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  primaryBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14, marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

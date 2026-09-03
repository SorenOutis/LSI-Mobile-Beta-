import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const onLogout = () => {
    Alert.alert('Log out', `Log out of ${user?.name ?? 'LSI'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const rows = [
    { icon: 'person-outline' as const, title: 'Profile', sub: 'Name, email, public ID', href: '/settings/profile' },
    { icon: 'lock-closed-outline' as const, title: 'Password', sub: 'Change your password', href: '/settings/password' },
    { icon: 'shield-checkmark-outline' as const, title: 'Two-Factor', sub: 'Extra security on login', href: '/settings/two-factor' },
    { icon: 'link-outline' as const, title: 'Connected Accounts', sub: 'Google, GitHub', href: '/settings/connected' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Account</Text>
          {rows.map((r) => (
            <TouchableOpacity key={r.title} onPress={() => router.push(r.href as any)} style={styles.row}>
              <View style={styles.iconBox}><Ionicons name={r.icon} size={18} color="#1A1E22" /></View>
              <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{r.title}</Text><Text style={styles.rowSub}>{r.sub}</Text></View>
              <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Session</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            <Text style={styles.logoutText}>Log out</Text>
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
  content: { padding: 14, gap: 10, paddingBottom: 24 },
  sectionTitle: { fontSize: 12, letterSpacing: 1, color: '#6B7280', textTransform: 'uppercase', marginTop: 8, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F9F7F4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EAE5DE' },
  rowTitle: { fontSize: 13, fontWeight: '700', color: '#1A1E22' },
  rowSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#FECDD3', backgroundColor: '#FFF1F2', borderRadius: 10, paddingVertical: 12, marginTop: 12 },
  logoutText: { fontWeight: '700', color: '#EF4444', fontSize: 13 },
});

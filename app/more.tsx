import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LINKS = [
  { title: 'Courses', desc: 'My enrolled courses', icon: 'book-outline' as const, href: '/courses' },
  { title: 'Games', desc: 'Arcade & Tower Defense', icon: 'game-controller-outline' as const, href: '/games' },
  { title: 'Shoutouts (NGL)', desc: 'Anonymous messages', icon: 'chatbubble-ellipses-outline' as const, href: '/ngl' },
  { title: 'Leaderboard', desc: 'Full ranking', icon: 'trophy-outline' as const, href: '/leaderboard' },
  { title: 'About LSI', desc: 'Why LSI exists', icon: 'information-circle-outline' as const, href: '/about' },
  { title: 'How it works', desc: 'Create → Review → Plan', icon: 'bulb-outline' as const, href: '/how-it-works' },
  { title: 'Public Profile', desc: 'View your profile', icon: 'person-outline' as const, href: '/profile' },
  { title: 'Settings', desc: 'Profile, password, appearance', icon: 'settings-outline' as const, href: '/settings' },
];

export default function MoreScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}><Ionicons name="close" size={18} color="#1A1E22" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {LINKS.map((l) => (
            <TouchableOpacity key={l.title} onPress={() => router.push(l.href as any)} style={styles.row}>
              <View style={styles.iconBox}><Ionicons name={l.icon} size={20} color="#1A1E22" /></View>
              <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{l.title}</Text><Text style={styles.rowDesc}>{l.desc}</Text></View>
              <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />
            </TouchableOpacity>
          ))}
          <View style={styles.footer}><Text style={styles.footerText}>LSI / KOAMISHIN · v6</Text><Text style={styles.footerSub}>School-ready learning platform</Text></View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6', borderBottomWidth: 1, borderBottomColor: '#EAE5DE' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, gap: 10, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F9F7F4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EAE5DE' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#1A1E22' },
  rowDesc: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  footer: { alignItems: 'center', gap: 4, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EAE5DE' },
  footerText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#1A1E22' },
  footerSub: { fontSize: 11, color: '#6B7280' },
});

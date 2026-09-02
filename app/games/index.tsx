import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GamesScreen() {
  const router = useRouter();
  const games = [
    { slug: 'tower-defense', name: 'Tower Defense', desc: 'Strategic tower placement across escalating difficulty tiers.', status: 'live', category: 'Strategy', stats: [{ k: 'Players', v: '2.4k' }, { k: 'XP Max', v: '500' }], image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
    { slug: 'word-sprint', name: 'Word Sprint', desc: 'Type fast. Climb the leaderboard.', status: 'soon', category: 'Word', stats: [{ k: 'Mode', v: 'Time' }, { k: 'Best', v: '—' }] },
    { slug: 'logic-grid', name: 'Logic Grid', desc: 'Daily deduction puzzles.', status: 'soon', category: 'Puzzle', stats: [{ k: 'Daily', v: '1' }, { k: 'Streak', v: '—' }] },
  ];
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Arcade_Node</Text>
          <View style={styles.onlinePill}><Ionicons name="flash" size={12} color="#1A1E22" /><Text style={styles.onlineText}>ARCADE:ONLINE</Text></View>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroLine} />
            <Text style={styles.heroSub}>Challenge your cognitive boundaries. Earn credits and boost your rank through competitive learning modules.</Text>
          </View>

          <View style={{ gap: 12 }}>
            {games.map((g) => (
              <TouchableOpacity key={g.slug} onPress={() => g.status === 'live' && router.push('/games/tower-defense' as any)} style={[styles.gameCard, g.status !== 'live' && { opacity: 0.6 }]}>
                {g.image && <Image source={{ uri: g.image }} style={styles.gameImg} />}
                <View style={styles.gameBody}>
                  <View style={styles.gameTop}>
                    <Text style={styles.gameName}>{g.name}</Text>
                    {g.status === 'live' ? <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View> : <View style={styles.soonBadge}><Text style={styles.soonText}>SOON</Text></View>}
                  </View>
                  <Text style={styles.gameDesc}>{g.desc}</Text>
                  <View style={styles.gameStats}>
                    {g.stats.map((s) => (
                      <View key={s.k}><Text style={styles.statLabel}>{s.k}</Text><Text style={styles.statVal}>{s.v}</Text></View>
                    ))}
                    <View style={styles.goBtn}><Ionicons name="chevron-forward" size={16} color="#fff" /></View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sidebarCard}>
            <View style={styles.sidebarHead}><Ionicons name="trophy-outline" size={16} color="#D96A3E" /><Text style={styles.sidebarTitle}>Featured Game</Text></View>
            <Text style={styles.featuredName}>Tower Defense</Text>
            <Text style={styles.featuredDesc}>Our flagship arcade experience — strategic tower placement across escalating difficulty tiers.</Text>
            <TouchableOpacity onPress={() => router.push('/games/tower-defense' as any)} style={styles.featuredBtn}><Text style={styles.featuredBtnText}>Jump In</Text><Ionicons name="chevron-forward" size={14} color="#fff" /></TouchableOpacity>
          </View>

          <View style={styles.sidebarCard}>
            <View style={styles.sidebarHead}><Ionicons name="time-outline" size={16} color="#6B7280" /><Text style={styles.sidebarTitle}>Upcoming</Text></View>
            {[
              { n: 'Word Sprint', d: 'Type fast. Climb the leaderboard.' },
              { n: 'Logic Grid', d: 'Daily deduction puzzles.' },
              { n: 'Code Duel', d: 'Head-to-head algorithm battles.' },
            ].map((u) => (
              <View key={u.n} style={styles.upcomingRow}>
                <View style={styles.dot} />
                <View><Text style={styles.upName}>{u.n}</Text><Text style={styles.upDesc}>{u.d}</Text></View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22', letterSpacing: 1, textTransform: 'uppercase' },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFEFC' },
  onlineText: { fontSize: 9, fontWeight: '900', letterSpacing: 1, color: '#1A1E22' },
  content: { padding: 14, gap: 14 },
  hero: { gap: 8 },
  heroLine: { width: 32, height: 2, backgroundColor: '#D96A3E', borderRadius: 1 },
  heroSub: { fontSize: 11, color: '#6B7280', lineHeight: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  gameCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, overflow: 'hidden' },
  gameImg: { width: '100%', height: 140, backgroundColor: '#FFF0EB' },
  gameBody: { padding: 14, gap: 8 },
  gameTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gameName: { fontSize: 14, fontWeight: '900', color: '#1A1E22', textTransform: 'uppercase' },
  liveBadge: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  liveText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  soonBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  soonText: { fontSize: 9, fontWeight: '900', color: '#6B7280' },
  gameDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  gameStats: { flexDirection: 'row', gap: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10, marginTop: 4 },
  statLabel: { fontSize: 9, color: '#9AA0A6', fontWeight: '700', textTransform: 'uppercase' },
  statVal: { fontSize: 11, fontWeight: '900', color: '#1A1E22', marginTop: 2 },
  goBtn: { marginLeft: 'auto', width: 28, height: 28, borderRadius: 8, backgroundColor: '#1A1E22', alignItems: 'center', justifyContent: 'center' },
  sidebarCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 14, gap: 10 },
  sidebarHead: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8 },
  sidebarTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: '#1A1E22', textTransform: 'uppercase' },
  featuredName: { fontSize: 14, fontWeight: '900', color: '#1A1E22', textTransform: 'uppercase' },
  featuredDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  featuredBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D96A3E', borderRadius: 10, paddingVertical: 10 },
  featuredBtnText: { color: '#fff', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  upcomingRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9F7F4' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D96A3E', marginTop: 6 },
  upName: { fontSize: 11, fontWeight: '900', color: '#1A1E22', textTransform: 'uppercase', letterSpacing: 0.5 },
  upDesc: { fontSize: 10, color: '#6B7280', marginTop: 2 },
});

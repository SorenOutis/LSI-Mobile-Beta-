// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

export default function LeaderboardFull() {
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get('/leaderboard').then(r => setData(r.data)).catch(() => setData({ sectionLeaderboards: [] })).finally(() => setLoading(false));
  }, [token]);
  const boards: any[] = data?.sectionLeaderboards ?? data?.data ?? [];
  const first = boards[0];
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? <PageSkeleton count={5} /> : boards.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text>No leaderboard data</Text></View>
          ) : (
            <>
              <View style={styles.intro}>
                <View style={styles.introTop}><View><Text style={styles.kicker}>Compete and grow</Text><Text style={styles.title}>Leaderboard</Text></View><View style={styles.trophyBox}><Ionicons name="trophy" size={20} color="#D96A3E" /></View></View>
                {first && <View style={styles.rankCard}><View style={styles.rankIcon}><Ionicons name="trophy" size={16} color="#fff" /></View><View><Text style={styles.rankSection}>{first.sectionName}</Text><Text style={styles.rankBig}>Ranked #{first.userRank}</Text><Text style={styles.rankSub}>{first.totalPlayers} students</Text></View></View>}
              </View>
              {boards.map((b: any) => (
                <View key={b.sectionName ?? b.sectionId} style={styles.tableCard}>
                  <Text style={styles.tableTitle}>{b.sectionName}</Text>
                  {b.users?.slice(0, 10).map((u: any) => (
                    <View key={u.id} style={[styles.row, u.isCurrentUser && styles.rowMe]}>
                      <Text style={styles.rankNum}>#{u.rank ?? u.position}</Text>
                      <Image source={{ uri: u.avatar ?? `https://i.pravatar.cc/100?img=${u.id % 70}` }} style={styles.avatar} />
                      <View style={{ flex: 1 }}><Text style={styles.name}>{u.name}</Text><Text style={styles.sub}>{u.xp ?? u.exp} XP</Text></View>
                      <Text style={styles.xp}>{u.xp ?? u.exp}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  content: { padding: 14, gap: 14 },
  intro: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 16, gap: 10 },
  introTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: '#D96A3E', textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: '900', color: '#1A1E22' },
  trophyBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center' },
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFEFC', borderWidth: 1, borderColor: '#F0C4B0', borderRadius: 12, padding: 12 },
  rankIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#D96A3E', alignItems: 'center', justifyContent: 'center' },
  rankSection: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#9AA0A6', textTransform: 'uppercase' },
  rankBig: { fontSize: 14, fontWeight: '900', color: '#1A1E22' },
  rankSub: { fontSize: 11, color: '#6B7280' },
  tableCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, overflow: 'hidden', padding: 12, gap: 8 },
  tableTitle: { fontSize: 12, fontWeight: '800', color: '#1A1E22' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  rowMe: { backgroundColor: '#FFF6F0' },
  rankNum: { fontSize: 11, fontWeight: '900', color: '#1A1E22', width: 30 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EAE5DE' },
  name: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  sub: { fontSize: 10, color: '#6B7280' },
  xp: { fontSize: 12, fontWeight: '800', color: '#1A1E22' },
});

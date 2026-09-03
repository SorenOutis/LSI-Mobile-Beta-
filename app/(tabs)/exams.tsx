import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';
import { parseDate } from '@/lib/format';

type Filter = 'All' | 'Upcoming' | 'Completed';

export default function ExamsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [filter, setFilter] = useState<Filter>('All');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r: any = await api.get('/mobile/exams');
      const d = r.data.data ?? r.data ?? [];
      setGroups(Array.isArray(d) ? d : []);
    } catch (e) {
      setError(errorMessage(e));
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const flat: any[] = groups.flatMap((g) => g.exams ?? []);
  const filtered = flat.filter((e) => {
    if (filter === 'All') return true;
    if (filter === 'Upcoming') return !e.is_locked && e.is_open_now;
    if (filter === 'Completed') return e.is_locked;
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exams</Text>
          <TouchableOpacity style={styles.menuBtn} onPress={() => router.push('/more' as any)} accessibilityLabel="Menu">
            <Ionicons name="menu" size={20} color="#1A1E22" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {(['All', 'Upcoming', 'Completed'] as Filter[]).map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterActive]}>
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {loading ? (
            <PageSkeleton count={3} />
          ) : error ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Ionicons name="cloud-offline-outline" size={32} color="#8A8A8A" /></View>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={load}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text style={{ fontWeight: '700' }}>No exams in {filter}</Text></View>
          ) : (
            filtered.map((exam) => (
              <View key={exam.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconCircle, { backgroundColor: exam.is_locked ? '#EAF4E8' : '#FFF0EB' }]}>
                    <Ionicons name={exam.is_locked ? 'checkmark-circle-outline' : 'calendar-outline'} size={26} color={exam.is_locked ? '#3A7D5C' : '#D96A3E'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{exam.title}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>
                        {exam.exam_date_iso ? (parseDate(exam.exam_date_iso)?.toLocaleDateString() ?? 'No date') : 'No date'} · {exam.duration_minutes ?? 45} min
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{exam.submitted_parts_count ?? 0}/{exam.total_parts ?? exam.parts?.length ?? 0} parts</Text>
                    </View>
                  </View>
                  <View style={exam.is_locked ? styles.badgeCompleted : styles.badgeUpcoming}>
                    <Text style={exam.is_locked ? styles.badgeCompletedText : styles.badgeUpcomingText}>{exam.is_locked ? 'Done' : 'Open'}</Text>
                  </View>
                </View>
                {/* Both "Start" and "View results" go through the exam detail screen,
                    which loads the real exam (parts/questions/review) from the API. */}
                <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/exams/${exam.id}` as any)}>
                  <Text style={styles.primaryText}>{exam.is_locked ? 'View results' : 'Start exam'}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1E22' },
  menuBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 14, paddingBottom: Platform.OS === 'web' ? 90 : 16, gap: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  filterPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff' },
  filterActive: { backgroundColor: '#D96A3E', borderColor: '#D96A3E' },
  filterText: { fontWeight: '600', color: '#1A1E22', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 16, gap: 14 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1A1E22' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontSize: 12, color: '#6B6B6B' },
  badgeUpcoming: { borderWidth: 1, borderColor: '#F0C4B0', backgroundColor: '#FFF0EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeUpcomingText: { fontSize: 11, color: '#D96A3E', fontWeight: '700' },
  badgeCompleted: { borderWidth: 1, borderColor: '#C8DDC8', backgroundColor: '#EAF4E8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeCompletedText: { fontSize: 11, color: '#3A7D5C', fontWeight: '700' },
  primaryBtn: { backgroundColor: '#D96A3E', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyText: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 16 },
  retryBtn: { backgroundColor: '#1A1E22', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

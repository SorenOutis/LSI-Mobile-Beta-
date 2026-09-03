import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Course = {
  id: number;
  name?: string;
  title?: string;
  description?: string;
  progress?: number;
  totalLessons?: number;
  completedLessons?: number;
  xpEarned?: number;
  modulesCount?: number;
  cover?: string;
  [key: string]: any;
};

const TIPS = [
  'Consistency beats intensity — study a little every day rather than cramming.',
  'Spaced repetition is the most efficient way to move knowledge into long-term memory.',
  'Reviewing mistakes beats re-reading: it targets exactly what you missed.',
];

export default function CoursesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tipIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  const load = useCallback(async () => {
    if (!token) return;
    setStatus('loading');
    setError(null);
    try {
      const r: any = await api.get('/courses');
      const d = r.data ?? r;
      const list: Course[] = Array.isArray(d) ? d : d.courses ?? d.data ?? [];
      setCourses(list);
      setStatus('ready');
    } catch (e) {
      setError(errorMessage(e));
      setCourses([]);
      setStatus('error');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...courses];
    if (search) list = list.filter((c) => (c.name ?? c.title ?? '').toLowerCase().includes(search.toLowerCase()));
    if (filter === 'active') list = list.filter((c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
    if (filter === 'done') list = list.filter((c) => (c.progress ?? 0) >= 100);
    return list;
  }, [search, filter, courses]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#1A1E22" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My courses</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tip card - mirrors daily insight */}
          <View style={styles.tipCard}>
            <View style={styles.tipTop}>
              <View style={styles.tipIcon}><Text style={{ fontSize: 12 }}>✨</Text></View>
              <Text style={styles.tipLabel}>Daily Insight</Text>
            </View>
            <Text style={styles.tipText}>{TIPS[tipIdx]}</Text>
            <View style={styles.tipActions}>
              <TouchableOpacity style={styles.tipBtn}><Text style={styles.tipBtnText}>Got it</Text></TouchableOpacity>
              <View style={{ flex: 1, height: 1, backgroundColor: '#EAE5DE' }} />
              <TouchableOpacity style={styles.tipBtn}><Text style={styles.tipBtnText}>Shuffle</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color="#9AA0A6" />
              <TextInput value={search} onChangeText={setSearch} placeholder="Search courses" placeholderTextColor="#9AA0A6" style={styles.searchInput} />
              {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color="#9AA0A6" /></TouchableOpacity> : null}
            </View>
          </View>

          <View style={styles.filterRow}>
            {(['all', 'active', 'done'] as const).map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterActive]}>
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Done'}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.countText}>{filtered.length} courses</Text>
          </View>

          {status === 'error' ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 32 }}>
              <Ionicons name="cloud-offline-outline" size={32} color="#8A8A8A" />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={load}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
            </View>
          ) : (
            filtered.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => router.push(`/courses/${c.id}` as any)} style={styles.courseCard}>
                {c.cover ? <Image source={{ uri: c.cover }} style={styles.cover} /> : <View style={[styles.cover, styles.coverFallback]}><Ionicons name="book-outline" size={32} color="#D96A3E" /></View>}
                <View style={styles.courseBody}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.pctBadge, (c.progress ?? 0) >= 100 && { backgroundColor: '#10B981' }]}>
                      <Text style={styles.pctText}>{(c.progress ?? 0) >= 100 ? '✓ Done' : `${c.progress ?? 0}%`}</Text>
                    </View>
                  </View>
                  <Text style={styles.courseName}>{c.name ?? c.title}</Text>
                  {!!c.description && <Text style={styles.courseDesc} numberOfLines={2}>{c.description}</Text>}
                  <View style={styles.metaRow}>
                    {c.modulesCount != null && (
                      <View style={styles.metaItem}><Ionicons name="layers-outline" size={12} color="#6B7280" /><Text style={styles.metaText}>{c.modulesCount} modules</Text></View>
                    )}
                    {c.totalLessons != null && (
                      <View style={styles.metaItem}><Ionicons name="bar-chart-outline" size={12} color="#6B7280" /><Text style={styles.metaText}>{c.completedLessons ?? 0}/{c.totalLessons}</Text></View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />
                  </View>
                  <View style={styles.progressBg}><View style={[styles.progressFg, { width: `${c.progress ?? 0}%`, backgroundColor: (c.progress ?? 0) >= 100 ? '#10B981' : '#D96A3E' }]} /></View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {status === 'ready' && filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={32} color="#9AA0A6" />
              <Text style={styles.emptyTitle}>{search || filter !== 'all' ? 'No matches found' : 'No courses yet'}</Text>
              <Text style={styles.emptySub}>{search || filter !== 'all' ? 'Try a different search or filter.' : 'Courses your teacher assigns will appear here.'}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  retryBtn: { backgroundColor: '#1A1E22', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 14, paddingBottom: 24, gap: 12 },
  tipCard: { backgroundColor: '#FFFEFC', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 16, gap: 10 },
  tipTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center' },
  tipLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: '#D96A3E', textTransform: 'uppercase' },
  tipText: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: '#1A1E22' },
  tipActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  tipBtn: { borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
  tipBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#6B7280', textTransform: 'uppercase' },
  searchRow: { marginTop: 2 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#fff', height: 42 },
  searchInput: { flex: 1, fontSize: 13, color: '#1A1E22' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff' },
  filterActive: { backgroundColor: '#1A1E22', borderColor: '#1A1E22' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  countText: { marginLeft: 'auto', fontSize: 12, color: '#6B7280', fontWeight: '600' },
  courseCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, overflow: 'hidden' },
  cover: { width: '100%', height: 140, backgroundColor: '#FFF0EB' },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  courseBody: { padding: 14, gap: 8 },
  badgeRow: { flexDirection: 'row' },
  pctBadge: { backgroundColor: '#1A1E22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pctText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  courseName: { fontSize: 15, fontWeight: '800', color: '#1A1E22' },
  courseDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#6B7280' },
  progressBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginTop: 4 },
  progressFg: { height: 6, borderRadius: 3 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#1A1E22' },
  emptySub: { fontSize: 12, color: '#6B7280' },
});

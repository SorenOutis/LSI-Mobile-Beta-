// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

type Filter = 'All' | 'Upcoming' | 'Completed';
export default function ExamsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [filter, setFilter] = useState<Filter>('All');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewQ, setReviewQ] = useState(0);
  const reviewQs = [
    { text: 'What is 2x + 3 = 11?', options: ['x=3', 'x=4', 'x=5'], correct: 1, answer: 1, points: 10 },
    { text: 'True or False: Slope of y=2x+1 is 2.', options: ['True', 'False'], correct: 0, answer: 0, points: 5 },
    { text: 'Define linear equation', answer: 'Equation of degree 1 forming a straight line', points: 5, aiScore: 8 },
  ];

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get('/exams').then(r => {
      const d = r.data.data ?? r.data ?? [];
      setGroups(Array.isArray(d) ? d : []);
    }).catch(() => setGroups([])).finally(() => setLoading(false));
  }, [token]);

  const flat: any[] = groups.flatMap((g: any) => g.exams ?? []);
  const filtered = flat.filter((e: any) => {
    if (filter === 'All') return true;
    if (filter === 'Upcoming') return !e.is_locked && e.is_open_now;
    if (filter === 'Completed') return e.is_locked;
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /><Ionicons name="menu" size={20} color="#1A1E22" /></TouchableOpacity>
            <Text style={styles.headerTitle}>Exams</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn}><Ionicons name="search" size={20} color="#1A1E22" /></TouchableOpacity>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {(['All', 'Upcoming', 'Completed'] as Filter[]).map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterActive]}>
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {loading ? <PageSkeleton count={3} /> : filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text style={{ fontWeight: '700' }}>No exams in {filter}</Text></View>
          ) : (
            filtered.map((exam: any) => (
              <View key={exam.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconCircle, { backgroundColor: exam.is_locked ? '#EAF4E8' : '#FFF0EB' }]}><Ionicons name={exam.is_locked ? 'checkmark-circle-outline' : 'calendar-outline'} size={26} color={exam.is_locked ? '#3A7D5C' : '#D96A3E'} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{exam.title}</Text>
                    <View style={styles.metaRow}><Ionicons name="calendar-outline" size={14} color="#6B7280" /><Text style={styles.metaText}>{exam.exam_date_iso ? new Date(exam.exam_date_iso).toLocaleDateString() : 'No date'} · {exam.duration_minutes ?? 45} min</Text></View>
                    <View style={styles.metaRow}><Ionicons name="document-text-outline" size={14} color="#6B7280" /><Text style={styles.metaText}>{exam.submitted_parts_count ?? 0}/{exam.total_parts ?? exam.parts?.length ?? 0} parts</Text></View>
                  </View>
                  <View style={exam.is_locked ? styles.badgeCompleted : styles.badgeUpcoming}><Text style={exam.is_locked ? styles.badgeCompletedText : styles.badgeUpcomingText}>{exam.is_locked ? 'Done' : 'Open'}</Text></View>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => exam.is_locked ? setShowReview(true) : router.push(`/exams/${exam.id}` as any)}>
                  <Text style={styles.primaryText}>{exam.is_locked ? 'View results' : 'Start exam'}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
        <Modal visible={showReview} transparent animationType="slide" onRequestClose={() => setShowReview(false)}>
          <View style={styles.reviewOverlay}><View style={styles.reviewSheet}><View style={styles.reviewHeader}><Text style={styles.reviewTitle}>Review</Text><TouchableOpacity onPress={() => setShowReview(false)} style={styles.reviewClose}><Ionicons name="close" size={18} color="#1A1E22" /></TouchableOpacity></View><ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}><View style={styles.qNav}>{reviewQs.map((_, i) => (<TouchableOpacity key={i} onPress={() => setReviewQ(i)} style={[styles.qDot, i===reviewQ && { backgroundColor:'#1A1E22' }]}><Text style={{ color:'#fff', fontSize:11, fontWeight:'800' }}>{i+1}</Text></TouchableOpacity>))}</View><View style={styles.reviewCard}><Text style={styles.reviewQText}>{reviewQs[reviewQ].text}</Text></View></ScrollView></View></View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1E22' },
  searchBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
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
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  reviewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  reviewSheet: { maxHeight: '88%', backgroundColor: '#FDFBF6', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EAE5DE' },
  reviewTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22' },
  reviewClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  qNav: { flexDirection: 'row', gap: 8 },
  qDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  reviewCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 14 },
  reviewQText: { fontSize: 14, fontWeight: '700', color: '#1A1E22' },
});

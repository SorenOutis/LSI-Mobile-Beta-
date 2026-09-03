import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

export default function GradesScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r: any = await api.get('/mobile/grades');
      setData(r.data ?? r);
    } catch (e) {
      setError(errorMessage(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);
  const subjects: any[] = data?.subjectGrades ?? data?.grades ?? [];
  const overall = data?.overall ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Grades</Text>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <PageSkeleton count={4} />
          ) : error ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 32 }}>
              <Ionicons name="cloud-offline-outline" size={32} color="#8A8A8A" />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={load}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              {overall !== null && (
                <View style={styles.overallCard}>
                  <Text style={styles.overallTitle}>Overall progress</Text>
                  <View style={styles.overallRow}>
                    <View style={styles.circleWrap}><View style={styles.circleBg}><View style={styles.circleCenter}><Text style={styles.circleText}>{overall}%</Text></View></View></View>
                    <View style={{ flex: 1 }}><Text style={styles.strongText}>Strong progress this term</Text><View style={styles.barBg}><View style={[styles.barFg, { width: `${overall}%` }]} /></View></View>
                  </View>
                </View>
              )}
              {subjects.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text style={{ fontWeight: '700' }}>No grades yet</Text><Text style={{ color: '#6B7280', fontSize: 12 }}>Your grades will appear here.</Text></View>
              ) : (
                subjects.map((s: any) => (
                  <View key={s.subject ?? s.name} style={styles.subjectCard}>
                    <View style={styles.subjectIcon}><Ionicons name="calculator-outline" size={24} color="#3A7D5C" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectTitle}>{s.subject ?? s.name}</Text>
                      <Text style={styles.trendText}>{s.section?.name ?? ''}</Text>
                    </View>
                    <Text style={styles.pct}>{s.currentAverage ? `${Math.round(s.currentAverage)}%` : s.grade ?? '--'}</Text>
                  </View>
                ))
              )}
            </>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1E22' },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 14, paddingBottom: Platform.OS === 'web' ? 90 : 16, gap: 10 },
  overallCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 16 },
  overallTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22', marginBottom: 12 },
  overallRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  circleWrap: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  circleBg: { width: 86, height: 86, borderRadius: 43, borderWidth: 8, borderColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  circleCenter: { alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 22, fontWeight: '900', color: '#3A7D5C' },
  strongText: { fontSize: 13, color: '#3A7D5C', fontWeight: '600' },
  barBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, marginTop: 12 },
  barFg: { height: 8, backgroundColor: '#3A7D5C', borderRadius: 4 },
  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 14, gap: 12 },
  subjectIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAF4E8', alignItems: 'center', justifyContent: 'center' },
  subjectTitle: { fontSize: 15, fontWeight: '800', color: '#1A1E22' },
  trendText: { fontSize: 11, color: '#6B7280' },
  pct: { fontSize: 18, fontWeight: '800', color: '#3A7D5C' },
});

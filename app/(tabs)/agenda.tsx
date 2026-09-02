// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

export default function AgendaScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get('/calendar').then((r: any) => setData((r.data ?? r) as any)).catch(() => setData({ events: [] })).finally(() => setLoading(false));
  }, [token]);

  const events: any[] = data?.events ?? [];
  const todayKey: string = data?.todayKey ?? new Date().toISOString().slice(0, 10);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of events) {
      if (!map.has(e.dateKey)) map.set(e.dateKey, []);
      map.get(e.dateKey)!.push(e);
    }
    return map;
  }, [events]);

  const dates = useMemo(() => {
    const out: { key: string; label: string; dayNum: string }[] = [];
    const base = selectedDate ? new Date(selectedDate) : new Date(todayKey);
    // Show 7 days window around selected
    for (let i = -2; i <= 4; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({ key, label: d.toLocaleDateString('en-US', { weekday: 'short' }), dayNum: String(d.getDate()) });
    }
    return out;
  }, [selectedDate, todayKey]);

  const activeKey = selectedDate ?? todayKey;
  const activeEvents = grouped.get(activeKey) ?? [];

  useEffect(() => {
    if (!selectedDate && todayKey) setSelectedDate(todayKey);
  }, [todayKey]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Agenda</Text>
          <TouchableOpacity style={styles.calBtn}><Ionicons name="calendar-outline" size={20} color="#1A1E22" /></TouchableOpacity>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? <PageSkeleton count={3} /> : (
            <>
              <View style={styles.weekCard}>
                {dates.map((d) => (
                  <TouchableOpacity key={d.key} onPress={() => setSelectedDate(d.key)} style={[styles.dayCell, d.key === activeKey && styles.dayActive]}>
                    <Text style={[styles.dayLabel, d.key === activeKey && styles.dayLabelActive]}>{d.label}</Text>
                    <Text style={[styles.dayNum, d.key === activeKey && styles.dayNumActive]}>{d.dayNum}</Text>
                    {d.key === activeKey && <View style={styles.dayDot} />}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.dateTitle}>{new Date(activeKey).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
              {activeEvents.length === 0 ? (
                <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={32} color="#8A8A8A" /></View><Text style={styles.emptyText}>No events for this day</Text></View>
              ) : (
                <View style={styles.timeline}>
                  <View style={styles.line} />
                  {activeEvents.map((ev: any) => (
                    <View key={`${ev.type}-${ev.id}`} style={styles.eventRow}>
                      <View style={[styles.dot, { backgroundColor: ev.type === 'exam' ? '#D96A3E' : '#3A7D5C', borderColor: ev.type === 'exam' ? '#F0C4B0' : '#C8DDC8' }]} />
                      <View style={styles.eventCard}>
                        <View style={styles.eventIconWrap}>
                          <View style={[styles.eventIcon, { backgroundColor: ev.type === 'exam' ? '#D96A3E' : '#3A7D5C' }]}><Ionicons name={ev.type === 'exam' ? 'calculator' : 'book'} size={22} color="#fff" /></View>
                          <View style={{ flex: 1 }}><Text style={[styles.eventTime, { color: ev.type === 'exam' ? '#D96A3E' : '#3A7D5C' }]}>{ev.dateKey}</Text><Text style={styles.eventTitle}>{ev.title}</Text><Text style={styles.metaText}>{ev.sectionName ?? ev.courseName ?? ''} · {ev.type}</Text></View>
                          <View style={ev.type === 'exam' ? styles.upcomingPill : styles.startPill}><Text style={ev.type === 'exam' ? styles.upcomingText : styles.startText}>{ev.type === 'exam' ? 'Exam' : 'Assignment'}</Text></View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.empty}><Text style={styles.emptyText}>{events.length} total events in 14-month window</Text></View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1E22' },
  calBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 14, paddingBottom: Platform.OS === 'web' ? 90 : 16 },
  weekCard: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 6, justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, minWidth: 48, gap: 4 },
  dayActive: { backgroundColor: '#D96A3E' },
  dayLabel: { fontSize: 12, color: '#1A1E22', fontWeight: '500' },
  dayLabelActive: { color: '#fff' },
  dayNum: { fontSize: 18, fontWeight: '800', color: '#1A1E22' },
  dayNumActive: { color: '#fff' },
  dayDot: { width: 16, height: 3, borderRadius: 2, backgroundColor: '#D96A3E', position: 'absolute', bottom: -9 },
  dateTitle: { fontSize: 18, fontWeight: '800', color: '#1A1E22', marginTop: 18, marginBottom: 12 },
  timeline: { position: 'relative', paddingLeft: 18, gap: 14 },
  line: { position: 'absolute', left: 7, top: 8, bottom: 20, width: 1, backgroundColor: '#EAE5DE' },
  eventRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, marginTop: 18, marginLeft: -19, backgroundColor: '#fff', zIndex: 1 },
  eventCard: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 14 },
  eventIconWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  eventTime: { fontSize: 12, fontWeight: '800' },
  eventTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22', marginTop: 2 },
  metaText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  upcomingPill: { borderWidth: 1, borderColor: '#F0C4B0', backgroundColor: '#FFF0EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  upcomingText: { fontSize: 11, color: '#D96A3E', fontWeight: '700' },
  startPill: { backgroundColor: '#EAF4E8', borderWidth: 1, borderColor: '#C8DDC8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  startText: { fontSize: 11, color: '#3A7D5C', fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 24, gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 12, color: '#8A8A8A' },
});

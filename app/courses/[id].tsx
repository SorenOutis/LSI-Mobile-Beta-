// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Course #{id}</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Ionicons name="book" size={28} color="#fff" />
            <Text style={styles.heroTitle}>Algebra Fundamentals</Text>
            <Text style={styles.heroSub}>24 lessons · 6 modules · 420 XP earned</Text>
            <View style={styles.progressBg}><View style={[styles.progressFg, { width: '68%' }]} /></View>
          </View>
          {[
            { title: 'Lesson 1: Variables & Expressions', done: true, xp: 20 },
            { title: 'Lesson 2: Linear Equations', done: true, xp: 20 },
            { title: 'Lesson 3: Inequalities', done: false, xp: 25 },
            { title: 'Lesson 4: Graphing', done: false, xp: 25 },
          ].map((l, i) => (
            <TouchableOpacity key={i} onPress={() => router.push(`/courses/lesson?id=${i + 1}` as any)} style={styles.lessonRow}>
              <View style={[styles.lessonIcon, l.done ? { backgroundColor: '#10B981' } : { backgroundColor: '#EAE5DE' }]}>
                <Ionicons name={l.done ? 'checkmark' : 'play'} size={16} color={l.done ? '#fff' : '#6B7280'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>{l.title}</Text>
                <Text style={styles.lessonMeta}>{l.xp} XP · {l.done ? 'Completed' : 'To do'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.primaryBtn}><Text style={styles.primaryText}>Continue learning</Text></TouchableOpacity>
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
  content: { padding: 14, gap: 12 },
  hero: { backgroundColor: '#1A1E22', borderRadius: 16, padding: 20, gap: 8, alignItems: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  heroSub: { fontSize: 12, color: '#B8B8B8' },
  progressBg: { width: '100%', height: 6, backgroundColor: '#2A2E33', borderRadius: 3, marginTop: 8 },
  progressFg: { height: 6, backgroundColor: '#D96A3E', borderRadius: 3 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14 },
  lessonIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lessonTitle: { fontSize: 13, fontWeight: '700', color: '#1A1E22' },
  lessonMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  primaryBtn: { backgroundColor: '#D96A3E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

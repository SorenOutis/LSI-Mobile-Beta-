import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage, webLink } from '@/lib/api';
import { PageSkeleton } from '@/components/PageSkeleton';

// GET /courses/{id} on the LUA V6 backend. Fields are read defensively because
// the exact payload shape (lessons vs modules) may vary.
export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoaded(false);
    setError(null);
    try {
      const r: any = await api.get(`/courses/${id}`);
      setCourse(r.data ?? r);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const lessons: any[] = (course?.lessons ?? course?.modules?.flatMap((m: any) => m.lessons ?? []) ?? course?.units ?? []).filter(
    (l: any) => l && (l.title || l.name)
  );
  const name = course?.name ?? course?.title ?? `Course #${id}`;
  const progress: number = Number(course?.progress ?? 0);

  const openLesson = (l: any, idx: number) => {
    const lessonId = l.id ?? l.lesson_id ?? idx + 1;
    router.push(`/courses/lesson?course=${id}&lesson=${lessonId}` as any);
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}><View style={styles.headerPlaceholder} /><PageSkeleton count={5} /></View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}>
          <Header title={name} onBack={() => router.back()} />
          <View style={styles.errorWrap}>
            <View style={styles.errorIcon}><Ionicons name="cloud-offline-outline" size={30} color="#8A8A8A" /></View>
            <Text style={styles.errorTitle}>Couldn&apos;t load this course</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
            <TouchableOpacity style={styles.webLinkBtn} onPress={() => Linking.openURL(webLink(`/courses/${id}`))}>
              <Text style={styles.webLinkText}>Open in web app</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const firstOpen = lessons.find((l: any) => !(l.completed ?? l.done));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <Header title={name} onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Ionicons name="book" size={28} color="#fff" />
            <Text style={styles.heroTitle}>{name}</Text>
            {!!course?.description && <Text style={styles.heroSub}>{course.description}</Text>}
            {(course?.modulesCount != null || course?.totalLessons != null) && (
              <Text style={styles.heroSub}>
                {course?.modulesCount != null ? `${course.modulesCount} modules · ` : ''}{course?.completedLessons ?? 0}/{course?.totalLessons ?? lessons.length} lessons{course?.xpEarned != null ? ` · ${course.xpEarned} XP earned` : ''}
              </Text>
            )}
            <View style={styles.progressBg}><View style={[styles.progressFg, { width: `${progress}%` }]} /></View>
          </View>

          {lessons.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Lesson details aren&apos;t included in the API response for this course yet — the full course view is available in the web app.
              </Text>
              <TouchableOpacity style={styles.webLinkBtn} onPress={() => Linking.openURL(webLink(`/courses/${id}`))}>
                <Text style={styles.webLinkText}>Open in web app</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Lessons</Text>
              {lessons.map((l, i) => {
                const done = Boolean(l.completed ?? l.done);
                return (
                  <TouchableOpacity key={l.id ?? i} onPress={() => openLesson(l, i)} style={styles.lessonRow}>
                    <View style={[styles.lessonIcon, done ? { backgroundColor: '#10B981' } : { backgroundColor: '#EAE5DE' }]}>
                      <Ionicons name={done ? 'checkmark' : 'play'} size={16} color={done ? '#fff' : '#6B7280'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lessonTitle}>{l.title ?? l.name}</Text>
                      <Text style={styles.lessonMeta}>{l.xp != null ? `${l.xp} XP · ` : ''}{done ? 'Completed' : 'To do'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={[styles.primaryBtn, !firstOpen && { opacity: 0.5 }]} onPress={() => firstOpen && openLesson(firstOpen, lessons.indexOf(firstOpen))}>
                <Text style={styles.primaryText}>{firstOpen ? 'Continue learning' : 'All lessons complete'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#FDFBF6' },
  headerPlaceholder: { height: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, gap: 12, paddingBottom: 24 },
  hero: { backgroundColor: '#1A1E22', borderRadius: 16, padding: 20, gap: 8, alignItems: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center' },
  heroSub: { fontSize: 12, color: '#B8B8B8', textAlign: 'center', lineHeight: 16 },
  progressBg: { width: '100%', height: 6, backgroundColor: '#2A2E33', borderRadius: 3, marginTop: 8 },
  progressFg: { height: 6, borderRadius: 3, backgroundColor: '#D96A3E' },
  sectionTitle: { fontSize: 13, letterSpacing: 1, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', marginTop: 6 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14 },
  lessonIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EAE5DE', alignItems: 'center', justifyContent: 'center' },
  lessonTitle: { fontSize: 13, fontWeight: '700', color: '#1A1E22' },
  lessonMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  primaryBtn: { backgroundColor: '#D96A3E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  emptyBox: { alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 20 },
  emptyText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  webLinkBtn: { backgroundColor: '#D96A3E', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  webLinkText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  errorWrap: { alignItems: 'center', gap: 10, padding: 24 },
  errorIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22' },
  errorText: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 16 },
  retryBtn: { backgroundColor: '#1A1E22', borderRadius: 10, paddingHorizontal: 22, paddingVertical: 12 },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

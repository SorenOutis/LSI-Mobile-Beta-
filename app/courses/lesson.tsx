import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage, webLink } from '@/lib/api';
import { PageSkeleton } from '@/components/PageSkeleton';

// GET /courses/{course}/lessons/{lesson} on the LUA V6 backend.
// Renders lesson content and, when present, an interactive quiz.
// Completing is a best-effort POST to .../complete.
export default function LessonScreen() {
  const router = useRouter();
  const { course, lesson } = useLocalSearchParams<{ course?: string; lesson?: string }>();
  const [data, setData] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [completing, setCompleting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const load = useCallback(async () => {
    if (!course || !lesson) return;
    setLoaded(false);
    setError(null);
    try {
      const r: any = await api.get(`/mobile/courses/${course}/lessons/${lesson}`);
      setData(r.data ?? r);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoaded(true);
    }
  }, [course, lesson]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset per-question selections whenever the loaded quiz changes size.
  const questionsLength = Array.isArray(data?.quiz?.questions) ? (data.quiz.questions as any[]).length : 0;
  useEffect(() => {
    setAnswers(Array(questionsLength).fill(null));
    setQuizResult(null);
  }, [questionsLength]);

  if (!course || !lesson) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}>
          <Header title="Lesson" onBack={() => router.back()} />
          <View style={styles.emptyBox}><Text style={styles.emptyText}>No lesson selected.</Text></View>
        </View>
      </SafeAreaView>
    );
  }

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}><View style={styles.headerPlaceholder} /><PageSkeleton count={4} /></View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}>
          <Header title="Lesson" onBack={() => router.back()} />
          <View style={styles.errorWrap}>
            <View style={styles.errorIcon}><Ionicons name="cloud-offline-outline" size={30} color="#8A8A8A" /></View>
            <Text style={styles.errorTitle}>Couldn&apos;t load this lesson</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
            <TouchableOpacity style={styles.webLinkBtn} onPress={() => Linking.openURL(webLink(`/courses/${course}/lessons/${lesson}`))}>
              <Text style={styles.webLinkText}>Open in web app</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Live backend payload: { course, lesson: {title, content, ...},
  // quiz: {questions, passScore, allowedAttempts}, userProgress, ... }
  const lessonData = data?.lesson ?? {};
  const quiz: any = data?.quiz ?? null;
  const questions: any[] = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const content: string = lessonData.content ?? data?.content ?? '';
  const title: string = lessonData.title ?? data?.title ?? 'Lesson';
  const userProgress: any = data?.userProgress;

  const complete = async () => {
    if (completing) return;
    if (quizResult) {
      router.back();
      return;
    }
    if (questions.length === 0) {
      router.back();
      return;
    }
    if (answers.some((a) => a === null || a === undefined)) {
      Alert.alert('Answer all questions', 'Pick an answer for every quiz question first.');
      return;
    }
    setCompleting(true);
    try {
      const r: any = await api.post(`/mobile/courses/${course}/lessons/${lesson}/quiz`, {
        answers: questions.map((_, i) => ({ questionIndex: i, selectedOptionIndex: answers[i] ?? 0 })),
      });
      setQuizResult(r?.quizResult ?? null);
    } catch (e) {
      Alert.alert('Quiz submission failed', errorMessage(e));
    } finally {
      setCompleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <Header title={title} onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!!content && <Text style={styles.contentText}>{content}</Text>}

          {questions.length > 0 ? (
            <>
              <Text style={styles.qHint}>
                Lesson quiz · {questions.length} question{questions.length === 1 ? '' : 's'}
                {quiz?.passScore != null ? ` · pass at ${quiz.passScore}%` : ''}
                {userProgress && userProgress.attempts > 0 ? ` · attempt ${userProgress.attempts}` : ''}
              </Text>
              {questions.map((q: any, qi: number) => {
                const opts: string[] = (q.options ?? []).map((o: any) => (typeof o === 'string' ? o : o.text ?? ''));
                return (
                  <View key={qi} style={{ gap: 8 }}>
                    <Text style={styles.q}>{qi + 1}. {q.text}</Text>
                    {opts.map((opt: string, oi: number) => {
                      const isSelected = answers[qi] === oi;
                      return (
                        <TouchableOpacity
                          key={oi}
                          onPress={() => {
                            if (quizResult) return;
                            setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
                          }}
                          style={[styles.opt, isSelected && styles.optSelected]}
                        >
                          <View style={[styles.radio, isSelected && styles.radioSel]}>{isSelected && <View style={styles.radioDot} />}</View>
                          <Text style={styles.optText}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
              {quizResult && (
                <View style={[styles.feedback, quizResult.passed ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' } : { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
                  <Text style={[styles.feedbackText, { color: quizResult.passed ? '#065F46' : '#9F1239' }]}>
                    {quizResult.passed
                      ? `Passed — ${quizResult.correctAnswers}/${quizResult.totalQuestions} correct. Lesson complete.`
                      : `Score ${quizResult.score}% (${quizResult.correctAnswers}/${quizResult.totalQuestions} correct) — you need ${quizResult.passScore}% to pass.`}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                This lesson has no quiz{content ? '' : ' — its full content is available in the web app'}.
              </Text>
            </View>
          )}

          <TouchableOpacity style={[styles.primaryBtn, completing && { opacity: 0.7 }]} disabled={completing} onPress={complete}>
            <Text style={styles.primaryText}>{completing ? 'Submitting...' : quizResult ? 'Continue' : questions.length > 0 ? 'Submit quiz' : 'Continue'}</Text>
          </TouchableOpacity>
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
  contentText: { fontSize: 13, color: '#1A1E22', lineHeight: 19 },
  q: { fontSize: 16, fontWeight: '800', color: '#1A1E22', lineHeight: 22 },
  qHint: { fontSize: 11, color: '#6B7280' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14 },
  optSelected: { borderColor: '#1A1E22', backgroundColor: '#FFFEFC' },
  optCorrect: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  optWrong: { borderColor: '#EF4444', backgroundColor: '#FFF1F2' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#CFCFCF', alignItems: 'center', justifyContent: 'center' },
  radioSel: { borderColor: '#1A1E22' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A1E22' },
  optText: { flex: 1, fontSize: 13, color: '#1A1E22' },
  feedback: { borderWidth: 1, borderRadius: 12, padding: 12 },
  feedbackText: { fontSize: 13, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  emptyBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 16 },
  emptyText: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  errorWrap: { alignItems: 'center', gap: 10, padding: 24 },
  errorIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22' },
  errorText: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 16 },
  retryBtn: { backgroundColor: '#1A1E22', borderRadius: 10, paddingHorizontal: 22, paddingVertical: 12 },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  webLinkBtn: { backgroundColor: '#D96A3E', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  webLinkText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

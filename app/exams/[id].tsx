// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mirrors C:\luav6\resources\js\pages\Exams\Show.vue logic (server deadline, autosave, flags, submit, review)
type QType = 'multiple_choice' | 'true_false' | 'identification' | 'essay' | 'enumeration' | 'matching';

type Question = {
  text: string;
  type: QType;
  options?: { text: string; is_correct?: boolean }[] | null;
  points: number;
  correct_answer?: string | null;
  enumeration_items?: { points: number }[] | null;
  matching_items?: { index: number; prompt: string; points: number }[] | null;
  matching_options?: { value: string; text: string }[] | null;
};

type Part = { id: number; title: string; instructions: string | null; points: number; questions: Question[] };

const MOCK_PARTS: Part[] = [
  {
    id: 1,
    title: 'Part A — Multiple Choice',
    instructions: 'Choose the best answer. Flag questions to review later.',
    points: 30,
    questions: [
      { text: 'What is the solution to 2x + 3 = 11?', type: 'multiple_choice', points: 10, options: [{ text: 'x = 3' }, { text: 'x = 4', is_correct: true }, { text: 'x = 5' }, { text: 'x = 6' }] },
      { text: 'True or False: The slope of y = 2x + 1 is 2.', type: 'true_false', points: 5, options: [{ text: 'True', is_correct: true }, { text: 'False' }] },
      { text: 'Define “linear equation” in one sentence.', type: 'essay', points: 15 },
    ],
  },
  {
    id: 2,
    title: 'Part B — Identification & Enumeration',
    instructions: 'Fill in the required items. All blanks required.',
    points: 20,
    questions: [
      { text: 'What is the capital of France?', type: 'identification', points: 5, correct_answer: 'Paris' },
      { text: 'List 3 prime numbers under 10', type: 'enumeration', points: 9, enumeration_items: [{ points: 3 }, { points: 3 }, { points: 3 }] },
      { text: 'Match the term to its definition', type: 'matching', points: 6, matching_items: [{ index: 0, prompt: 'Slope', points: 3 }, { index: 1, prompt: 'Intercept', points: 3 }], matching_options: [{ value: 'm', text: 'Rise/Run' }, { value: 'b', text: 'Where line crosses y-axis' }] },
    ],
  },
];

export default function ExamTakeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const examTitle = `Mathematics Midterm`;
  const duration = 45 * 60; // 45 min
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [pendingPart, setPendingPart] = useState<Part | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [mobileIndex, setMobileIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [answerState, setAnswerState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submittedParts, setSubmittedParts] = useState<Set<number>>(new Set());
  const [showUnansweredWarn, setShowUnansweredWarn] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showXpModal, setShowXpModal] = useState(false);
  const [xpAward, setXpAward] = useState<{ total: number; completion: number; accuracy: number } | null>(null);

  const isPartSubmitted = (pid: number) => submittedParts.has(pid);
  const isPartLocked = (idx: number) => {
    if (idx === 0) return false;
    return !isPartSubmitted(MOCK_PARTS[idx - 1].id);
  };

  // Timer - mirrors Show.vue startTimer() + applyDeadline() + auto-submit
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!examStarted || !selectedPart) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // auto-submit on timeout
          setTimeout(() => handleSubmitPart(true), 300);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, selectedPart?.id]);

  // Autosave pulse - mirrors persistQueuedAnswers + saveDraft every 500ms
  useEffect(() => {
    if (!examStarted || !selectedPart) return;
    setAnswerState('saving');
    const t = setTimeout(() => setAnswerState('saved'), 600);
    return () => clearTimeout(t);
  }, [answers]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const answeredCount = Object.values(answers).filter((v) => v !== undefined && v !== null && String(v).trim() !== '' && !(Array.isArray(v) && v.some((x) => !String(x).trim()))).length;
  const totalQ = selectedPart?.questions?.length ?? 0;
  const unanswered = totalQ - answeredCount;
  const progressPct = totalQ ? (answeredCount / totalQ) * 100 : 0;

  const onSelectPart = (part: Part, idx: number) => {
    if (isPartSubmitted(part.id) || isPartLocked(idx)) return;
    setPendingPart(part);
    setShowStartModal(true);
  };

  const confirmStart = async () => {
    if (!pendingPart) return;
    // Mirrors reEnterFullscreen() + startServerClock() - mobile: no fullscreen, just start
    setSelectedPart(pendingPart);
    setAnswers({});
    setFlagged(new Set());
    setMobileIndex(0);
    setExamStarted(true);
    setShowStartModal(false);
    // pretend server anchors deadline
    setTimeLeft(duration);
  };

  const toggleFlag = (idx: number) => {
    setFlagged((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  };

  const handleSubmitPart = (isTimeout = false) => {
    if (!selectedPart) return;
    if (!isTimeout && unanswered > 0 && !pendingSubmit) {
      setShowUnansweredWarn(true);
      return;
    }
    // Simulate PUT /exams/{exam}/parts/{part}/answers + POST submit
    setPendingSubmit(false);
    setShowUnansweredWarn(false);
    const newSubmitted = new Set(submittedParts);
    newSubmitted.add(selectedPart.id);
    setSubmittedParts(newSubmitted);

    // Show success + XP (mirrors showSuccessModal + showXpModal + xpAward)
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      if (newSubmitted.size === MOCK_PARTS.length) {
        // all parts done -> XP award
        setXpAward({ total: 85, completion: 30, accuracy: 45 });
        setShowXpModal(true);
      } else {
        // back to list view for next part
        setSelectedPart(null);
        setExamStarted(false);
      }
    }, 1200);
  };

  const isAllDone = submittedParts.size === MOCK_PARTS.length;

  // --- List view (select part) ---
  if (!selectedPart) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Exam #{id} · {examTitle}</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.examHero}>
              <Text style={styles.heroTitle}>{examTitle}</Text>
              <Text style={styles.heroSub}>45 min · 2 parts · {MOCK_PARTS.reduce((s, p) => s + (p.questions?.length ?? 0), 0)} questions</Text>
              <View style={styles.heroProgress}><View style={[styles.heroProgressFg, { width: `${(submittedParts.size / MOCK_PARTS.length) * 100}%` }]} /></View>
              <Text style={styles.heroProgressText}>{submittedParts.size}/{MOCK_PARTS.length} parts submitted</Text>
            </View>

            {isAllDone ? (
              <View style={styles.doneCard}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                <Text style={styles.doneTitle}>All parts submitted</Text>
                <Text style={styles.doneSub}>Results will unlock once your teacher closes the exam.</Text>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/exams' as any)} style={styles.primaryBtn}><Text style={styles.primaryText}>Back to exams</Text></TouchableOpacity>
              </View>
            ) : (
              MOCK_PARTS.map((part, idx) => {
                const done = isPartSubmitted(part.id);
                const locked = isPartLocked(idx);
                return (
                  <TouchableOpacity key={part.id} onPress={() => onSelectPart(part, idx)} disabled={done || locked} style={[styles.partCard, done && { opacity: 0.6, backgroundColor: '#F9F7F4' }, locked && { opacity: 0.5 }]}>
                    <View style={[styles.partIcon, done ? { backgroundColor: '#10B981' } : locked ? { backgroundColor: '#EAE5DE' } : { backgroundColor: '#1A1E22' }]}>
                      <Ionicons name={done ? 'checkmark' : locked ? 'lock-closed' : 'play'} size={16} color={done ? '#fff' : locked ? '#6B7280' : '#fff'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partTitle}>{part.title}</Text>
                      <Text style={styles.partMeta}>{part.questions.length} questions · {part.points} pts {done ? '· Completed' : locked ? '· Locked' : ''}</Text>
                      {part.instructions && <Text style={styles.partInstr}>{part.instructions}</Text>}
                    </View>
                    {!done && !locked && <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />}
                    {done && <View style={styles.doneBadge}><Text style={styles.doneBadgeText}>Done</Text></View>}
                  </TouchableOpacity>
                );
              })
            )}

            {/* Pre-warm AI hint - mirrors POST exams/pre-warm-ai */}
            <View style={styles.hintCard}><Ionicons name="sparkles" size={16} color="#D96A3E" /><Text style={styles.hintText}>AI grading pre-warmed · Essay answers auto-scored after submit</Text></View>
          </ScrollView>

          {/* Start confirm modal - mirrors showStartModal */}
          <Modal visible={showStartModal} transparent animationType="fade" onRequestClose={() => setShowStartModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalIcon}><Ionicons name="play-circle" size={28} color="#D96A3E" /></View>
                <Text style={styles.modalTitle}>Start this part?</Text>
                <Text style={styles.modalSub}>{pendingPart?.title} · {pendingPart?.questions?.length} questions · {duration / 60} min</Text>
                <Text style={styles.modalHint}>Timer starts now. Autosave every 2s. Flag questions with F.</Text>
                <View style={styles.modalRow}>
                  <TouchableOpacity onPress={() => setShowStartModal(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={confirmStart} style={styles.modalConfirm}><Text style={styles.modalConfirmText}>Start</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* XP modal - mirrors showXpModal + xpAward */}
          <Modal visible={showXpModal} transparent animationType="fade" onRequestClose={() => setShowXpModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, { alignItems: 'center' }]}>
                <Ionicons name="trophy" size={40} color="#F59E0B" />
                <Text style={[styles.modalTitle, { textAlign: 'center' }]}>XP Earned!</Text>
                {xpAward && (
                  <View style={{ gap: 6, width: '100%' }}>
                    <View style={styles.xpRow}><Text style={styles.xpLabel}>Completion</Text><Text style={styles.xpVal}>+{xpAward.completion} XP</Text></View>
                    <View style={styles.xpRow}><Text style={styles.xpLabel}>Accuracy</Text><Text style={styles.xpVal}>+{xpAward.accuracy} XP</Text></View>
                    <View style={[styles.xpRow, { borderTopWidth: 1, borderTopColor: '#EAE5DE', paddingTop: 8, marginTop: 4 }]}><Text style={[styles.xpLabel, { fontWeight: '900' }]}>Total</Text><Text style={[styles.xpVal, { color: '#D96A3E' }]}>+{xpAward.total} XP</Text></View>
                  </View>
                )}
                <TouchableOpacity onPress={() => { setShowXpModal(false); router.replace('/(tabs)/exams' as any); }} style={[styles.primaryBtn, { width: '100%' }]}><Text style={styles.primaryText}>Continue</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  // --- Taking view ---
  const q = selectedPart.questions[mobileIndex];
  const qAnswer = answers[mobileIndex];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        {/* Top bar - mirrors timer + progress + integrity */}
        <View style={styles.takeHeader}>
          <TouchableOpacity onPress={() => { setSelectedPart(null); setExamStarted(false); }} style={styles.backBtn}><Ionicons name="close" size={18} color="#1A1E22" /></TouchableOpacity>
          <View style={styles.timerPill}><Ionicons name="timer-outline" size={14} color={timeLeft < 120 ? '#EF4444' : '#1A1E22'} /><Text style={[styles.timerText, timeLeft < 120 && { color: '#EF4444' }]}>{fmtTime(timeLeft)}</Text></View>
          <View style={styles.savePill}><View style={[styles.saveDot, answerState === 'saving' ? { backgroundColor: '#F59E0B' } : answerState === 'saved' ? { backgroundColor: '#10B981' } : answerState === 'error' ? { backgroundColor: '#EF4444' } : { backgroundColor: '#9AA0A6' }]} /><Text style={styles.saveText}>{answerState === 'saving' ? 'Saving...' : answerState === 'saved' ? 'Saved' : answerState === 'error' ? 'Retry' : 'Idle'}</Text></View>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressBg}><View style={[styles.progressFg, { width: `${progressPct}%` }]} /></View>
          <Text style={styles.progressText}>{answeredCount}/{totalQ} · {Math.round(progressPct)}%</Text>
          <TouchableOpacity onPress={() => toggleFlag(mobileIndex)} style={[styles.flagBtn, flagged.has(mobileIndex) && { backgroundColor: '#FFF0EB', borderColor: '#F0C4B0' }]}><Ionicons name={flagged.has(mobileIndex) ? 'flag' : 'flag-outline'} size={14} color={flagged.has(mobileIndex) ? '#D96A3E' : '#6B7280'} /><Text style={[styles.flagText, flagged.has(mobileIndex) && { color: '#D96A3E' }]}>Flag</Text></TouchableOpacity>
        </View>

        {/* Question navigator dots - mirrors progress navigator */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
          {selectedPart.questions.map((_, i) => {
            const isAnswered = answers[i] !== undefined && answers[i] !== null && String(answers[i]).trim() !== '' && !(Array.isArray(answers[i]) && answers[i].some((x: string) => !x.trim()));
            const isFlagged = flagged.has(i);
            const isActive = i === mobileIndex;
            return (
              <TouchableOpacity key={i} onPress={() => setMobileIndex(i)} style={[styles.navDot, isActive && styles.navActive, isFlagged && { borderColor: '#D96A3E', backgroundColor: '#FFF0EB' }, isAnswered && !isActive && { backgroundColor: '#1A1E22', borderColor: '#1A1E22' }]}>
                <Text style={[styles.navNum, isAnswered && !isActive && { color: '#fff' }, isActive && { color: '#fff' }]}>{i + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.qContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.qType}>{q.type.replace('_', ' ')} · {q.points} pts</Text>
          <Text style={styles.qText}>{mobileIndex + 1}. {q.text}</Text>

          {q.type === 'multiple_choice' || q.type === 'true_false' ? (
            <View style={{ gap: 10 }}>
              {q.options?.map((opt, oi) => (
                <TouchableOpacity key={oi} onPress={() => setAnswers({ ...answers, [mobileIndex]: oi })} style={[styles.opt, qAnswer === oi && styles.optSelected]}>
                  <View style={[styles.radio, qAnswer === oi && styles.radioSel]}>{qAnswer === oi && <View style={styles.radioDot} />}</View>
                  <Text style={styles.optText}>{opt.text}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.kbHint}>Press 1-4 to select · F to flag</Text>
            </View>
          ) : q.type === 'identification' ? (
            <View style={styles.inputWrap}>
              <TextInput value={qAnswer || ''} onChangeText={(v) => setAnswers({ ...answers, [mobileIndex]: v })} placeholder="Type your answer" placeholderTextColor="#9AA0A6" style={styles.input} />
            </View>
          ) : q.type === 'essay' ? (
            <View style={styles.inputWrap}>
              <TextInput value={qAnswer || ''} onChangeText={(v) => setAnswers({ ...answers, [mobileIndex]: v })} placeholder="Write your answer (AI will grade after submit)" placeholderTextColor="#9AA0A6" multiline style={[styles.input, { minHeight: 120, textAlignVertical: 'top' as any }]} />
              <Text style={styles.essayHint}>Essay is graded by AI after submission — score appears with review.</Text>
            </View>
          ) : q.type === 'enumeration' ? (
            <View style={{ gap: 10 }}>
              {(q.enumeration_items || []).map((_, ei) => (
                <View key={ei} style={styles.inputWrap}>
                  <TextInput value={Array.isArray(qAnswer) ? qAnswer[ei] || '' : ''} onChangeText={(v) => { const arr = Array.isArray(qAnswer) ? [...qAnswer] : Array(q.enumeration_items?.length).fill(''); arr[ei] = v; setAnswers({ ...answers, [mobileIndex]: arr }); }} placeholder={`Answer ${ei + 1}`} placeholderTextColor="#9AA0A6" style={styles.input} />
                </View>
              ))}
            </View>
          ) : q.type === 'matching' ? (
            <View style={{ gap: 10 }}>
              {(q.matching_items || []).map((mi, miIdx) => (
                <View key={mi.index} style={styles.matchRow}>
                  <Text style={styles.matchPrompt}>{mi.prompt}</Text>
                  <View style={styles.matchSelectWrap}>
                    <TextInput value={Array.isArray(qAnswer) ? qAnswer[miIdx] || '' : ''} onChangeText={(v) => { const arr = Array.isArray(qAnswer) ? [...qAnswer] : Array(q.matching_items?.length).fill(''); arr[miIdx] = v; setAnswers({ ...answers, [mobileIndex]: arr }); }} placeholder="Choose" placeholderTextColor="#9AA0A6" style={styles.matchInput} />
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.qNav}>
            <TouchableOpacity disabled={mobileIndex === 0} onPress={() => setMobileIndex((i) => Math.max(0, i - 1))} style={[styles.qNavBtn, mobileIndex === 0 && { opacity: 0.4 }]}><Ionicons name="chevron-back" size={16} color="#1A1E22" /><Text style={styles.qNavText}>Prev</Text></TouchableOpacity>
            <Text style={styles.qNavCount}>{mobileIndex + 1} / {totalQ}</Text>
            <TouchableOpacity disabled={mobileIndex === totalQ - 1} onPress={() => setMobileIndex((i) => Math.min(totalQ - 1, i + 1))} style={[styles.qNavBtn, mobileIndex === totalQ - 1 && { opacity: 0.4 }]}><Text style={styles.qNavText}>Next</Text><Ionicons name="chevron-forward" size={16} color="#1A1E22" /></TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => handleSubmitPart()} style={[styles.submitBtn, unanswered === 0 && { backgroundColor: '#1A1E22' }]}>
            <Text style={styles.submitText}>{unanswered === 0 ? 'Submit part' : `Submit part (${unanswered} unanswered)`}</Text>
          </TouchableOpacity>
          {unanswered > 0 && <Text style={styles.unansweredHint}>You have {unanswered} unanswered — you can still submit.</Text>}
        </ScrollView>

        {/* Unanswered warning - mirrors showUnansweredWarning */}
        <Modal visible={showUnansweredWarn} transparent animationType="fade" onRequestClose={() => setShowUnansweredWarn(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.warnIcon}><Ionicons name="alert-circle" size={24} color="#F59E0B" /></View>
              <Text style={styles.modalTitle}>Unanswered questions</Text>
              <Text style={styles.modalSub}>You have {unanswered} unanswered question{unanswered !== 1 ? 's' : ''}. Submit anyway?</Text>
              <View style={styles.modalRow}>
                <TouchableOpacity onPress={() => setShowUnansweredWarn(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Review</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowUnansweredWarn(false); setPendingSubmit(true); setTimeout(() => handleSubmitPart(true), 200); }} style={[styles.modalConfirm, { backgroundColor: '#D96A3E' }]}><Text style={styles.modalConfirmText}>Submit anyway</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success - mirrors showSuccessModal */}
        <Modal visible={showSuccess} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { alignItems: 'center' }]}>
              <View style={styles.successIcon}><Ionicons name="checkmark-circle" size={48} color="#10B981" /></View>
              <Text style={styles.modalTitle}>Part submitted</Text>
              <Text style={styles.modalSub}>Your answers were saved. {submittedParts.size + 1 < MOCK_PARTS.length ? 'Next part unlocked.' : 'Calculating score...'}</Text>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#FDFBF6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6', borderBottomWidth: 1, borderBottomColor: '#EAE5DE' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 13, fontWeight: '800', color: '#1A1E22', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  content: { padding: 14, gap: 12, paddingBottom: 24 },
  examHero: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 16, gap: 8, alignItems: 'center' },
  heroTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22', textAlign: 'center' },
  heroSub: { fontSize: 11, color: '#6B7280' },
  heroProgress: { width: '100%', height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginTop: 4 },
  heroProgressFg: { height: 6, backgroundColor: '#1A1E22', borderRadius: 3 },
  heroProgressText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  partCard: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14, alignItems: 'center' },
  partIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  partTitle: { fontSize: 13, fontWeight: '800', color: '#1A1E22' },
  partMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  partInstr: { fontSize: 11, color: '#9AA0A6', marginTop: 4, fontStyle: 'italic' },
  doneBadge: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  doneBadgeText: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  hintCard: { flexDirection: 'row', gap: 8, backgroundColor: '#FFF6F0', borderWidth: 1, borderColor: '#F0C4B0', borderRadius: 10, padding: 10, alignItems: 'center' },
  hintText: { flex: 1, fontSize: 11, color: '#9A4600', lineHeight: 14 },
  doneCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 24, alignItems: 'center', gap: 10 },
  doneTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22' },
  doneSub: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12 },
  modalIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  warnIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  successIcon: { alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22', textAlign: 'center' },
  modalSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 16 },
  modalHint: { fontSize: 11, color: '#9AA0A6', textAlign: 'center' },
  modalRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  modalCancelText: { fontWeight: '700', color: '#1A1E22', fontSize: 13 },
  modalConfirm: { flex: 1, backgroundColor: '#1A1E22', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  xpLabel: { fontSize: 12, color: '#6B7280' },
  xpVal: { fontSize: 12, fontWeight: '800', color: '#1A1E22' },
  takeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EAE5DE', gap: 8 },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFEFC' },
  timerText: { fontSize: 13, fontWeight: '900', color: '#1A1E22', fontVariant: ['tabular-nums'] as any },
  savePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  saveDot: { width: 8, height: 8, borderRadius: 4 },
  saveText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFEFC', borderBottomWidth: 1, borderBottomColor: '#EAE5DE' },
  progressBg: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3 },
  progressFg: { height: 6, backgroundColor: '#1A1E22', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '700', color: '#1A1E22' },
  flagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#fff' },
  flagText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  navRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FDFBF6' },
  navDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  navActive: { backgroundColor: '#1A1E22', borderColor: '#1A1E22' },
  navNum: { fontSize: 11, fontWeight: '800', color: '#1A1E22' },
  qContent: { padding: 14, gap: 14, paddingBottom: 24 },
  qType: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: '#9AA0A6', textTransform: 'uppercase' },
  qText: { fontSize: 15, fontWeight: '700', color: '#1A1E22', lineHeight: 20 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14 },
  optSelected: { borderColor: '#1A1E22', backgroundColor: '#F9F7F4' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#CFCFCF', alignItems: 'center', justifyContent: 'center' },
  radioSel: { borderColor: '#1A1E22' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A1E22' },
  optText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1A1E22' },
  kbHint: { fontSize: 10, color: '#9AA0A6', textAlign: 'center' },
  inputWrap: { borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 12 },
  input: { paddingVertical: 12, fontSize: 14, color: '#1A1E22' },
  essayHint: { fontSize: 10, color: '#9AA0A6', marginTop: 6 },
  matchRow: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 12 },
  matchPrompt: { flex: 1, fontSize: 12, fontWeight: '600', color: '#1A1E22' },
  matchSelectWrap: { flex: 1, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 8, paddingHorizontal: 8, backgroundColor: '#FFFEFC' },
  matchInput: { paddingVertical: 8, fontSize: 12, color: '#1A1E22' },
  qNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  qNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff' },
  qNavText: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  qNavCount: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  submitBtn: { backgroundColor: '#6B7280', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  unansweredHint: { fontSize: 11, color: '#9AA0A6', textAlign: 'center' },
});

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage, webLink } from '@/lib/api';
import { fmtTime, parseDate } from '@/lib/format';
import { PageSkeleton } from '@/components/PageSkeleton';

// ---------------------------------------------------------------------------
// Real exam flow against LUA V6. Mirrors resources/js/pages/Exams/Show.vue:
//   GET  /exams/{id}                         → exam + parts + questions (+ review data when locked)
//   PUT  /exams/{id}/parts/{partId}/answers  → autosave  { answers: { [questionIndex]: value } }
//   POST /exams/{id}/parts/{partId}/submit   → submit the part
// Answers are keyed by 0-based question index within a part (matches the web
// draft shape `exam_draft_*`). If your routes differ, adjust ENDPOINTS below.
// ---------------------------------------------------------------------------
const ENDPOINTS = {
  show: (id: string | number) => `/exams/${id}`,
  saveAnswers: (id: string | number, partId: number) => `/exams/${id}/parts/${partId}/answers`,
  submitPart: (id: string | number, partId: number) => `/exams/${id}/parts/${partId}/submit`,
};

type Question = {
  id?: number;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'identification' | 'essay' | 'enumeration' | 'matching';
  options?: { text: string; is_correct?: boolean }[] | null;
  points: number;
  correct_answer?: string | null;
  enumeration_items?: { points: number }[] | null;
  matching_items?: { index: number; prompt: string; points: number }[] | null;
  matching_options?: { value: string; text: string }[] | null;
  feedback?: string | null;
};

type Part = {
  id: number;
  title: string;
  instructions?: string | null;
  points: number;
  questions: Question[];
  submitted?: boolean;
  is_submitted?: boolean;
  answers?: Record<number, any>;
  user_answers?: Record<number, any>;
  xp_award?: any;
  [key: string]: any;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const partSubmitted = (p: Part) => Boolean(p.submitted ?? p.is_submitted);

export default function ExamTakeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null); // index into parts
  const [pendingIdx, setPendingIdx] = useState<number | null>(null); // start modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [answers, setAnswers] = useState<Record<number, any>>({}); // keyed by question index in active part
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [mobileIndex, setMobileIndex] = useState(0);
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [submittedParts, setSubmittedParts] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [showUnansweredWarn, setShowUnansweredWarn] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [xpAward, setXpAward] = useState<{ total: number; completion: number; accuracy: number } | null>(null);

  const examId = Number(id);
  const examTitle = exam?.title ?? exam?.name ?? 'Exam';
  const examIsLocked = Boolean(exam?.is_locked) || exam?.status === 'locked' || exam?.status === 'submitted';
  const activePart = activeIdx != null ? parts[activeIdx] : null;

  // ---------------------------------------------------------------- load
  const loadExam = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    setLoaded(false);
    try {
      const r: any = await api.get(ENDPOINTS.show(id));
      const data = r.data ?? r;
      setExam(data);
      const ps: Part[] = (data.parts ?? data.data?.parts ?? []).filter((p: any) => p && Array.isArray(p.questions));
      setParts(ps);
      setSubmittedParts(new Set(ps.filter(partSubmitted).map((p) => p.id)));
      setLoaded(true);
    } catch (e) {
      setLoadError(errorMessage(e));
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // ----------------------------------------------------------- deadline
  const computeDeadline = useCallback((): number | null => {
    if (!exam) return null;
    const explicit = parseDate(exam.deadline_iso ?? exam.deadline ?? exam.ends_at_iso ?? exam.ends_at);
    if (explicit) return explicit.getTime();
    const durationMin: number = Number(exam.duration_minutes ?? exam.duration ?? 0);
    if (durationMin > 0) {
      const start = parseDate(exam.starts_at_iso ?? exam.starts_at ?? exam.exam_date_iso);
      const base = start && start.getTime() > Date.now() ? start.getTime() : Date.now();
      return base + durationMin * 60000;
    }
    return null;
  }, [exam]);

  useEffect(() => {
    if (loaded && !examIsLocked) {
      const d = computeDeadline();
      setDeadlineMs(d);
      if (d) setTimeLeft(Math.max(0, Math.floor((d - Date.now()) / 1000)));
    }
  }, [loaded, examIsLocked, computeDeadline]);

  // 1s tick (drift-safe: always derived from the deadline, not decremented)
  useEffect(() => {
    if (activeIdx == null || !deadlineMs) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
      setTimeLeft(left);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [activeIdx, deadlineMs]);

  // ------------------------------------------------------------ answers
  const setAnswer = (qIdx: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: value }));
  };

  const answeredCount = useMemo(() => {
    if (!activePart) return 0;
    return activePart.questions.filter((q, i) => {
      const v = answers[i];
      if (v === undefined || v === null) return false;
      if (typeof v === 'string') return v.trim() !== '';
      if (Array.isArray(v)) return v.some((x) => String(x ?? '').trim() !== '');
      if (typeof v === 'object') return Object.values(v).some((x) => String(x ?? '').trim() !== '');
      return true;
    }).length;
  }, [activePart, answers]);
  const totalQ = activePart?.questions?.length ?? 0;
  const unanswered = totalQ - answeredCount;
  const progressPct = totalQ ? (answeredCount / totalQ) * 100 : 0;

  // --------------------------------------------------------- autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<{ partId: number; answers: Record<number, any> } | null>(null);
  const partActiveRef = useRef(false);
  partActiveRef.current = activeIdx != null && !examIsLocked;

  useEffect(() => {
    if (activeIdx == null || examIsLocked) return;
    const part = parts[activeIdx];
    if (!part) return;
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.put(ENDPOINTS.saveAnswers(examId, part.id), { answers });
        lastSaved.current = { partId: part.id, answers };
        setSaveState('saved');
      } catch {
        setSaveState('error'); // surfaced in the save indicator; retried on next change
      }
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- parts[activeIdx] is stable for a session
  }, [answers, activeIdx, examIsLocked, examId]);

  // Best-effort final save on unmount (mirrors Show.vue persistQueuedAnswers):
  // flush the active part's latest answers if they differ from the last save.
  const activeIdxRef = useRef<number | null>(null);
  const answersRef = useRef<Record<number, any>>({});
  activeIdxRef.current = activeIdx;
  answersRef.current = answers;
  useEffect(() => {
    return () => {
      if (!partActiveRef.current) return;
      const idx = activeIdxRef.current;
      if (idx == null || idx >= parts.length) return;
      const part = parts[idx];
      const current = answersRef.current;
      const last = lastSaved.current;
      if (!part || (last && last.partId === part.id && JSON.stringify(last.answers) === JSON.stringify(current))) return;
      api.put(ENDPOINTS.saveAnswers(examId, part.id), { answers: current }).catch(() => {});
    };
  }, [parts, examId]);

  // -------------------------------------------------------- part start
  const isPartLocked = (idx: number) => {
    if (idx === 0) return false;
    return !isPartSubmitted(parts[idx - 1]?.id);
  };
  const isPartSubmitted = (partId: number) => submittedParts.has(partId);

  const onSelectPart = (idx: number) => {
    if (activeIdx == null) {
      // Part picker → start modal
      if (isPartSubmitted(parts[idx]?.id) || isPartLocked(idx)) return;
      setPendingIdx(idx);
      setShowStartModal(true);
    }
  };

  const confirmStart = () => {
    if (pendingIdx == null) return;
    const part = parts[pendingIdx];
    // Seed with previously saved answers if the server returned them.
    const prev = part.answers ?? part.user_answers ?? {};
    setAnswers(prev && typeof prev === 'object' ? { ...prev } : {});
    setFlagged(new Set());
    setMobileIndex(0);
    setActiveIdx(pendingIdx);
    setPendingIdx(null);
    setShowStartModal(false);
    setSaveState('idle');
    const d = computeDeadline();
    setDeadlineMs(d);
    if (d) setTimeLeft(Math.max(0, Math.floor((d - Date.now()) / 1000)));
  };

  // -------------------------------------------------------- submit part
  const submitPart = useCallback(
    async (isTimeout: boolean) => {
      const idx = activeIdx;
      if (idx == null || submitting) return;
      const part = parts[idx];
      if (!part || isPartSubmitted(part.id)) return;
      if (!isTimeout && unanswered > 0 && !pendingSubmit) {
        setShowUnansweredWarn(true);
        return;
      }
      setShowUnansweredWarn(false);
      setPendingSubmit(false);
      setSubmitting(true);
      try {
        // Save answers right before submitting so nothing is lost.
        try {
          await api.put(ENDPOINTS.saveAnswers(examId, part.id), { answers });
        } catch {
          /* submit endpoint is the source of truth */
        }
        const res: any = await api.post(ENDPOINTS.submitPart(examId, part.id), { answers });
        const newSubmitted = new Set(submittedParts);
        newSubmitted.add(part.id);
        setSubmittedParts(newSubmitted);
        const data = res?.data ?? res;
        const xp = data?.xp_award ?? data?.xpAward ?? part.xp_award;
        if (xp && typeof xp === 'object') {
          setXpAward({
            total: Number(xp.total ?? xp.amount ?? 0),
            completion: Number(xp.completion ?? 0),
            accuracy: Number(xp.accuracy ?? 0),
          });
        }
        setShowSuccess(true);
        if (newSubmitted.size >= parts.length) {
          setTimeout(() => {
            setShowSuccess(false);
            setShowDone(true);
          }, 1400);
        }
        setActiveIdx(null);
      } catch (e) {
        if (!isTimeout) {
          Alert.alert('Submit failed', errorMessage(e), [
            { text: 'OK' },
          ]);
        }
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIdx, submitting, parts, examId, answers, unanswered, pendingSubmit, submittedParts]
  );

  // Auto-submit on timeout
  useEffect(() => {
    if (timeLeft === 0 && activeIdx != null && deadlineMs && !examIsLocked) {
      submitPart(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire exactly once at zero
  }, [timeLeft]);

  const toggleFlag = (idx: number) => {
    setFlagged((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  };

  // ---------------------------------------------------------------- render
  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}><View style={styles.headerPlaceholder} /><PageSkeleton count={5} /></View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}>
          <Header title="Exam" onBack={() => router.back()} />
          <View style={styles.errorWrap}>
            <View style={styles.errorIcon}><Ionicons name="cloud-offline-outline" size={30} color="#8A8A8A" /></View>
            <Text style={styles.errorTitle}>Couldn&apos;t load this exam</Text>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadExam}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
            <TouchableOpacity style={styles.webLinkBtn} onPress={() => Linking.openURL(webLink(`/exams/${id}`))}>
              <Text style={styles.webLinkText}>Open in web app</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ------------------------------------------------------------ REVIEW
  if (examIsLocked) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}>
          <Header title={examTitle} onBack={() => router.back()} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.reviewBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#3A7D5C" />
              <Text style={styles.reviewBannerText}>This exam is submitted — you&apos;re viewing your results.</Text>
            </View>
            {parts.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Detailed per-question results aren&apos;t available in the API response. Review the full breakdown in the web app.
                </Text>
                <TouchableOpacity style={styles.webLinkBtn} onPress={() => Linking.openURL(webLink(`/exams/${id}`))}>
                  <Text style={styles.webLinkText}>Full review in web app</Text>
                </TouchableOpacity>
              </View>
            )}
            {parts.map((p, pIdx) => (
              <PartReview key={p.id} part={p} index={pIdx + 1} />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ------------------------------------------------------------- PICKER
  if (activeIdx == null) {
    const allDone = parts.length > 0 && parts.every((p) => isPartSubmitted(p.id));
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}>
          <Header title={examTitle} onBack={() => router.back()} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.examMeta}>
              <View style={styles.metaChip}><Ionicons name="time-outline" size={13} color="#6B7280" /><Text style={styles.metaChipText}>{exam?.duration_minutes ?? '—'} min total</Text></View>
              <View style={styles.metaChip}><Ionicons name="document-text-outline" size={13} color="#6B7280" /><Text style={styles.metaChipText}>{parts.length} parts · {parts.reduce((n, p) => n + (p.points ?? 0), 0)} pts</Text></View>
              {deadlineMs && (
                <View style={styles.metaChip}><Ionicons name="alarm-outline" size={13} color="#D96A3E" /><Text style={[styles.metaChipText, { color: '#D96A3E' }]}>Ends {parseDate(deadlineMs)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
              )}
            </View>
            <Text style={styles.sectionTitle}>Parts</Text>
            {parts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  This exam has no answerable parts (yet). The teacher may still be publishing it — check back soon, or open it in the web app.
                </Text>
                <TouchableOpacity style={styles.webLinkBtn} onPress={() => Linking.openURL(webLink(`/exams/${id}`))}>
                  <Text style={styles.webLinkText}>Open in web app</Text>
                </TouchableOpacity>
              </View>
            ) : (
              parts.map((p, idx) => {
                const submitted = isPartSubmitted(p.id);
                const locked = isPartLocked(idx);
                const disabled = submitted || locked;
                return (
                  <TouchableOpacity key={p.id} style={[styles.partCard, disabled && { opacity: 0.6 }]} onPress={() => onSelectPart(idx)}>
                    <View style={[styles.partNum, submitted ? styles.partNumDone : { backgroundColor: '#FFF0EB' }]}>
                      {submitted ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={[styles.partNumText, !submitted && { color: '#D96A3E' }]}>{idx + 1}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partTitle}>{p.title}</Text>
                      <Text style={styles.partMeta}>{p.questions.length} questions · {p.points} pts {locked && '· starts after part ' + idx}</Text>
                    </View>
                    <View style={submitted ? styles.doneBadge : locked ? styles.lockBadge : styles.openBadge}>
                      <Text style={submitted ? styles.doneBadgeText : locked ? styles.lockBadgeText : styles.openBadgeText}>
                        {submitted ? 'Submitted' : locked ? 'Locked' : 'Start'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
            {allDone && (
              <TouchableOpacity style={styles.doneCard} onPress={() => setShowDone(true)}>
                <Ionicons name="trophy" size={20} color="#D96A3E" />
                <View style={{ flex: 1 }}><Text style={styles.doneCardTitle}>Exam complete</Text><Text style={styles.doneCardSub}>View your summary</Text></View>
                <Ionicons name="chevron-forward" size={16} color="#1A1E22" />
              </TouchableOpacity>
            )}
          </ScrollView>
          {/* Done summary (all parts submitted during this session) */}
          <Modal visible={showDone} transparent animationType="fade" onRequestClose={() => setShowDone(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.successIcon}><Ionicons name="checkmark" size={26} color="#fff" /></View>
                <Text style={styles.modalTitle}>Exam submitted</Text>
                {xpAward ? (
                  <View style={styles.xpBox}>
                    <Text style={styles.xpTotal}>+{xpAward.total} XP</Text>
                    <Text style={styles.xpSub}>Completion {xpAward.completion} · Accuracy {xpAward.accuracy}</Text>
                  </View>
                ) : (
                  <Text style={styles.modalSub}>All parts submitted. Your results will appear in the Exams tab.</Text>
                )}
                <TouchableOpacity style={styles.modalPrimary} onPress={() => router.navigate('/(tabs)/exams')}><Text style={styles.modalPrimaryText}>Back to Exams</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  // ------------------------------------------------------------- TAKING
  const q = activePart?.questions[mobileIndex];
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.takeHeader}>
          <TouchableOpacity onPress={() => setActiveIdx(null)} style={styles.backBtn}><Ionicons name="chevron-back" size={18} color="#1A1E22" /></TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.takeTitle} numberOfLines={1}>{activePart?.title}</Text>
            <View style={styles.takeMetaRow}>
              <View style={styles.timerPill}><Ionicons name="time-outline" size={12} color={timeLeft <= 60 ? '#EF4444' : '#1A1E22'} /><Text style={[styles.timerText, timeLeft <= 60 && { color: '#EF4444' }]}>{deadlineMs ? fmtTime(timeLeft) : '--:--'}</Text></View>
              <View style={styles.saveIndicator}>
                <View style={[styles.saveDot, { backgroundColor: saveState === 'error' ? '#EF4444' : saveState === 'saving' ? '#F59E0B' : '#10B981' }]} />
                <Text style={styles.saveText}>
                  {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Save failed — will retry' : 'Autosave on'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.flagBtn} onPress={() => toggleFlag(mobileIndex)}>
            <Ionicons name={flagged.has(mobileIndex) ? 'flag' : 'flag-outline'} size={18} color={flagged.has(mobileIndex) ? '#D96A3E' : '#9AA0A6'} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressBg}><View style={[styles.progressFg, { width: `${progressPct}%` }]} /></View>

        <ScrollView style={styles.takeScroll} contentContainerStyle={styles.takeContent} showsVerticalScrollIndicator={false}>
          <View style={styles.qNav}>
            {activePart?.questions.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setMobileIndex(i)} style={[styles.qDot, i === mobileIndex && styles.qDotActive, i < totalQ && answers[i] !== undefined && answers[i] !== null && String(answers[i] ?? '').trim() !== '' && { borderColor: '#3A7D5C' }]}>
                <Text style={{ color: i === mobileIndex ? '#fff' : '#1A1E22', fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.qProgressText}>{mobileIndex + 1} / {totalQ} · {answeredCount} answered {unanswered > 0 ? `· ${unanswered} left` : '· all answered'}</Text>

          {q && (
            <View style={styles.qCard}>
              <Text style={styles.qText}>{q.text}</Text>
              <Text style={styles.qPoints}>{q.points} pts · {q.type.replace('_', ' ')}</Text>
              <QuestionInput
                question={q}
                value={answers[mobileIndex]}
                onChange={(v) => setAnswer(mobileIndex, v)}
              />
            </View>
          )}

          <View style={styles.takeNavRow}>
            <TouchableOpacity style={[styles.outlineBtn, mobileIndex === 0 && { opacity: 0.4 }]} disabled={mobileIndex === 0} onPress={() => setMobileIndex((i) => Math.max(0, i - 1))}>
              <Ionicons name="chevron-back" size={16} color="#1A1E22" /><Text style={styles.outlineText}>Previous</Text>
            </TouchableOpacity>
            {mobileIndex < totalQ - 1 ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setMobileIndex((i) => Math.min(totalQ - 1, i + 1))}>
                <Text style={styles.primaryText}>Next</Text><Ionicons name="chevron-forward" size={16} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.primaryBtn, submitting && { opacity: 0.7 }]} disabled={submitting} onPress={() => submitPart(false)}>
                <Text style={styles.primaryText}>{submitting ? 'Submitting…' : 'Submit part'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Start confirmation */}
        <Modal visible={showStartModal} transparent animationType="fade" onRequestClose={() => setShowStartModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Start {pendingIdx != null ? parts[pendingIdx]?.title : 'part'}?</Text>
              <Text style={styles.modalSub}>
                The timer runs for the whole exam. Parts lock until the previous one is submitted. Leaving mid-part keeps your autosaved answers.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.modalOutline} onPress={() => setShowStartModal(false)}><Text style={styles.outlineText}>Not yet</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalPrimary} onPress={confirmStart}><Text style={styles.modalPrimaryText}>Start</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Unanswered warning */}
        <Modal visible={showUnansweredWarn} transparent animationType="fade" onRequestClose={() => setShowUnansweredWarn(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={[styles.successIcon, { backgroundColor: '#D96A3E' }]}><Ionicons name="alert-circle" size={24} color="#fff" /></View>
              <Text style={styles.modalTitle}>{unanswered} question{unanswered === 1 ? '' : 's'} unanswered</Text>
              <Text style={styles.modalSub}>You can still submit, but unanswered questions score 0.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.modalOutline} onPress={() => setShowUnansweredWarn(false)}><Text style={styles.outlineText}>Keep answering</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalPrimary} onPress={() => { setPendingSubmit(true); submitPart(false); }}><Text style={styles.modalPrimaryText}>Submit anyway</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success */}
        <Modal visible={showSuccess} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.successIcon}><Ionicons name="checkmark" size={26} color="#fff" /></View>
              <Text style={styles.modalTitle}>Part submitted</Text>
              <Text style={styles.modalSub}>Nice work. Move on to the next part when you&apos;re ready.</Text>
              <TouchableOpacity style={styles.modalPrimary} onPress={() => setShowSuccess(false)}><Text style={styles.modalPrimaryText}>Continue</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Done */}
        <Modal visible={showDone} transparent animationType="fade" onRequestClose={() => setShowDone(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.successIcon}><Ionicons name="checkmark" size={26} color="#fff" /></View>
              <Text style={styles.modalTitle}>Exam submitted</Text>
              {xpAward ? (
                <View style={styles.xpBox}>
                  <Text style={styles.xpTotal}>+{xpAward.total} XP</Text>
                  <Text style={styles.xpSub}>Completion {xpAward.completion} · Accuracy {xpAward.accuracy}</Text>
                </View>
              ) : (
                <Text style={styles.modalSub}>All parts submitted. Your results will appear in the Exams tab.</Text>
              )}
              <TouchableOpacity style={styles.modalPrimary} onPress={() => router.navigate('/(tabs)/exams')}><Text style={styles.modalPrimaryText}>Back to Exams</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------- helpers
function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

function QuestionInput({ question, value, onChange }: { question: Question; value: any; onChange: (v: any) => void }) {
  if (question.type === 'multiple_choice' || question.type === 'true_false') {
    return (
      <View style={{ gap: 8, marginTop: 12 }}>
        {(question.options ?? []).map((opt, i) => {
          const selected = value === i;
          return (
            <TouchableOpacity key={i} style={[styles.opt, selected && styles.optSelected]} onPress={() => onChange(i)}>
              <View style={[styles.radio, selected && styles.radioSel]}>{selected && <View style={styles.radioDot} />}</View>
              <Text style={[styles.optText, selected && { fontWeight: '700' }]}>{opt.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }
  if (question.type === 'identification') {
    return (
      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <TextInput value={typeof value === 'string' ? value : ''} onChangeText={(v) => onChange(v)} placeholder="Type your answer" placeholderTextColor="#9AA0A6" style={styles.input} />
      </View>
    );
  }
  if (question.type === 'essay') {
    return (
      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <TextInput value={typeof value === 'string' ? value : ''} onChangeText={(v) => onChange(v)} placeholder="Write your answer" placeholderTextColor="#9AA0A6" multiline style={[styles.input, { minHeight: 120, textAlignVertical: 'top' as any }]} />
      </View>
    );
  }
  if (question.type === 'enumeration') {
    const count = question.enumeration_items?.length ?? 3;
    const arr: string[] = Array.isArray(value) ? value : Array.from({ length: count }, () => '');
    return (
      <View style={{ gap: 8, marginTop: 12 }}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.inputWrap}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280', marginHorizontal: 12 }}>{i + 1}.</Text>
            <TextInput value={arr[i] ?? ''} onChangeText={(v) => { const next = [...arr]; next[i] = v; onChange(next); }} placeholder={`Item ${i + 1}`} placeholderTextColor="#9AA0A6" style={styles.input} />
          </View>
        ))}
      </View>
    );
  }
  if (question.type === 'matching') {
    const map: Record<number, string> = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return (
      <View style={{ gap: 12, marginTop: 12 }}>
        {(question.matching_items ?? []).map((item) => (
          <View key={item.index}>
            <Text style={styles.matchPrompt}>{item.prompt}</Text>
            <View style={{ gap: 6, marginTop: 6 }}>
              {(question.matching_options ?? []).map((opt) => {
                const selected = map[item.index] === opt.value;
                return (
                  <TouchableOpacity key={opt.value} style={[styles.opt, { paddingVertical: 10 }, selected && styles.optSelected]} onPress={() => onChange({ ...map, [item.index]: opt.value })}>
                    <View style={[styles.radio, selected && styles.radioSel]}>{selected && <View style={styles.radioDot} />}</View>
                    <Text style={[styles.optText, selected && { fontWeight: '700' }]}>{opt.text} ({opt.value})</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }
  return null;
}

function PartReview({ part, index }: { part: Part; index: number }) {
  const answers = (part.answers ?? part.user_answers ?? {}) as Record<number, any>;
  const hasReview =
    part.questions.some((q) => q.feedback) ||
    Object.keys(answers).length > 0 ||
    part.questions.some((q) => q.options?.some((o) => o.is_correct) || q.correct_answer);

  return (
    <View style={styles.reviewPart}>
      <View style={styles.reviewPartHead}>
        <View style={[styles.partNum, partSubmitted(part) ? styles.partNumDone : {}]}><Text style={[styles.partNumText, !partSubmitted(part) && { color: '#D96A3E' }]}>{index}</Text></View>
        <View style={{ flex: 1 }}><Text style={styles.partTitle}>{part.title}</Text><Text style={styles.partMeta}>{part.points} pts</Text></View>
        <View style={partSubmitted(part) ? styles.doneBadge : styles.lockBadge}>
          <Text style={partSubmitted(part) ? styles.doneBadgeText : styles.lockBadgeText}>{partSubmitted(part) ? 'Submitted' : 'Not submitted'}</Text>
        </View>
      </View>
      {!hasReview && (
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8, lineHeight: 16 }}>
          Per-question detail for this part isn&apos;t included in the API response.
        </Text>
      )}
      {part.questions.map((q, i) => {
        const userAnswer = answers[i];
        const correctOpt = q.options?.find((o) => o.is_correct)?.text;
        return (
          <View key={q.id ?? i} style={styles.reviewQ}>
            <Text style={styles.reviewQText}>{i + 1}. {q.text}</Text>
            {userAnswer !== undefined && userAnswer !== null && String(userAnswer ?? '').trim() !== '' && (
              <Text style={styles.reviewLine}><Text style={styles.reviewLabel}>Your answer: </Text>{formatAnswer(q, userAnswer)}</Text>
            )}
            {correctOpt || q.correct_answer ? (
              <Text style={styles.reviewLine}><Text style={styles.reviewLabel}>Correct: </Text>{correctOpt ?? q.correct_answer}</Text>
            ) : null}
            {q.feedback ? <Text style={styles.reviewFeedback}>{q.feedback}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function formatAnswer(q: Question, v: any): string {
  if (typeof v === 'number' && q.options) return q.options[v]?.text ?? String(v);
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (v && typeof v === 'object') {
    return Object.entries(v).map(([k, val]) => `${q.matching_items?.[Number(k)]?.prompt ?? k} → ${String(val)}`).join(', ');
  }
  return String(v);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#FDFBF6' },
  headerPlaceholder: { height: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, gap: 12, paddingBottom: 24 },
  examMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  metaChipText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  sectionTitle: { fontSize: 13, letterSpacing: 1, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', marginTop: 6 },
  partCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 14 },
  partNum: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAE5DE', alignItems: 'center', justifyContent: 'center' },
  partNumDone: { backgroundColor: '#3A7D5C' },
  partNumText: { fontSize: 14, fontWeight: '900', color: '#6B7280' },
  partTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22' },
  partMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  openBadge: { borderWidth: 1, borderColor: '#F0C4B0', backgroundColor: '#FFF0EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  openBadgeText: { fontSize: 11, fontWeight: '800', color: '#D96A3E' },
  doneBadge: { borderWidth: 1, borderColor: '#C8DDC8', backgroundColor: '#EAF4E8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  doneBadgeText: { fontSize: 11, fontWeight: '800', color: '#3A7D5C' },
  lockBadge: { borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  lockBadgeText: { fontSize: 11, fontWeight: '800', color: '#8A8A8A' },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1A1E22', borderRadius: 14, padding: 16, marginTop: 6 },
  doneCardTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  doneCardSub: { color: '#B8B8B8', fontSize: 11, marginTop: 2 },
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
  // review
  reviewBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EAF4E8', borderWidth: 1, borderColor: '#C8DDC8', borderRadius: 12, padding: 12 },
  reviewBannerText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#3A7D5C' },
  reviewPart: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 14, gap: 10 },
  reviewPartHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewQ: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10, gap: 4 },
  reviewQText: { fontSize: 13, fontWeight: '700', color: '#1A1E22', lineHeight: 17 },
  reviewLine: { fontSize: 12, color: '#1A1E22', lineHeight: 16 },
  reviewLabel: { fontWeight: '700', color: '#6B7280' },
  reviewFeedback: { fontSize: 12, color: '#3A7D5C', lineHeight: 16, fontStyle: 'italic' },
  // taking
  takeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  takeTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22' },
  takeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 3 },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#fff' },
  timerText: { fontSize: 11, fontWeight: '800', color: '#1A1E22' },
  saveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  saveDot: { width: 7, height: 7, borderRadius: 4 },
  saveText: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  flagBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 4, backgroundColor: '#F0F0F0' },
  progressFg: { height: 4, backgroundColor: '#D96A3E' },
  takeScroll: { flex: 1, backgroundColor: '#FDFBF6' },
  takeContent: { padding: 14, gap: 10, paddingBottom: 24 },
  qNav: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  qDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  qDotActive: { backgroundColor: '#1A1E22', borderColor: '#1A1E22' },
  qProgressText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  qCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 14 },
  qText: { fontSize: 15, fontWeight: '800', color: '#1A1E22', lineHeight: 21 },
  qPoints: { fontSize: 11, color: '#6B7280', marginTop: 4, textTransform: 'capitalize' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 12, backgroundColor: '#FFFEFC' },
  optSelected: { borderColor: '#1A1E22', backgroundColor: '#F5F3EF' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#CFCFCF', alignItems: 'center', justifyContent: 'center' },
  radioSel: { borderColor: '#1A1E22' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#1A1E22' },
  optText: { flex: 1, fontSize: 13, color: '#1A1E22' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 4, backgroundColor: '#FFFEFC' },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14, color: '#1A1E22' },
  matchPrompt: { fontSize: 13, fontWeight: '700', color: '#1A1E22' },
  takeNavRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  outlineText: { fontWeight: '700', fontSize: 13, color: '#1A1E22' },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D96A3E', borderRadius: 10, paddingVertical: 12 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  // modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22', textAlign: 'center' },
  modalSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 17 },
  modalPrimary: { backgroundColor: '#1A1E22', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  modalPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  modalOutline: { borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#fff' },
  successIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3A7D5C', alignItems: 'center', justifyContent: 'center' },
  xpBox: { alignItems: 'center', backgroundColor: '#FFFEFC', borderWidth: 1, borderColor: '#F0C4B0', borderRadius: 12, padding: 12, gap: 4 },
  xpTotal: { fontSize: 22, fontWeight: '900', color: '#D96A3E' },
  xpSub: { fontSize: 11, color: '#6B7280' },
});

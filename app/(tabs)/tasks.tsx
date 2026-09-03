import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage, webLink } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

type Tab = 'All' | 'To do' | 'Submitted';
export default function TasksScreen() {
  const [tab, setTab] = useState<Tab>('All');
  const [showSubmit, setShowSubmit] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitFor, setSubmitFor] = useState<any>(null);
  const [feedbackFor, setFeedbackFor] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r: any = await api.get('/mobile/assignments');
      const d = r.data ?? r;
      setAssignments(d.assignments ?? d ?? []);
    } catch (e) {
      setError(errorMessage(e));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openSubmit = (a: any) => {
    setSubmitFor(a);
    setShowSubmit(true);
  };

  // Real submissions are file uploads (the API requires a multipart `file`).
  // The mobile client doesn't pick/upload files yet, so it links to the web
  // app instead of faking a text-based submit.
  const openWebSubmit = () => {
    const a = submitFor;
    setShowSubmit(false);
    if (a) Linking.openURL(webLink(`/assignments/${a.id}`));
  };

  const markFeedbackSeen = async () => {
    const a = feedbackFor;
    if (!a) return;
    setBusy(true);
    try {
      await api.post(`/mobile/assignments/${a.id}/feedback-seen`);
      setAssignments((prev) =>
        (prev ?? []).map((x: any) => (x.id === a.id ? { ...x, submission: { ...(x.submission ?? {}), has_unseen_feedback: false } } : x))
      );
      setShowFeedback(false);
    } catch (e) {
      Alert.alert('Could not update feedback', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const filtered =
    assignments === null
      ? null
      : assignments.filter((a: any) => (tab === 'All' ? true : tab === 'To do' ? !a.submission?.submitted : !!a.submission?.submitted));
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assignments</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowGroup(true)} accessibilityLabel="Groups"><Ionicons name="people-outline" size={20} color="#1A1E22" /></TouchableOpacity>
          </View>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.filterWrap}>
            {(['All', 'To do', 'Submitted'] as Tab[]).map((t) => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.filterBtn, tab === t && styles.filterActive, t === 'Submitted' && { borderLeftWidth: 1, borderLeftColor: '#EAE5DE' }]}>
                <Text style={[styles.filterText, tab === t && styles.filterTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {loading ? <PageSkeleton count={3} /> : error ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 32 }}>
              <Ionicons name="cloud-offline-outline" size={32} color="#8A8A8A" />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{error}</Text>
              <TouchableOpacity style={[styles.assignBtn, { backgroundColor: '#1A1E22', paddingHorizontal: 24 }]} onPress={load}><Text style={styles.assignBtnText}>Try again</Text></TouchableOpacity>
            </View>
          ) : !filtered ? (
            <PageSkeleton count={3} />
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text style={{ fontWeight: '700' }}>No assignments in {tab}</Text></View>
          ) : (
            filtered.map((a: any) => (
              <View key={a.id} style={styles.assignCard}>
                <View style={styles.assignTop}>
                  <View style={[styles.assignIcon, { backgroundColor: a.submission?.submitted ? '#EAF4E8' : '#FFF0EB' }]}><Ionicons name={a.submission?.submitted ? 'checkmark-circle-outline' : 'document-text-outline'} size={24} color={a.submission?.submitted ? '#3A7D5C' : '#D96A3E'} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.assignTitle}>{a.title}</Text><Text style={styles.assignSub}>{a.due_date ?? 'No deadline'}</Text></View>
                  <View style={a.submission?.submitted ? styles.badgeToday : styles.badgeUpcoming}><Text style={a.submission?.submitted ? styles.badgeTodayText : styles.badgeUpcomingText}>{a.submission?.submitted ? 'Submitted' : 'To do'}</Text></View>
                </View>
                <TouchableOpacity style={[styles.assignBtn, { backgroundColor: '#D96A3E' }]} onPress={() => (a.submission?.has_unseen_feedback ? (setFeedbackFor(a), setShowFeedback(true)) : openSubmit(a))}><Text style={styles.assignBtnText}>{a.submission?.has_unseen_feedback ? 'View feedback' : 'Open'}</Text></TouchableOpacity>
              </View>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
        <Modal visible={showSubmit} transparent animationType="slide" onRequestClose={() => setShowSubmit(false)}><View style={styles.modalOverlay}><View style={styles.modalSheet}><View style={styles.handle} /><Text style={styles.modalTitle}>Submit: {submitFor?.title ?? 'assignment'}</Text><Text style={styles.groupNote}>Submissions are file uploads (PDF, DOCX, or image — up to 10 MB). File picking isn&apos;t available in the mobile app yet, so submissions open in the web app.</Text><View style={styles.modalRow}><TouchableOpacity onPress={() => setShowSubmit(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={openWebSubmit} style={styles.modalConfirm}><Text style={styles.modalConfirmText}>Open in web app</Text></TouchableOpacity></View></View></View></Modal>
        <Modal visible={showGroup} transparent animationType="fade" onRequestClose={() => setShowGroup(false)}><View style={styles.modalOverlay}><View style={styles.modalCard}><Text style={styles.modalTitle}>Group assignments</Text><Text style={styles.groupNote}>Group submissions are managed on the LUA V6 web app for now.</Text><TouchableOpacity onPress={() => Linking.openURL(webLink('/assignments'))} style={styles.modalConfirm}><Text style={styles.modalConfirmText}>Open in web app</Text></TouchableOpacity><TouchableOpacity onPress={() => setShowGroup(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Close</Text></TouchableOpacity></View></View></Modal>
        <Modal visible={showFeedback} transparent animationType="fade" onRequestClose={() => setShowFeedback(false)}><View style={styles.modalOverlay}><View style={styles.modalCard}><Text style={styles.modalTitle}>Feedback</Text><Text style={styles.groupNote}>{feedbackFor?.submission?.feedback ?? feedbackFor?.feedback ?? 'Your teacher\'s feedback will appear here. Mark it as seen to hide the badge.'}</Text><TouchableOpacity onPress={markFeedbackSeen} disabled={busy} style={[styles.modalConfirm, busy && { opacity: 0.7 }]}><Text style={styles.modalConfirmText}>{busy ? 'Updating...' : 'Mark as seen'}</Text></TouchableOpacity><TouchableOpacity onPress={() => setShowFeedback(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Close</Text></TouchableOpacity></View></View></Modal>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1E22' },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 14, paddingBottom: Platform.OS === 'web' ? 90 : 16, gap: 2 },
  filterWrap: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 4, marginBottom: 16 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  filterActive: { backgroundColor: '#D96A3E' },
  filterText: { fontWeight: '600', color: '#1A1E22', fontSize: 14 },
  filterTextActive: { color: '#fff' },
  sectionLabel: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  assignCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 16, gap: 14 },
  assignTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assignIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  assignTitle: { fontSize: 15, fontWeight: '800', color: '#1A1E22' },
  assignSub: { fontSize: 12, color: '#8A8A8A', marginTop: 2 },
  badgeOverdue: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#F0C4B0', backgroundColor: '#FFF0EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeOverdueText: { fontSize: 11, color: '#D96A3E', fontWeight: '700' },
  badgeToday: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EAF4E8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTodayText: { fontSize: 11, color: '#3A7D5C', fontWeight: '700' },
  badgeUpcoming: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8EFF6', borderWidth: 1, borderColor: '#D0DDEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeUpcomingText: { fontSize: 11, color: '#2F5B8A', fontWeight: '700' },
  assignBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  assignBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalSheet: { width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 } as any,
  groupNote: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 16 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#EAE5DE', alignSelf: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22', textAlign: 'center' },
  modalRow: { flexDirection: 'row', gap: 10, width: '100%' },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  modalCancelText: { fontWeight: '700', color: '#1A1E22', fontSize: 13 },
  modalConfirm: { flex: 1, backgroundColor: '#1A1E22', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

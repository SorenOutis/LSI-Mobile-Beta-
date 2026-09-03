import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

export default function ChatsScreen() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const r: any = await api.get('/mobile/chats');
      const d = r.data ?? r;
      setSessions(Array.isArray(d) ? d : d.data ?? []);
    } catch (e) {
      setError(errorMessage(e));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openSession = async (sess: any) => {
    setSelected(sess);
    setSendError(null);
    setMessages([]);
    try {
      const r: any = await api.get(`/mobile/chats/${sess.id ?? sess.public_id}/messages`);
      const d = r.data ?? r;
      setMessages(Array.isArray(d) ? d : d.data ?? []);
    } catch {
      setMessages([]);
    }
  };

  const send = async () => {
    const sess = selected;
    const content = input.trim();
    if (!sess || !content || sending) return;
    setSending(true);
    setSendError(null);
    try {
      // The backend persists both turns and answers with the reply text.
      const r: any = await api.post(`/mobile/chats/${sess.id ?? sess.public_id}/messages`, { message: content });
      const reply = typeof r?.response === 'string' ? r.response : content;
      setMessages((prev) => [...prev, { role: 'user', content }, { role: 'assistant', content: reply }]);
      setInput('');
    } catch (e) {
      setSendError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  // Keep the newest message in view.
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <PageSkeleton count={3} />
          ) : error ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 32 }}>
              <Ionicons name="cloud-offline-outline" size={32} color="#8A8A8A" />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={load}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
            </View>
          ) : (sessions ?? []).length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ fontWeight: '700' }}>No chats yet</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Conversations you start in the web app appear here.</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {(sessions ?? []).map((s) => (
                <TouchableOpacity key={s.id ?? s.public_id} style={[styles.chatRow, selected?.id === s.id && styles.activeRow]} onPress={() => openSession(s)}>
                  <View style={styles.chatIcon}><Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" /></View>
                  <View style={{ flex: 1 }}><Text style={styles.chatTitle}>{s.title ?? 'Chat'}</Text><Text style={styles.chatSub}>{s.last_message ?? ''}</Text></View>
                  <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selected && (
            <View style={styles.convoCard}>
              <View style={styles.convoHeader}><Text style={styles.convoTitle}>{selected.title ?? 'Chat'}</Text><TouchableOpacity onPress={() => setSelected(null)} accessibilityLabel="Close chat"><Ionicons name="close" size={18} color="#1A1E22" /></TouchableOpacity></View>
              <ScrollView ref={scrollRef} style={styles.messages} showsVerticalScrollIndicator={false}>
                {messages.length === 0 && <Text style={{ fontSize: 12, color: '#8A8A8A', textAlign: 'center' }}>No messages yet — say hello.</Text>}
                {messages.map((m, idx) => (
                  <View key={m.id ?? idx} style={m.role === 'user' ? styles.msgRightWrap : styles.msgLeftWrap}>
                    <View style={m.role === 'user' ? styles.bubbleRight : styles.bubbleLeft}>
                      <Text style={m.role === 'user' ? styles.bubbleRightText : styles.bubbleLeftText}>{m.content ?? m.message ?? ''}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              {sendError && <Text style={styles.sendError}>{sendError}</Text>}
              <View style={styles.inputRow}>
                <View style={styles.inputWrap}><TextInput value={input} onChangeText={(v) => { setInput(v); if (sendError) setSendError(null); }} placeholder="Ask anything..." placeholderTextColor="#9AA0A6" style={styles.input} onSubmitEditing={send} /></View>
                <TouchableOpacity onPress={send} disabled={sending || !input.trim()} style={[styles.sendBtn, (sending || !input.trim()) && { opacity: 0.5 }]}><Ionicons name="paper-plane" size={18} color="#fff" /></TouchableOpacity>
              </View>
            </View>
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
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 14, paddingBottom: Platform.OS === 'web' ? 90 : 16, gap: 12 },
  listCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 6 },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10 },
  activeRow: { backgroundColor: '#FFF6F0', borderWidth: 1, borderColor: '#F0C4B0' },
  chatIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D96A3E', alignItems: 'center', justifyContent: 'center' },
  chatTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22' },
  chatSub: { fontSize: 12, color: '#8A8A8A', marginTop: 2 },
  convoCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, overflow: 'hidden' },
  convoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#EAE5DE' },
  convoTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22' },
  messages: { backgroundColor: '#F9F7F4', padding: 14, gap: 12, minHeight: 120, maxHeight: 320 },
  msgRightWrap: { alignItems: 'flex-end' },
  bubbleRight: { backgroundColor: '#EAF4E8', borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '78%' },
  bubbleRightText: { fontSize: 13, color: '#1A1E22' },
  msgLeftWrap: { alignItems: 'flex-start' },
  bubbleLeft: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '78%' },
  bubbleLeftText: { fontSize: 13, color: '#1A1E22' },
  sendError: { fontSize: 11, color: '#EF4444', fontWeight: '600', paddingHorizontal: 14, paddingBottom: 6, backgroundColor: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#fff' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff' },
  input: { flex: 1, fontSize: 13, color: '#1A1E22', padding: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D96A3E', alignItems: 'center', justifyContent: 'center' },
  retryBtn: { backgroundColor: '#1A1E22', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

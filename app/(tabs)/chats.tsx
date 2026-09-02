// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

export default function ChatsScreen() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get('/chats').then(r => setSessions((r.data ?? r).data ?? (r.data ?? r) ?? [])).catch(() => setSessions([])).finally(() => setLoading(false));
  }, [token]);

  const openSession = async (s: any) => {
    setSelected(s);
    try {
      const r = await api.get(`/chats/${s.id ?? s.public_id}/messages`);
      setMessages((r.data ?? r).data ?? (r.data ?? r) ?? []);
    } catch { setMessages([]); }
  };

  const send = async () => {
    if (!selected || !input.trim()) return;
    try {
      const r = await api.post(`/chats/${selected.id ?? selected.public_id}/messages`, { content: input });
      setMessages([...messages, r.data]);
      setInput('');
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
          <TouchableOpacity style={styles.addBtn}><Ionicons name="add" size={22} color="#fff" /></TouchableOpacity>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? <PageSkeleton count={3} /> : sessions === null ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text>Login to see chats</Text></View>
          ) : sessions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text style={{ fontWeight: '700' }}>No chats yet</Text></View>
          ) : (
            <View style={styles.listCard}>
              {sessions.map((s: any) => (
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
              <View style={styles.convoHeader}><Text style={styles.convoTitle}>{selected.title ?? 'Chat'}</Text><TouchableOpacity onPress={() => setSelected(null)}><Ionicons name="close" size={18} color="#1A1E22" /></TouchableOpacity></View>
              <View style={styles.messages}>
                {messages.map((m: any, idx: number) => (
                  <View key={idx} style={m.role === 'user' ? styles.msgRightWrap : styles.msgLeftWrap}><View style={m.role === 'user' ? styles.bubbleRight : styles.bubbleLeft}><Text style={m.role === 'user' ? styles.bubbleRightText : styles.bubbleLeftText}>{m.content ?? m.message ?? ''}</Text></View></View>
                ))}
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputWrap}><TextInput value={input} onChangeText={setInput} placeholder="Ask anything..." placeholderTextColor="#9AA0A6" style={styles.input} /></View>
                <TouchableOpacity onPress={send} style={styles.sendBtn}><Ionicons name="paper-plane" size={18} color="#fff" /></TouchableOpacity>
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
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#D96A3E', alignItems: 'center', justifyContent: 'center' },
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
  messages: { backgroundColor: '#F9F7F4', padding: 14, gap: 12, minHeight: 120 },
  msgRightWrap: { alignItems: 'flex-end' },
  bubbleRight: { backgroundColor: '#EAF4E8', borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '78%' },
  bubbleRightText: { fontSize: 13, color: '#1A1E22' },
  msgLeftWrap: { alignItems: 'flex-start' },
  bubbleLeft: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '78%' },
  bubbleLeftText: { fontSize: 13, color: '#1A1E22' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#fff' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff' },
  input: { flex: 1, fontSize: 13, color: '#1A1E22', padding: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D96A3E', alignItems: 'center', justifyContent: 'center' },
});

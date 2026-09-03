import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

export default function NglScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [msgs, setMsgs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r: any = await api.get('/mobile/ngl');
      const d = r.data ?? r;
      setMsgs(Array.isArray(d) ? d : d.data ?? []);
    } catch {
      setMsgs([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const post = async () => {
    const content = newMsg.trim();
    if (!content) return;
    try {
      // The live backend queues the message for approval — it shows up in the
      // feed only once a teacher approves it, so don't pretend it's posted.
      await api.post('/mobile/ngl', { content });
      setNewMsg('');
      setShowModal(false);
      Alert.alert('Sent', 'Your message was sent for approval. It will appear in the feed once approved.');
    } catch (e) {
      Alert.alert('Could not post', errorMessage(e));
    }
  };

  const toggleLike = async (id: number) => {
    try {
      const r: any = await api.post(`/mobile/ngl/${id}/like`);
      const liked = r?.liked ?? true;
      setMsgs((prev) => (prev ? prev.map((m) => (m.id === id ? { ...m, likes_count: Math.max(0, (m.likes_count ?? m.likes ?? 0) + (liked ? 1 : -1)) } : m)) : prev));
    } catch (e) {
      Alert.alert('Could not like', errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Shoutouts</Text>
          <View style={styles.shieldPill}><Ionicons name="shield-checkmark" size={12} color="#10B981" /><Text style={styles.shieldText}>Anonymous</Text></View>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? <PageSkeleton count={3} /> : msgs === null ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text>Login to see shoutouts</Text></View>
          ) : msgs.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text style={{ fontWeight: '700' }}>No shoutouts yet</Text><Text style={{ color: '#6B7280', fontSize: 12 }}>Be the first to post.</Text></View>
          ) : (
            msgs.map((m: any) => (
              <View key={m.id} style={styles.card}>
                <View style={styles.cardTop}><View style={styles.avatar}><Ionicons name="person" size={16} color="#D96A3E" /></View><View><Text style={styles.anon}>Anonymous</Text><Text style={styles.date}>{new Date(m.created_at).toLocaleDateString()}</Text></View><TouchableOpacity onPress={() => toggleLike(m.id)} style={styles.heartBtn}><Ionicons name="heart-outline" size={16} color="#9AA0A6" /><Text style={styles.likeCount}>{m.likes_count ?? m.likes ?? 0}</Text></TouchableOpacity></View>
                <Text style={styles.msgText}>{m.content}</Text>
              </View>
            ))
          )}
          {showModal && (
            <View style={styles.modalOverlay}><View style={styles.modalCard}><Text style={styles.modalTitle}>Post Anonymously</Text><View style={styles.inputWrap}><TextInput value={newMsg} onChangeText={setNewMsg} placeholder="What's on your mind?" placeholderTextColor="#9AA0A6" multiline style={styles.modalInput} /></View><View style={styles.modalActions}><TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={post} style={styles.postBtn}><Text style={styles.postText}>Post</Text></TouchableOpacity></View></View></View>
          )}
        </ScrollView>
        {!showModal && <TouchableOpacity onPress={() => setShowModal(true)} style={styles.fab}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>}
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
  shieldPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#A7F3D0', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  shieldText: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  content: { padding: 14, gap: 14 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0C4B0' },
  anon: { fontSize: 12, fontWeight: '800', color: '#1A1E22' },
  date: { fontSize: 10, color: '#9AA0A6' },
  heartBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9F7F4', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20 },
  likeCount: { fontSize: 11, fontWeight: '800', color: '#EF4444' },
  msgText: { fontSize: 13, fontWeight: '600', color: '#1A1E22', lineHeight: 18, fontStyle: 'italic' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 10 },
  modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22', textAlign: 'center' },
  inputWrap: { borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, backgroundColor: '#FFFEFC', minHeight: 100, padding: 12 },
  modalInput: { flex: 1, fontSize: 13, color: '#1A1E22', textAlignVertical: 'top' as any },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  cancelText: { fontWeight: '700', color: '#6B7280', fontSize: 13 },
  postBtn: { flex: 1, backgroundColor: '#1A1E22', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  postText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  fab: { position: 'absolute', bottom: 20, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: '#D96A3E', alignItems: 'center', justifyContent: 'center' },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

export default function ProfileScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get<any>('/user').then((r) => setProfile(r.data ?? r)).catch(() => setProfile(null)).finally(() => setLoading(false));
  }, [token, user]);
  const p = profile ?? user;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.moreBtn} onPress={() => router.push('/settings' as any)} accessibilityLabel="Account settings"><Ionicons name="settings-outline" size={18} color="#1A1E22" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? <PageSkeleton count={3} /> : !p ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}><Text>Login to see profile</Text></View>
          ) : (
            <>
              <View style={styles.profileCard}>
                {p.avatar ? <Image source={{ uri: p.avatar }} style={styles.avatar} /> : <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAE5DE' }]}><Text style={{ fontSize: 24, fontWeight: '900', color: '#1A1E22' }}>{(p.name ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</Text></View>}
                <Text style={styles.name}>{p.name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`}</Text>
                <Text style={styles.handle}>{p.email}</Text>
                <Text style={styles.handle}>Level {p.level ?? 12} · {p.exp ?? 1240} XP</Text>
              </View>
              <Text style={styles.sectionTitle}>Info</Text>
              <View style={styles.infoRow}><Ionicons name="mail-outline" size={16} color="#6B7280" /><Text style={styles.infoText}>{p.email}</Text></View>
              <View style={styles.infoRow}><Ionicons name="person-outline" size={16} color="#6B7280" /><Text style={styles.infoText}>Public ID: {p.public_id ?? '—'}</Text></View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  moreBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, gap: 14 },
  profileCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EAE5DE' },
  name: { fontSize: 18, fontWeight: '900', color: '#1A1E22', marginTop: 4 },
  handle: { fontSize: 12, color: '#6B7280' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22', marginTop: 4 },
  infoRow: { flexDirection: 'row', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14, alignItems: 'center' },
  infoText: { fontSize: 13, color: '#1A1E22' },
});

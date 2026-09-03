import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';
import { initials } from '@/lib/format';

export default function PublicProfileScreen() {
  const { publicId } = useLocalSearchParams<{ publicId: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'achievements' | 'courses'>('activity');

  const load = useCallback(async () => {
    if (!publicId) return;
    setLoading(true);
    setError(null);
    try {
      const r: any = await api.get(`/mobile/u/${publicId}`);
      setData(r.data ?? r);
    } catch (e) {
      setData(null);
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async () => {
    if (!data?.profileUser) return;
    setFollowLoading(true);
    try {
      if (data.isFollowing) {
        await api.delete(`/mobile/u/${publicId}/follow`);
      } else {
        await api.post(`/mobile/u/${publicId}/follow`);
      }
      setData((prev: any) => ({ ...prev, isFollowing: !prev.isFollowing, stats: { ...prev.stats, followersCount: prev.isFollowing ? prev.stats.followersCount - 1 : prev.stats.followersCount + 1 } }));
    } catch (e) {
      Alert.alert('Could not update follow', errorMessage(e));
    } finally {
      setFollowLoading(false);
    }
  };

  const sendKudo = async (type: string) => {
    try {
      await api.post(`/mobile/u/${publicId}/kudos`, { type });
      const r: any = await api.get(`/mobile/u/${publicId}`);
      setData(r.data ?? r);
    } catch (e) {
      Alert.alert('Could not send kudos', errorMessage(e));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}><PageSkeleton count={4} /></View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}>
          <View style={styles.header}><TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity><Text style={styles.headerTitle}>Profile</Text><View style={{ width: 36 }} /></View>
          <View style={{ alignItems: 'center', gap: 8, padding: 32 }}>
            <Text style={{ textAlign: 'center', lineHeight: 18 }}>{error ? `Couldn't load this profile.\n${error}` : 'Profile not found or private.'}</Text>
            {!!error && <TouchableOpacity style={[styles.kudoBtn, { backgroundColor: '#1A1E22', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }]} onPress={load}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Try again</Text></TouchableOpacity>}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const p = data.profileUser;
  const stats = data.stats;
  const isMe = p.isCurrentUser || (me as any)?.public_id === publicId;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>@{p.name?.toLowerCase().replace(/\s+/g, '') ?? 'user'}</Text>
          <TouchableOpacity style={styles.moreBtn}><Ionicons name="ellipsis-horizontal" size={18} color="#1A1E22" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cover */}
          <View style={styles.coverWrap}>
            {p.cover_photo ? <Image source={{ uri: p.cover_photo }} style={styles.cover} /> : <View style={styles.coverPlaceholder} />}
            <View style={styles.avatarRing}>
              {p.avatar ? (
                <Image source={{ uri: p.avatar }} style={styles.avatarLarge} />
              ) : (
                <View style={[styles.avatarLarge, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#D96A3E' }]}>
                  <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{initials(p.name)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{p.name}</Text>
            {isMe && <View style={styles.youBadge}><Text style={styles.youText}>You</Text></View>}
          </View>
          <Text style={styles.handle}>@{p.name?.toLowerCase().replace(/\s+/g, '')}</Text>
          {p.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}
          <View style={styles.metaRow}><Text style={styles.metaText}>Joined {p.joinedAt ? new Date(p.joinedAt).toLocaleDateString() : ''}</Text><Text style={styles.metaText}>·</Text><Text style={styles.metaText}>🔥 {p.streak ?? 0} streak</Text></View>

          {/* Counts - clickable like web */}
          <View style={styles.countRow}>
            <TouchableOpacity style={styles.countBtn}><Text style={styles.countNum}>{stats.followersCount ?? 0}</Text><Text style={styles.countLabel}>Followers</Text></TouchableOpacity>
            <TouchableOpacity style={styles.countBtn}><Text style={styles.countNum}>{stats.followingCount ?? 0}</Text><Text style={styles.countLabel}>Following</Text></TouchableOpacity>
            <TouchableOpacity style={styles.countBtn}><Text style={styles.countNum}>{stats.badgesCount ?? 0}</Text><Text style={styles.countLabel}>Badges</Text></TouchableOpacity>
          </View>

          {/* Actions - follow/kudos like web */}
          {!isMe && data.canInteract !== false && (
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={toggleFollow} disabled={followLoading} style={[styles.primaryBtn, data.isFollowing && { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE' }]}>
                <Ionicons name={data.isFollowing ? 'checkmark' : 'person-add-outline'} size={16} color={data.isFollowing ? '#1A1E22' : '#fff'} />
                <Text style={[styles.primaryText, data.isFollowing && { color: '#1A1E22' }]}>{followLoading ? '...' : data.isFollowing ? 'Following' : 'Follow'}</Text>
              </TouchableOpacity>
              <View style={styles.kudoRow}>
                {[
                  { type: 'great-work', icon: 'star' as const, label: 'Great work' },
                  { type: 'on-fire', icon: 'flame' as const, label: 'On fire' },
                  { type: 'keep-going', icon: 'heart' as const, label: 'Keep going' },
                ].map(k => (
                  <TouchableOpacity key={k.type} onPress={() => sendKudo(k.type)} style={[styles.kudoBtn, data.viewerKudo === k.type && { backgroundColor: '#FFF0EB', borderColor: '#F0C4B0' }]}>
                    <Ionicons name={k.icon as any} size={14} color="#D96A3E" />
                    <Text style={styles.kudoText}>{k.label}</Text>
                    <Text style={styles.kudoCount}>{data.kudos?.[k.type] ?? 0}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Tabs like web */}
          <View style={styles.tabRow}>
            {(['activity', 'achievements', 'courses'] as const).map(t => (
              <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'activity' && (
            <View style={{ gap: 10 }}>
              {(data.history ?? []).slice(0, 10).map((h: any) => (
                <View key={h.id ?? h.createdAt} style={styles.historyRow}>
                  <View style={styles.historyIcon}><Ionicons name="flash" size={14} color="#D96A3E" /></View>
                  <View style={{ flex: 1 }}><Text style={styles.historyTitle}>{h.reason}</Text><Text style={styles.historyDesc}>{h.description ?? ''}</Text></View>
                  <Text style={styles.historyAmt}>+{h.amount ?? h.xp ?? 0} XP</Text>
                </View>
              ))}
              {(!data.history || data.history.length === 0) && <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>No activity yet</Text>}
            </View>
          )}
          {activeTab === 'achievements' && (
            <View style={styles.badgeGrid}>
              {(data.badges ?? []).map((b: any) => (
                <View key={b.id} style={[styles.badge, !b.earned && { opacity: 0.6 }]}>
                  <View style={styles.badgeIcon}><Ionicons name="medal" size={20} color={b.earned ? '#D96A3E' : '#9AA0A6'} /></View>
                  <Text style={styles.badgeName}>{b.name}</Text>
                  {!b.earned && <View style={styles.lockOverlay}><Ionicons name="lock-closed" size={14} color="#fff" /></View>}
                </View>
              ))}
            </View>
          )}
          {activeTab === 'courses' && (
            <View style={{ gap: 10 }}>
              {(data.courses ?? []).map((c: any) => (
                <View key={c.id} style={styles.courseRow}>
                  <Text style={styles.courseName}>{c.name}</Text>
                  <View style={styles.progressBg}><View style={[styles.progressFg, { width: `${c.progress ?? 0}%` }]} /></View>
                  <Text style={styles.courseMeta}>{c.completedLessons ?? 0}/{c.totalLessons ?? 0} lessons</Text>
                </View>
              ))}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  moreBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  coverWrap: { height: 100, borderRadius: 16, overflow: 'hidden', backgroundColor: '#EAE5DE', alignItems: 'center', justifyContent: 'flex-end' },
  cover: { width: '100%', height: 100 },
  coverPlaceholder: { width: '100%', height: 100, backgroundColor: '#F0F0F0' },
  avatarRing: { position: 'absolute', bottom: -20, width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarLarge: { width: 74, height: 74, borderRadius: 37 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '900', color: '#1A1E22' },
  youBadge: { backgroundColor: '#1A1E22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  youText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  handle: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  bio: { fontSize: 13, color: '#1A1E22', textAlign: 'center', lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  metaText: { fontSize: 11, color: '#6B7280' },
  countRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 12 },
  countBtn: { alignItems: 'center', gap: 2 },
  countNum: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  countLabel: { fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 },
  actionRow: { gap: 10 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1A1E22', borderRadius: 10, paddingVertical: 12 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  kudoRow: { flexDirection: 'row', gap: 8 },
  kudoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingVertical: 8, backgroundColor: '#fff' },
  kudoText: { fontSize: 11, fontWeight: '700', color: '#1A1E22' },
  kudoCount: { fontSize: 11, fontWeight: '800', color: '#D96A3E' },
  tabRow: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#1A1E22' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 12 },
  historyIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center' },
  historyTitle: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  historyDesc: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  historyAmt: { fontSize: 12, fontWeight: '800', color: '#3A7D5C' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '47%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14, alignItems: 'center', gap: 8 },
  badgeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 11, fontWeight: '700', color: '#1A1E22', textAlign: 'center' },
  lockOverlay: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  courseRow: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14, gap: 8 },
  courseName: { fontSize: 13, fontWeight: '700', color: '#1A1E22' },
  progressBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3 },
  progressFg: { height: 6, backgroundColor: '#3A7D5C', borderRadius: 3 },
  courseMeta: { fontSize: 11, color: '#6B7280' },
});

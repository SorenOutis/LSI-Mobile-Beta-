import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';
import { initials, localDateKey, parseDate } from '@/lib/format';

export default function HomeScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [showDailyClaim, setShowDailyClaim] = useState(false);
  const [showXpHistory, setShowXpHistory] = useState(false);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [annDetail, setAnnDetail] = useState<any>(null);
  const [dismissedAnn, setDismissedAnn] = useState<Set<number>>(new Set());
  const [xpClaimed, setXpClaimed] = useState(false);
  const [dash, setDash] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [xpHistory, setXpHistory] = useState<any[]>([]);

  const fetchDashboard = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const r: any = await api.get('/mobile/dashboard');
      const d = r.data ?? r;
      setDash(d);
      if (d.xpHistory) setXpHistory(d.xpHistory);
    } catch {
      // Network-level failures surface via the connection banner in (tabs)/_layout.
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch on focus + poll every 30s like web Dashboard.vue:75 POLL_INTERVAL_MS 30000.
  // useFocusEffect pauses polling when the tab loses focus (battery/data).
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      fetchDashboard();
      const id = setInterval(fetchDashboard, 30000);
      return () => clearInterval(id);
    }, [fetchDashboard, token])
  );

  // Greeting logic like Dashboard.vue:211 personalizedGreeting
  const greetingPools: Record<string, string[]> = {
    morning: ['Good morning', 'Hello! What’s cooking', 'Morning superstar', 'Rise and grind'],
    afternoon: ['Good afternoon', 'Midday momentum', 'Afternoon grind'],
    evening: ['Good evening', 'Evening check-in', 'Finishing strong'],
    night: ['Late night grind', 'Burning the midnight oil', 'Night owl mode'],
    streak: ['On fire', 'Unstoppable', 'Streak mode', 'On a roll'],
    champion: ['Legend in the making', 'Elite status', 'Top-tier form'],
    overdue: ['Let’s catch up', 'Back in the saddle', 'We got this'],
    dueToday: ['Let’s make it count', 'Game time', 'Showtime'],
  };
  const daySeed = Math.floor(Date.now() / 86400000) % 4;
  const pick = (pool: string[]) => pool[daySeed % pool.length] ?? pool[0];

  const todaySummary = useMemo(() => {
    const assignments: any[] = dash?.assignments ?? [];
    const upcomingExams: any[] = dash?.upcomingExams ?? [];
    const dueItems: any[] = [];
    for (const a of assignments) {
      if (!a.dueAtIso) continue;
      const d = parseDate(a.dueAtIso);
      if (!d) continue;
      dueItems.push({ title: a.title, dueAt: d, isCompleted: a.submitted, isOverdue: a.isOverdue });
    }
    for (const e of upcomingExams) {
      if (e.status !== 'published') continue;
      const iso = e.starts_at_iso || e.exam_date_iso;
      if (!iso) continue;
      const d = parseDate(iso);
      if (!d) continue;
      dueItems.push({ title: e.title, dueAt: d, isCompleted: e.is_completed, isOverdue: d.getTime() < Date.now() && !e.is_completed });
    }
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const endOfDay = start.getTime() + 86400000;
    const in24h = Date.now() + 86400000;
    let dueToday = 0, overdue = 0, upcoming24h = 0;
    for (const it of dueItems) {
      if (it.isCompleted) continue;
      const t = it.dueAt.getTime();
      if (t < Date.now()) overdue++;
      if (t >= start.getTime() && t < endOfDay) dueToday++;
      if (t < in24h && t >= Date.now()) upcoming24h++;
    }
    return { dueToday, overdue, upcoming24h, dueItems };
  }, [dash]);

  const nextItem = useMemo(() => {
    const items = todaySummary.dueItems.filter((i: any) => !i.isCompleted).sort((a: any, b: any) => (a.isOverdue !== b.isOverdue ? (a.isOverdue ? -1 : 1) : a.dueAt - b.dueAt));
    return items[0] ?? null;
  }, [todaySummary]);

  const hour = new Date().getHours();
  const streak = dash?.userStats?.streak ?? 0;
  let greeting = 'Good morning';
  if (todaySummary.overdue > 0) greeting = pick(greetingPools.overdue);
  else if (streak >= 7) greeting = pick(greetingPools.champion);
  else if (streak >= 3) greeting = pick(greetingPools.streak);
  else if (todaySummary.dueToday > 0) greeting = pick(greetingPools.dueToday);
  else if (hour >= 0 && hour < 7) greeting = pick(hour < 4 ? greetingPools.night : greetingPools.morning);
  else if (hour < 12) greeting = pick(greetingPools.morning);
  else if (hour < 17) greeting = pick(greetingPools.afternoon);
  else if (hour < 21) greeting = pick(greetingPools.evening);
  else greeting = pick(greetingPools.night);

  const smarterStatus = useMemo(() => {
    const s = dash?.userStats;
    if (!s) return 'All caught up. Nice work!';
    const xpRem = s.maxXPForLevel - s.currentXP;
    if (todaySummary.overdue > 0) return `You have ${todaySummary.overdue} task${todaySummary.overdue === 1 ? '' : 's'} to catch up on.`;
    if (xpRem < 200) return `Almost there — ${xpRem} XP to Level ${s.level + 1}.`;
    if (streak >= 3) return `${streak}-day streak — keep it going!`;
    if (todaySummary.dueToday > 0) return `${todaySummary.dueToday} item${todaySummary.dueToday === 1 ? '' : 's'} due today.`;
    return 'All caught up. Nice work!';
  }, [dash, todaySummary, streak]);

  const userStats = dash?.userStats ?? { level: 1, totalXP: 0, currentXP: 0, maxXPForLevel: 1500, streak: 1, longestStreak: 1, points: 0 };
  const level = userStats.level ?? 1;
  const currentXP = userStats.currentXP ?? 0;
  const maxXP = userStats.maxXPForLevel ?? 1500;
  const progressPct = Math.min(100, (currentXP / maxXP) * 100);
  const loginDates: string[] = dash?.loginDates ?? [];
  const announcements = (dash?.announcements ?? []).filter((a: any) => !dismissedAnn.has(a.id));
  const claimXp = dash?.claimXp ?? { canClaim: true, amount: 50, nextClaimAt: null };
  const sectionLeaderboards = dash?.sectionLeaderboards ?? [];
  const primaryBoard = sectionLeaderboards[0];
  const activeSeason = dash?.activeSeason;
  const seasonProgress = (() => {
    if (!activeSeason?.startDate || !activeSeason?.endDate) return null;
    const start = new Date(activeSeason.startDate).getTime();
    const end = new Date(activeSeason.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
    const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
    return { pct, daysLeft };
  })();

  const handleClaim = async () => {
    try {
      await api.post('/mobile/claim-xp');
      setXpClaimed(true);
      setShowDailyClaim(false);
      fetchDashboard();
    } catch (e) {
      Alert.alert('Could not claim XP', errorMessage(e));
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      await api.post('/mobile/sections/join-by-code', { code: joinCode.trim() });
      setShowJoin(false);
      setJoinCode('');
      fetchDashboard();
    } catch (e) {
      Alert.alert('Could not join section', errorMessage(e));
    }
  };

  if (loading && !dash) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.webWrap}><View style={styles.headerPlaceholder} /><PageSkeleton count={5} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header - avatar clickable to profile like web DashboardHero */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.avatarWrap} onPress={() => ((user as any)?.public_id ? router.push(`/u/${(user as any).public_id}` as any) : router.push('/profile' as any))}>
                {(user as any)?.avatar ? (
                  <Image source={{ uri: (user as any).avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarInitials]}><Text style={styles.avatarInitialsText}>{initials(user?.name ?? user?.first_name)}</Text></View>
                )}
                <View style={styles.lvlBadge}><Text style={styles.lvlText}>Lvl {level}</Text></View>
              </TouchableOpacity>
              <View style={styles.greetingWrap}>
                <Text style={styles.greeting} numberOfLines={1}>{greeting}, {user?.name?.split(' ')[0] ?? 'learner'}</Text>
                <View style={styles.streakRow}><Text style={styles.flame}>🔥</Text><Text style={styles.streakText} numberOfLines={1}>{smarterStatus}</Text></View>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoin(true)}><Text style={styles.joinText}>Join</Text></TouchableOpacity>
              <TouchableOpacity style={styles.refreshBtn} onPress={fetchDashboard} accessibilityLabel="Refresh"><Ionicons name="refresh" size={18} color="#1A1E22" /></TouchableOpacity>
              <TouchableOpacity style={styles.refreshBtn} onPress={() => router.push('/more' as any)} accessibilityLabel="Menu"><Ionicons name="menu" size={18} color="#1A1E22" /></TouchableOpacity>
            </View>
          </View>

          {/* Announcements - real */}
          {announcements.map((a: any) => (
            <View key={a.id} style={styles.announcement}>
              <View style={styles.annLeft}>
                <View style={styles.annIcon}><Ionicons name="megaphone" size={20} color="#fff" /></View>
                <View style={styles.annTextWrap}>
                  <View style={styles.annTopRow}><Text style={styles.annTitle}>Announcement</Text><View style={styles.newBadge}><Text style={styles.newText}>New</Text></View></View>
                  <Text style={styles.annMain} numberOfLines={1}>{a.title}</Text>
                </View>
              </View>
              <View style={styles.annRight}>
                <TouchableOpacity style={styles.detailsBtn} onPress={() => setAnnDetail(a)}><Text style={styles.detailsText}>Details</Text></TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setDismissedAnn(prev => new Set(prev).add(a.id))}><Ionicons name="close" size={16} color="#1A1E22" /></TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Today at a glance - real counts */}
          <View style={styles.card}>
            <View style={styles.cardHeader}><Ionicons name="eye-outline" size={18} color="#1A1E22" /><Text style={styles.cardTitle}>Today at a glance</Text></View>
            <View style={styles.glanceRow}>
              <View style={styles.glanceItem}><View style={[styles.glanceIcon, { backgroundColor: '#EAF4E8' }]}><Ionicons name="clipboard-outline" size={18} color="#3A7D5C" /></View><Text style={styles.glanceLabel}>Due today</Text><Text style={[styles.glanceVal, { color: '#3A7D5C' }]}>{todaySummary.dueToday}</Text></View>
              <View style={styles.glanceItem}><View style={[styles.glanceIcon, { backgroundColor: '#FBE9E2' }]}><Ionicons name="alert-circle-outline" size={18} color="#D96A3E" /></View><Text style={styles.glanceLabel}>Overdue</Text><Text style={[styles.glanceVal, { color: '#D96A3E' }]}>{todaySummary.overdue}</Text></View>
              <View style={styles.glanceItem}><View style={[styles.glanceIcon, { backgroundColor: '#F0F0F0' }]}><Ionicons name="time-outline" size={18} color="#1A1E22" /></View><Text style={styles.glanceLabel}>Next 24h</Text><Text style={styles.glanceVal}>{todaySummary.upcoming24h}</Text></View>
            </View>
          </View>

          {/* Next assignment - real nextItem */}
          {nextItem ? (
            <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.navigate('/(tabs)/tasks')}>
              <View style={styles.nextRow}>
                <View style={styles.bookIcon}><Ionicons name="book" size={20} color="#fff" /></View>
                <View style={styles.nextText}>
                  <Text style={styles.nextLabel}>Next assignment</Text>
                  <Text style={styles.nextTitle} numberOfLines={1}>{nextItem.title}</Text>
                </View>
                <View style={styles.timePill}><Ionicons name="time-outline" size={14} color="#1A1E22" /><Text style={styles.timeText}>{Math.ceil((nextItem.dueAt.getTime() - Date.now()) / 3600000)}h</Text><Ionicons name="chevron-forward" size={14} color="#1A1E22" /></View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}><Text style={styles.cardTitle}>All caught up!</Text><Text style={{ fontSize: 12, color: '#6B7280' }}>No upcoming assignments or exams.</Text></View>
          )}

          {/* Daily XP + Streak - real */}
          <View style={styles.twoCol}>
            <View style={[styles.card, styles.halfCard]}>
              <View style={styles.xpHeader}>
                <View style={styles.flameCircle}><Ionicons name="flame" size={20} color="#fff" /></View>
                <View style={styles.xpTextWrap}>
                  <Text style={styles.xpTitle}>Daily XP</Text>
                  <TouchableOpacity style={[styles.claimBtn, (xpClaimed || !claimXp.canClaim) && { backgroundColor: '#9AA0A6' }]} onPress={() => claimXp.canClaim && !xpClaimed && setShowDailyClaim(true)}>
                    <Text style={styles.claimText}>{xpClaimed || !claimXp.canClaim ? 'Claimed ✓' : `Claim +${claimXp.amount} XP`}</Text>
                  </TouchableOpacity>
                  <View style={styles.smallStreak}><Text style={{ fontSize: 11 }}>🔥</Text><Text style={styles.smallStreakText}>{streak} day streak</Text></View>
                </View>
              </View>
            </View>
            <TouchableOpacity style={[styles.card, styles.halfCard, styles.streakCard]} onPress={() => setShowStreakInfo(true)}>
              <View style={styles.streakCircle}><Text style={styles.streakNum}>{streak}</Text></View>
              <View><Text style={styles.streakLabel}>Streak</Text><Text style={styles.streakDays}>{streak} days</Text></View>
            </TouchableOpacity>
          </View>

          {/* Level + Season progress - real */}
          <TouchableOpacity style={styles.card} onPress={() => setShowXpHistory(true)}>
            <View style={styles.levelRow}>
              <View style={styles.levelLeft}>
                <View style={styles.levelBadge}><Text style={styles.levelNum}>{level}</Text></View>
                <View style={styles.levelText}>
                  <Text style={styles.levelTitle}>Level {level}</Text>
                  <Text style={styles.levelSub}>{currentXP} / {maxXP} XP</Text>
                  <View style={styles.progressBg}><View style={[styles.progressFg, { width: `${progressPct}%` }]} /></View>
                </View>
              </View>
              <View style={styles.seasonBox}>
                <View style={styles.trophyBox}><Ionicons name="trophy" size={16} color="#fff" /></View>
                <View>
                  <Text style={styles.seasonTitle}>Season progress</Text>
                  <Text style={styles.seasonPct}>{seasonProgress ? `${Math.round(seasonProgress.pct)}%` : '—'}</Text>
                  <Text style={styles.seasonDays}>{seasonProgress ? `${seasonProgress.daysLeft} days left` : activeSeason?.name ?? 'No season'}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Leaderboard - real */}
          <TouchableOpacity style={styles.card} onPress={() => router.push('/leaderboard' as any)}>
            <View style={styles.leaderRow}>
              <View style={styles.leaderIcon}><Ionicons name="people" size={18} color="#3A7D5C" /></View>
              <View style={{ flex: 1 }}><Text style={styles.leaderTitle}>Leaderboard</Text><Text style={styles.leaderSub}>{primaryBoard ? `${primaryBoard.sectionName} · ${primaryBoard.totalPlayers} students` : 'No leaderboard yet'}</Text></View>
              <Text style={styles.leaderRank}>#{primaryBoard?.userRank ?? '--'}</Text><Ionicons name="chevron-forward" size={16} color="#1A1E22" />
            </View>
          </TouchableOpacity>

          {/* Activity heatmap - real loginDates */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity</Text>
            <View style={styles.activityHeader}><Text style={styles.activityWeek}>4 weeks ago</Text><Text style={styles.activityWeek}>3 weeks ago</Text><Text style={styles.activityWeek}>2 weeks ago</Text><Text style={styles.activityWeek}>This week</Text></View>
            <View style={styles.heatmap}>
              <View style={styles.heatmapLabels}><Text style={styles.dayLabel}>Mon</Text><Text style={styles.dayLabel}>Wed</Text><Text style={styles.dayLabel}>Fri</Text><Text style={styles.dayLabel}>Sun</Text></View>
              <View style={styles.grid}>
                {Array.from({ length: 4 }).map((_, row) => (
                  <View key={row} style={styles.gridRow}>
                    {Array.from({ length: 18 }).map((_, col) => {
                      const daysAgo = (17 - col) * 7 + (3 - row) * 1;
                      const d = new Date(); d.setDate(d.getDate() - daysAgo);
                      const key = localDateKey(d);
                      const active = loginDates.includes(key);
                      const colors = active ? ['#3A7D5C', '#2F6B4F', '#1E4A32'] : ['#F0F0F0', '#F0F0F0', '#F0F0F0'];
                      const c = active ? (col > 14 ? colors[0] : col > 10 ? colors[1] : colors[2]) : colors[0];
                      return <View key={col} style={[styles.cell, { backgroundColor: c }]} />;
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Daily Claim modal - real POST */}
        <Modal visible={showDailyClaim} transparent animationType="fade" onRequestClose={() => setShowDailyClaim(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}><Text style={{ fontSize: 28 }}>🎉</Text></View>
              <Text style={styles.modalTitle}>Daily XP Available!</Text>
              <Text style={styles.modalSub}>Claim +{claimXp.amount} XP for your {streak}-day streak.</Text>
              <View style={styles.xpPreview}><Text style={styles.xpPreviewNum}>+{claimXp.amount} XP</Text><Text style={styles.xpPreviewLabel}>Streak bonus included</Text></View>
              <TouchableOpacity style={styles.modalPrimary} onPress={handleClaim}><Text style={styles.modalPrimaryText}>Claim now</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDailyClaim(false)}><Text style={styles.modalCancelText}>Maybe later</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* XP History - real */}
        <Modal visible={showXpHistory} transparent animationType="slide" onRequestClose={() => setShowXpHistory(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.sheetCard}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>XP History</Text><TouchableOpacity onPress={() => setShowXpHistory(false)} style={styles.sheetClose}><Ionicons name="close" size={18} color="#1A1E22" /></TouchableOpacity></View>
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {xpHistory.length === 0 ? <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>No history yet</Text> : xpHistory.slice(0, 30).map((h: any) => (
                  <View key={h.id} style={styles.historyRow}>
                    <View style={styles.historyIcon}><Ionicons name="flash" size={14} color="#D96A3E" /></View>
                    <View style={{ flex: 1 }}><Text style={styles.historyTitle}>{h.reason}</Text><Text style={styles.historyDesc}>{h.description ?? ''} · {parseDate(h.createdAt)?.toLocaleDateString() ?? ''}</Text></View>
                    <Text style={styles.historyAmt}>+{h.amount} XP</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Streak info */}
        <Modal visible={showStreakInfo} transparent animationType="fade" onRequestClose={() => setShowStreakInfo(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.streakBigCircle}><Text style={styles.streakBigNum}>{streak}</Text></View>
              <Text style={styles.modalTitle}>{streak} day streak!</Text>
              <Text style={styles.modalSub}>Longest: {userStats.longestStreak ?? streak} days. Log in daily to keep it alive.</Text>
              <TouchableOpacity style={styles.modalPrimary} onPress={() => setShowStreakInfo(false)}><Text style={styles.modalPrimaryText}>Keep going!</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Join section */}
        <Modal visible={showJoin} transparent animationType="fade" onRequestClose={() => setShowJoin(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Join a section</Text>
              <Text style={styles.modalSub}>Enter code from your teacher.</Text>
              <View style={styles.inputWrap}><TextInput value={joinCode} onChangeText={setJoinCode} placeholder="Enter code (e.g. 10A-2025)" placeholderTextColor="#9AA0A6" style={styles.input} autoCapitalize="characters" /></View>
              <TouchableOpacity style={styles.modalPrimary} onPress={handleJoin}><Text style={styles.modalPrimaryText}>Join by code</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowJoin(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Announcement details */}
        <Modal visible={annDetail !== null} transparent animationType="fade" onRequestClose={() => setAnnDetail(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Announcement</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A1E22', marginTop: 6 }}>{annDetail?.title}</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, lineHeight: 18 }}>
                {annDetail?.content ?? annDetail?.body ?? annDetail?.message ?? annDetail?.text ?? 'No additional details.'}
              </Text>
              <TouchableOpacity style={styles.modalPrimary} onPress={() => setAnnDetail(null)}><Text style={styles.modalPrimaryText}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  headerPlaceholder: { height: 40 },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: Platform.OS === 'web' ? 90 : 24, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EAE5DE' },
  avatarInitials: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#D96A3E' },
  avatarInitialsText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  lvlBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#1A1E22', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  lvlText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  greetingWrap: { flex: 1, minWidth: 0 },
  greeting: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  flame: { fontSize: 11 },
  streakText: { fontSize: 11, color: '#3A7D5C', fontWeight: '600', flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  joinBtn: { backgroundColor: '#1A1E22', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  announcement: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 12, gap: 8 },
  annLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  annIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D96A3E', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  annTextWrap: { flex: 1, minWidth: 0 },
  annTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  annTitle: { fontSize: 11, color: '#D96A3E', fontWeight: '700' },
  newBadge: { borderWidth: 1, borderColor: '#F0C4B0', backgroundColor: '#FFF0EB', paddingHorizontal: 7, paddingVertical: 1, borderRadius: 10 },
  newText: { fontSize: 9, color: '#D96A3E', fontWeight: '700' },
  annMain: { fontSize: 13, fontWeight: '800', color: '#1A1E22', marginTop: 2 },
  annRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  detailsBtn: { backgroundColor: '#1A1E22', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9 },
  detailsText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#1A1E22' },
  glanceRow: { flexDirection: 'row', gap: 8 },
  glanceItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 6, backgroundColor: '#FFFEFC' },
  glanceIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  glanceLabel: { fontSize: 10, color: '#6B6B6B', textAlign: 'center' },
  glanceVal: { fontSize: 17, fontWeight: '800', color: '#1A1E22', textAlign: 'center' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1A1E22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nextText: { flex: 1, minWidth: 0 },
  nextLabel: { fontSize: 11, color: '#6B7280' },
  nextTitle: { fontSize: 13, fontWeight: '800', color: '#1A1E22', marginTop: 1 },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#FFFBF6', flexShrink: 0 },
  timeText: { fontSize: 11, color: '#1A1E22', fontWeight: '600' },
  twoCol: { flexDirection: 'row', gap: 10 },
  halfCard: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  streakCard: { justifyContent: 'center', gap: 12 },
  xpHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  flameCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1A1E22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  xpTextWrap: { flex: 1, minWidth: 0 },
  xpTitle: { fontSize: 12, fontWeight: '800', color: '#1A1E22' },
  claimBtn: { backgroundColor: '#1A1E22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
  claimText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  smallStreak: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  smallStreakText: { fontSize: 11, color: '#3A7D5C', fontWeight: '600' },
  streakCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: '#3A7D5C', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  streakNum: { fontSize: 20, fontWeight: '800', color: '#3A7D5C' },
  streakLabel: { fontSize: 12, fontWeight: '800', color: '#1A1E22' },
  streakDays: { fontSize: 11, color: '#3A7D5C', marginTop: 1 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  levelLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  levelBadge: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#3A7D5C', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#A8C5B8', flexShrink: 0 },
  levelNum: { color: '#fff', fontSize: 16, fontWeight: '900' },
  levelText: { flex: 1, minWidth: 0 },
  levelTitle: { fontSize: 13, fontWeight: '800', color: '#1A1E22' },
  levelSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  progressBg: { height: 6, backgroundColor: '#EAE5DE', borderRadius: 3, marginTop: 6, width: '100%' },
  progressFg: { height: 6, backgroundColor: '#3A7D5C', borderRadius: 3 },
  seasonBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 1, borderLeftColor: '#EAE5DE', paddingLeft: 12, flexShrink: 0 },
  trophyBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#3A7D5C', alignItems: 'center', justifyContent: 'center' },
  seasonTitle: { fontSize: 9, color: '#1A1E22', fontWeight: '700' },
  seasonPct: { fontSize: 12, color: '#3A7D5C', fontWeight: '800' },
  seasonDays: { fontSize: 9, color: '#6B7280' },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leaderIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EAF4E8', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  leaderTitle: { fontSize: 13, fontWeight: '800', color: '#1A1E22' },
  leaderSub: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  leaderRank: { fontSize: 15, fontWeight: '800', color: '#3A7D5C' },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 6, paddingLeft: 32 },
  activityWeek: { fontSize: 8, color: '#8A8A8A' },
  heatmap: { flexDirection: 'row', gap: 8 },
  heatmapLabels: { justifyContent: 'space-around', paddingVertical: 4 },
  dayLabel: { fontSize: 8, color: '#6B6B6B', height: 14 },
  grid: { flex: 1, gap: 3 },
  gridRow: { flexDirection: 'row', gap: 3 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 2, minHeight: 9 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12, alignItems: 'center' },
  modalIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#1A1E22', textAlign: 'center' },
  modalSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 16 },
  xpPreview: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12, padding: 12, width: '100%', alignItems: 'center', gap: 4 },
  xpPreviewNum: { fontSize: 20, fontWeight: '900', color: '#065F46' },
  xpPreviewLabel: { fontSize: 11, color: '#065F46' },
  modalPrimary: { backgroundColor: '#1A1E22', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
  modalPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  modalCancelText: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 4 },
  sheetCard: { width: '100%', maxWidth: 480, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '88%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#EAE5DE', alignSelf: 'center', marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  historyIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center' },
  historyTitle: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  historyDesc: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  historyAmt: { fontSize: 12, fontWeight: '800', color: '#3A7D5C' },
  bonusRow: { backgroundColor: '#FFFBF6', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 12, gap: 8, marginTop: 12 },
  bonusTitle: { fontSize: 12, fontWeight: '800', color: '#1A1E22' },
  bonusSub: { fontSize: 11, color: '#6B7280' },
  bonusBtn: { backgroundColor: '#D96A3E', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  bonusBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  streakBigCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#3A7D5C', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' },
  streakBigNum: { fontSize: 28, fontWeight: '900', color: '#065F46' },
  inputWrap: { width: '100%', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  input: { paddingVertical: 12, fontSize: 14, color: '#1A1E22' },
});

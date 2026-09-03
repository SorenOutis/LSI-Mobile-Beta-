import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TowerDefense() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Tower Defense</Text>
          <View style={styles.levelPill}><Text style={styles.levelText}>Lv 1</Text></View>
        </View>
        <View style={styles.gameArea}>
          <View style={styles.canvas}>
            <Text style={styles.canvasText}>🎮</Text>
            <Text style={styles.canvasSub}>Game canvas (Pixi.js)</Text>
            <Text style={styles.canvasHint}>Level 1 · Tap to place towers</Text>
          </View>
          <View style={styles.controls}>
            <View style={styles.stat}><Text style={styles.statLabel}>WAVE</Text><Text style={styles.statVal}>3 / 10</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>GOLD</Text><Text style={styles.statVal}>250</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>LIVES</Text><Text style={styles.statVal}>♥ 5</Text></View>
          </View>
        </View>
        <Text style={styles.comingSoon}>Playable arcade coming in a future update — this screen is the mobile shell.</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}><Text style={styles.secondaryText}>Exit</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { opacity: 0.55 }]} onPress={() => Alert.alert('Coming soon', 'The playable Tower Defense lands in a future update.')}>
            <Text style={styles.primaryText}>Coming soon</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F1115' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#0F1115' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1E22', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1, textTransform: 'uppercase' },
  comingSoon: { fontSize: 11, color: '#8A8A8A', textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' },
  levelPill: { backgroundColor: '#D96A3E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  levelText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  gameArea: { flex: 1, padding: 14, gap: 12 },
  canvas: { flex: 1, backgroundColor: '#1A1E22', borderRadius: 16, borderWidth: 1, borderColor: '#2A2E33', alignItems: 'center', justifyContent: 'center', gap: 8 },
  canvasText: { fontSize: 48 },
  canvasSub: { fontSize: 14, fontWeight: '800', color: '#fff' },
  canvasHint: { fontSize: 11, color: '#6B7280' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1A1E22', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2A2E33' },
  stat: { alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 9, color: '#6B7280', fontWeight: '800', letterSpacing: 1 },
  statVal: { fontSize: 14, fontWeight: '900', color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: '#1A1E22' },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: '#2A2E33', borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#1A1E22' },
  secondaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  primaryBtn: { flex: 1, backgroundColor: '#D96A3E', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

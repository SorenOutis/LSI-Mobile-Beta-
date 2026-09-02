import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HowItWorks() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>How it works</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}><Text style={styles.kicker}>How LSI helps</Text><Text style={styles.h1}>Make every assessment count.</Text><Text style={styles.p}>Three steps: Response → Understanding → Next lesson.</Text></View>
          {[
            { n: '1', title: 'Create assessments', desc: 'Build assessments quickly and easily with templates, AI assist, and reusable questions.', icon: 'document-text-outline' as const },
            { n: '2', title: 'Review responses', desc: 'See how learners are understanding with auto-grouped insights and flagged misconceptions.', icon: 'analytics-outline' as const },
            { n: '3', title: 'Plan next steps', desc: 'Use insights to plan what to teach next — group activities, feedback, and follow-ups.', icon: 'trail-sign-outline' as const },
          ].map((s) => (
            <View key={s.n} style={styles.stepCard}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.n}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.stepTitle}>{s.title}</Text><Text style={styles.stepDesc}>{s.desc}</Text></View>
              <Ionicons name={s.icon} size={24} color="#2F6B4F" />
            </View>
          ))}
          <View style={styles.ctaDark}>
            <Text style={styles.ctaTitle}>Start with the next lesson</Text>
            <Text style={styles.ctaSub}>Partner with our team to make the most of LSI in your classroom.</Text>
            <TouchableOpacity onPress={() => router.push('/about' as any)} style={styles.ctaBtn}><Text style={styles.ctaBtnText}>Learn more about LSI</Text><Ionicons name="arrow-forward" size={16} color="#1A1E22" /></TouchableOpacity>
          </View>
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
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  hero: { gap: 8 },
  kicker: { fontSize: 11, letterSpacing: 2, color: '#D96A3E', fontWeight: '700', textTransform: 'uppercase' },
  h1: { fontSize: 26, fontWeight: '900', color: '#1A1E22', lineHeight: 30 },
  p: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  stepCard: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 14, alignItems: 'center' },
  stepNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1E22', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22' },
  stepDesc: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 16 },
  ctaDark: { backgroundColor: '#17201F', borderRadius: 16, padding: 16, gap: 8, marginTop: 8 },
  ctaTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  ctaSub: { fontSize: 12, color: '#B8B8B8', lineHeight: 16 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, marginTop: 8 },
  ctaBtnText: { fontWeight: '800', fontSize: 13, color: '#1A1E22' },
});

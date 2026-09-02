import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>About LSI</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>About LSI</Text>
          <Text style={styles.h1}>We build tools for the next lesson.</Text>
          <Text style={styles.p}>LSI helps teachers turn classroom evidence into clearer decisions, useful feedback, and better follow-up. Built for teachers. Designed for schools.</Text>

          <View style={styles.cardRotate}>
            <Text style={styles.cardTitle}>A BETTER QUESTION</Text>
            <View style={styles.line} />
            <View style={styles.qRow}><Ionicons name="clipboard-outline" size={18} color="#D96A3E" /><Text style={styles.qText}>What did learners understand?</Text></View>
            <View style={styles.qRow}><Ionicons name="bulb-outline" size={18} color="#D96A3E" /><Text style={styles.qText}>What should we teach next?</Text></View>
            <Text style={styles.cardFoot}>Assessment is the beginning of the conversation.</Text>
          </View>

          <Text style={styles.h2}>What guides the work.</Text>
          {[
            { icon: 'checkmark-circle-outline' as const, t: 'Useful before impressive', d: 'Every part of LSI should make classroom work clearer.' },
            { icon: 'person-outline' as const, t: 'Teacher control', d: 'Feedback stays reviewable, adjustable, and yours to approve.' },
            { icon: 'shield-checkmark-outline' as const, t: 'Privacy by default', d: 'Schools keep ownership of their content and learner data.' },
          ].map((pr) => (
            <View key={pr.t} style={styles.principle}>
              <View style={styles.principleIcon}><Ionicons name={pr.icon} size={20} color="#1A1E22" /></View>
              <View style={{ flex: 1 }}><Text style={styles.prTitle}>{pr.t}</Text><Text style={styles.prBody}>{pr.d}</Text></View>
            </View>
          ))}

          <View style={styles.darkCard}>
            <Text style={styles.darkTitle}>From response to next step.</Text>
            {[
              { n: 'A learner answers.', icon: 'clipboard' },
              { n: 'A teacher sees the pattern.', icon: 'chatbubble' },
              { n: 'The next lesson gets clearer.', icon: 'bulb' },
            ].map((s) => (
              <View key={s.n} style={styles.darkRow}><View style={styles.darkIcon}><Ionicons name={s.icon as any} size={18} color="#B8E3D8" /></View><Text style={styles.darkText}>{s.n}</Text></View>
            ))}
            <Text style={styles.darkHint}>The point is not more data. It is a more useful next lesson.</Text>
          </View>

          <Text style={styles.h2}>Questions, answered.</Text>
          {[
            { q: 'What does LSI stand for?', a: 'LSI is a learning platform built around the work that happens after an assessment.' },
            { q: 'Who is LSI for?', a: 'Teachers, learners, and schools that want a clearer connection between assessment and follow-up.' },
            { q: 'Do teachers stay in control?', a: 'Yes. Teachers review and approve feedback before it reaches learners.' },
            { q: 'How is learner data handled?', a: 'Schools keep ownership and practical, reviewable use of learner information.' },
          ].map((faq) => (
            <View key={faq.q} style={styles.faq}><Text style={styles.faqQ}>{faq.q}</Text><Text style={styles.faqA}>{faq.a}</Text></View>
          ))}
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
  content: { padding: 14, gap: 16, paddingBottom: 32 },
  kicker: { fontSize: 11, letterSpacing: 2, color: '#D96A3E', fontWeight: '700', textTransform: 'uppercase' },
  h1: { fontSize: 28, fontWeight: '900', color: '#1A1E22', lineHeight: 32 },
  p: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  cardRotate: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', padding: 20, gap: 12, transform: [{ rotate: '0.5deg' }] },
  cardTitle: { fontSize: 12, letterSpacing: 2, fontWeight: '800', color: '#1A1E22' },
  line: { height: 1, backgroundColor: '#1A1E22', width: 120 },
  qRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  qText: { fontSize: 16, fontWeight: '600', color: '#1A1E22', fontFamily: 'serif' as any },
  cardFoot: { borderTopWidth: 1, borderTopColor: '#EAE5DE', paddingTop: 10, fontSize: 11, color: '#6B7280' } as any,
  h2: { fontSize: 20, fontWeight: '800', color: '#1A1E22', marginTop: 8 },
  principle: { flexDirection: 'row', gap: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14 },
  principleIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#1A1E22', alignItems: 'center', justifyContent: 'center' },
  prTitle: { fontSize: 13, fontWeight: '800', color: '#1A1E22' },
  prBody: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 16 },
  darkCard: { backgroundColor: '#17201F', borderRadius: 16, padding: 16, gap: 12 },
  darkTitle: { fontSize: 18, fontWeight: '800', color: '#F8F7F2' },
  darkRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  darkIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(184,227,216,0.4)', alignItems: 'center', justifyContent: 'center' },
  darkText: { fontSize: 12, color: '#F8F7F2', flex: 1 },
  darkHint: { fontSize: 11, color: '#B8E3D8', textAlign: 'center', marginTop: 4 },
  faq: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14, gap: 6 },
  faqQ: { fontSize: 13, fontWeight: '700', color: '#1A1E22' },
  faqA: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
});

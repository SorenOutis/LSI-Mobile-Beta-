import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.webWrap}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.lsi}>LSI</Text>
            <Text style={styles.slash}> /</Text>
            <Text style={styles.koami}>  KOAMISHIN</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="moon-outline" size={22} color="#1A1E22" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="menu" size={26} color="#1A1E22" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Make every</Text>
            <Text style={styles.heroTitle}>assessment count.</Text>
            <Text style={styles.heroSub}>See what learners understand.</Text>
            <Text style={styles.heroSub}>Give useful feedback.</Text>
            <Text style={styles.heroSub}>Plan what to teach next.</Text>
          </View>
          <View style={styles.illustration}>
            <View style={styles.illusCard}>
              <View style={styles.illusTop}>
                <View style={styles.donut}>
                  <View style={styles.donutHole} />
                </View>
                <View style={styles.illusLines}>
                  <View style={[styles.line, { width: 56, backgroundColor: '#A8C5B8' }]} />
                  <View style={styles.line} />
                  <View style={styles.line} />
                  <View style={[styles.line, { width: 36, backgroundColor: '#A8C5B8' }]} />
                </View>
              </View>
              <View style={styles.illusCheckRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={[styles.line, { width: '70%' }]} />
                  <View style={[styles.line, { width: '50%' }]} />
                </View>
              </View>
            </View>
            {/* dotted decoration */}
            <View style={styles.dots} />
          </View>
        </View>

        {/* CTA Buttons */}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/register' as any)}>
          <Text style={styles.primaryText}>Create a free account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login' as any)}>
          <Text style={styles.secondaryText}>Log in</Text>
        </TouchableOpacity>

        {/* How LSI helps */}
        <Text style={styles.sectionTitle}>How LSI helps</Text>
        <View style={styles.stepsRow}>
          <View style={styles.step}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Response</Text>
          </View>
          <View style={styles.dashed} />
          <View style={styles.step}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Understanding</Text>
          </View>
          <View style={styles.dashed} />
          <View style={styles.step}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNum}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Next lesson</Text>
          </View>
        </View>

        {/* 3 Cards */}
        <View style={styles.card}>
          <View style={styles.cardIconBox}>
            <MaterialCommunityIcons name="file-plus-outline" size={32} color="#2F6B4F" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Create assessments</Text>
            <Text style={styles.cardSub}>Build assessments quickly and easily.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1A1E22" />
        </View>
        <View style={styles.card}>
          <View style={styles.cardIconBox}>
            <MaterialCommunityIcons name="chart-bar" size={32} color="#2F6B4F" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Review responses</Text>
            <Text style={styles.cardSub}>See how learners are understanding.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1A1E22" />
        </View>
        <View style={styles.card}>
          <View style={styles.cardIconBox}>
            <MaterialCommunityIcons name="target" size={32} color="#2F6B4F" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Plan next steps</Text>
            <Text style={styles.cardSub}>Use insights to plan what to teach next.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1A1E22" />
        </View>

        {/* Dark bottom card */}
        <View style={styles.darkCard}>
          <View style={styles.darkTop}>
            <View style={styles.peopleIcon}>
              <Ionicons name="people-outline" size={42} color="#A8C5B8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.darkTitle}>Start with the next lesson</Text>
              <Text style={styles.darkSub}>Partner with our team to make the most of LSI in your classroom.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactText}>Contact sales</Text>
            <Ionicons name="chevron-forward" size={18} color="#C96A3E" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  container: { flex: 1, backgroundColor: '#FDFBF6' },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EAE5DE', marginHorizontal: -20, paddingHorizontal: 20 },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  lsi: { fontSize: 28, fontWeight: '900', color: '#1A1E22', letterSpacing: 1 },
  slash: { fontSize: 28, fontWeight: '300', color: '#D96A3E', marginLeft: 6 },
  koami: { fontSize: 12, letterSpacing: 3, color: '#1A1E22', fontWeight: '500' },
  headerIcons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBtn: { padding: 4 },
  hero: { flexDirection: 'row', marginTop: 24, gap: 12 },
  heroText: { flex: 1.2 },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#1A1E22', lineHeight: 34, fontFamily: 'serif' as any },
  heroSub: { fontSize: 14, color: '#6B6B6B', marginTop: 4, lineHeight: 18 },
  illustration: { flex: 0.9, alignItems: 'center', justifyContent: 'center' },
  illusCard: { width: 130, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EAE5DE', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  illusTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  donut: { width: 52, height: 52, borderRadius: 26, borderWidth: 10, borderColor: '#A8C5B8', borderTopColor: '#D96A3E', borderRightColor: '#D96A3E' },
  donutHole: { flex: 1 },
  illusLines: { flex: 1, gap: 6 },
  line: { height: 6, backgroundColor: '#EAE5DE', borderRadius: 3, width: '100%' },
  illusCheckRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 8, padding: 8 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#A8C5B8', alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', width: 70, height: 30, bottom: -6, right: -8, opacity: 0.3 },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#1A1E22', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 12, backgroundColor: '#FFFBF6' },
  secondaryText: { color: '#1A1E22', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1E22', marginTop: 24, marginBottom: 12 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  step: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E9EFE8', alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontWeight: '700', color: '#1A1E22' },
  stepLabel: { fontSize: 12, color: '#1A1E22', fontWeight: '500' },
  dashed: { flex: 1, height: 1, borderWidth: 1, borderColor: '#CFCFCF', borderStyle: 'dashed', marginHorizontal: 8, marginBottom: 18 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBF6', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 16, marginBottom: 10 },
  cardIconBox: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#EFF5F0', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#1A1E22' },
  cardSub: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  darkCard: { backgroundColor: '#15181E', borderRadius: 16, padding: 18, marginTop: 6 },
  darkTop: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  peopleIcon: { width: 50, alignItems: 'center' },
  darkTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  darkSub: { color: '#B8B8B8', fontSize: 12, marginTop: 4, lineHeight: 16 },
  contactBtn: { backgroundColor: '#FFFBF6', borderRadius: 10, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  contactText: { color: '#C96A3E', fontWeight: '700', fontSize: 14 },
});

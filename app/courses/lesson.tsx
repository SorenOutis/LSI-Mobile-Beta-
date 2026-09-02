// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LessonScreen() {
  const router = useRouter();
  const [answer, setAnswer] = useState<number | null>(null);
  const correct = 1;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Lesson Quiz</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.q}>What is the solution to 2x + 3 = 11?</Text>
          <Text style={styles.qHint}>Choose one answer · earn 25 XP</Text>
          {['x = 3', 'x = 4', 'x = 5', 'x = 6'].map((opt, i) => {
            const isSelected = answer === i;
            const isCorrect = i === correct;
            const showResult = answer !== null;
            return (
              <TouchableOpacity key={i} onPress={() => setAnswer(i)} style={[styles.opt, isSelected && styles.optSelected, showResult && isCorrect && styles.optCorrect, showResult && isSelected && !isCorrect && styles.optWrong]}>
                <View style={[styles.radio, isSelected && styles.radioSel]}>{isSelected && <View style={styles.radioDot} />}</View>
                <Text style={styles.optText}>{opt}</Text>
                {showResult && isCorrect && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
              </TouchableOpacity>
            );
          })}
          {answer !== null && (
            <View style={[styles.feedback, answer === correct ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' } : { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
              <Text style={[styles.feedbackText, { color: answer === correct ? '#065F46' : '#9F1239' }]}>{answer === correct ? 'Correct! Great job.' : 'Not quite. The correct answer is x = 4 (2×4+3=11).'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}><Text style={styles.primaryText}>Submit & continue</Text></TouchableOpacity>
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
  content: { padding: 14, gap: 12 },
  q: { fontSize: 16, fontWeight: '800', color: '#1A1E22', lineHeight: 22 },
  qHint: { fontSize: 11, color: '#6B7280' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 12, padding: 14 },
  optSelected: { borderColor: '#1A1E22', backgroundColor: '#FFFEFC' },
  optCorrect: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  optWrong: { borderColor: '#EF4444', backgroundColor: '#FFF1F2' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#CFCFCF', alignItems: 'center', justifyContent: 'center' },
  radioSel: { borderColor: '#1A1E22' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A1E22' },
  optText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1E22' },
  feedback: { borderWidth: 1, borderRadius: 12, padding: 12 },
  feedbackText: { fontSize: 13, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

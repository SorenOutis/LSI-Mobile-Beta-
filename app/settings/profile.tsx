import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api, errorMessage } from '@/lib/api';

export default function ProfileSettings() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [middle, setMiddle] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill from the real session user (loaded once at mount).
  useEffect(() => {
    if (!user) return;
    setFirst((user.first_name as string) ?? user.name?.split(' ')[0] ?? '');
    setLast((user.last_name as string) ?? (user.name?.includes(' ') ? user.name.split(' ').slice(1).join(' ') : ''));
    setMiddle((user.middle_name as string) ?? '');
    setEmail(user.email ?? '');
  }, [user]);

  const onSave = async () => {
    const f = first.trim();
    const l = last.trim();
    if (f.length < 2 || l.length < 2) {
      Alert.alert('Check names', 'First and last name need at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      // PUT /user updates the profile on the LUA V6 backend.
      await api.put('/user', {
        first_name: f,
        last_name: l,
        middle_name: middle.trim() || null,
      });
      await refreshUser();
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={styles.label}>First name</Text>
            <View style={styles.inputWrap}><TextInput value={first} onChangeText={setFirst} placeholder="First name" placeholderTextColor="#9AA0A6" style={styles.input} /></View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Middle name (optional)</Text>
            <View style={styles.inputWrap}><TextInput value={middle} onChangeText={setMiddle} placeholder="Optional" placeholderTextColor="#9AA0A6" style={styles.input} /></View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Last name</Text>
            <View style={styles.inputWrap}><TextInput value={last} onChangeText={setLast} placeholder="Last name" placeholderTextColor="#9AA0A6" style={styles.input} /></View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: '#F9F7F4' }]}>
              <TextInput value={email} editable={false} style={[styles.input, { color: '#6B7280' }]} />
            </View>
            <Text style={styles.hint}>Email changes are managed on the LUA V6 web app (requires re-verification).</Text>
          </View>
          <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
            <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF6' },
  webWrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#FDFBF6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FDFBF6' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1E22' },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAE5DE', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1E22' },
  inputWrap: { borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  input: { paddingVertical: 12, fontSize: 14, color: '#1A1E22' },
  hint: { fontSize: 11, color: '#6B7280', lineHeight: 15 },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';

export default function PasswordSettings() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!current) {
      Alert.alert('Current password required', 'Enter your current password first.');
      return;
    }
    if (next.length < 8 || !/[a-zA-Z]/.test(next) || !/\d/.test(next)) {
      Alert.alert('New password too weak', 'Use at least 8 characters with letters and numbers.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('Passwords do not match', 'The new password and confirmation must match.');
      return;
    }
    setSaving(true);
    try {
      // Change-password endpoint on the live LUA V6 backend.
      await api.put('/mobile/password', {
        current_password: current,
        password: next,
        password_confirmation: confirm,
      });
      Alert.alert('Password changed', 'You can now log in with your new password.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e) {
      Alert.alert('Could not change password', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.webWrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#1A1E22" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Password</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={styles.label}>Current password</Text>
            <View style={styles.inputWrap}><TextInput value={current} onChangeText={setCurrent} placeholder="••••••••" placeholderTextColor="#9AA0A6" secureTextEntry style={styles.input} /></View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <View style={styles.inputWrap}><TextInput value={next} onChangeText={setNext} placeholder="••••••••" placeholderTextColor="#9AA0A6" secureTextEntry style={styles.input} /></View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Confirm new password</Text>
            <View style={styles.inputWrap}><TextInput value={confirm} onChangeText={setConfirm} placeholder="••••••••" placeholderTextColor="#9AA0A6" secureTextEntry style={styles.input} /></View>
          </View>
          <Text style={styles.hint}>At least 8 characters, with letters and numbers.</Text>
          <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={onSave}>
            <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Update password'}</Text>
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
  hint: { fontSize: 11, color: '#6B7280' },
  primaryBtn: { backgroundColor: '#15181E', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useLoader } from '@/hooks/useLoader';

export function GlobalLoader({ minDisplayMs = 600 }: { minDisplayMs?: number }) {
  const { isVisible, pendingHide, message, hide } = useLoader();
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const shownAt = useRef<number>(0);
  const progressDone = useRef(false);

  // Read through refs inside animation callbacks so the effects below can be
  // keyed narrowly without restarting in-flight animations.
  const pendingHideRef = useRef(pendingHide);
  pendingHideRef.current = pendingHide;

  const tryExit = () => {
    if (!(progressDone.current && pendingHideRef.current)) return;
    const elapsed = Date.now() - shownAt.current;
    const wait = Math.max(0, minDisplayMs - elapsed);
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setShow(false);
        hide();
      });
    }, wait);
  };
  const tryExitRef = useRef(tryExit);
  tryExitRef.current = tryExit;

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      progressDone.current = false;
      setProgress(0);
      progressAnim.setValue(0);
      shownAt.current = Date.now();
      Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.timing(progressAnim, {
        toValue: pendingHideRef.current ? 100 : 95,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setProgress(100);
          progressDone.current = true;
          tryExitRef.current();
        }
      });
    } else if (show) {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setShow(false);
        hide();
      });
    }
    // Keyed on visibility only on purpose: `show`/`hide` are stable and the
    // animation must not restart when unrelated state changes mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => setProgress(Math.floor(value)));
    return () => progressAnim.removeListener(id);
  }, [progressAnim]);

  useEffect(() => {
    if (pendingHide && !progressDone.current) {
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        setProgress(100);
        progressDone.current = true;
        tryExitRef.current();
      });
    } else if (pendingHide && progressDone.current) {
      tryExitRef.current();
    }
  }, [pendingHide, progressAnim]);

  if (!show) return null;

  const isTerminating = message.toLowerCase().includes('signing out') || message.toLowerCase().includes('terminating');

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.content}>
        <Text style={styles.kicker}>LSI / SYSTEM NOTE</Text>
        <Text style={styles.title}>Making room for what comes next.</Text>
        <Text style={styles.subtitle}>Your workspace is getting ready. We are bringing the next clear step into view.</Text>
        <View style={styles.statusRow}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.percent}>{progress}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFg, { width: `${progress}%` }]} />
        </View>
        <View style={styles.loadingRow}>
          <View style={styles.dot} />
          <Text style={styles.loadingText}>{isTerminating ? 'Cleaning up...' : 'Loading...'}</Text>
        </View>
      </View>
      <View style={styles.noteCard}>
        <Text style={styles.noteHeader}>Today&apos;s note — 01</Text>
        <Text style={styles.noteTitle}>Keep the signal. Lose the noise.</Text>
        <Text style={styles.noteItem}>01 — Read what the response is telling you.</Text>
        <Text style={styles.noteItem}>02 — Choose the next useful move.</Text>
        <Text style={styles.noteFooter}>A clearer class is close.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#f8f7f2',
    padding: 24,
    justifyContent: 'center',
  },
  content: { gap: 12 },
  kicker: { fontSize: 10, letterSpacing: 2, color: '#f59e0b', fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '800', color: '#11181c' },
  subtitle: { fontSize: 13, color: '#687076', lineHeight: 18 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  message: { fontSize: 12, color: '#687076', fontWeight: '600' },
  percent: { fontSize: 12, color: '#11181c', fontWeight: '800' },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: '#e5e5e5', overflow: 'hidden' },
  progressFg: { height: 6, borderRadius: 3, backgroundColor: '#f59e0b' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' },
  loadingText: { fontSize: 11, color: '#687076', fontWeight: '600' },
  noteCard: { marginTop: 28, backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 6, borderWidth: 1, borderColor: '#eae5de' },
  noteHeader: { fontSize: 9, letterSpacing: 2, color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase' },
  noteTitle: { fontSize: 14, fontWeight: '800', color: '#11181c' },
  noteItem: { fontSize: 11, color: '#687076', lineHeight: 16 },
  noteFooter: { fontSize: 10, color: '#9aa0a6', marginTop: 4 },
});

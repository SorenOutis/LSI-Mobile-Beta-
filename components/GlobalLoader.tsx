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

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      progressDone.current = false;
      setProgress(0);
      progressAnim.setValue(0);
      shownAt.current = Date.now();
      Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.timing(progressAnim, {
        toValue: pendingHide ? 100 : 95,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && pendingHide) {
          setProgress(100);
          progressDone.current = true;
          tryExit();
        }
      });
    } else if (show) {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setShow(false);
        hide();
      });
    }
  }, [isVisible]);

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => setProgress(Math.floor(value)));
    return () => progressAnim.removeListener(id);
  }, []);

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
        tryExit();
      });
    } else if (pendingHide && progressDone.current) {
      tryExit();
    }
  }, [pendingHide]);

  const tryExit = () => {
    if (!(progressDone.current && pendingHide)) return;
    const elapsed = Date.now() - shownAt.current;
    const wait = Math.max(0, minDisplayMs - elapsed);
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setShow(false);
        hide();
      });
    }, wait);
  };

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
        <Text style={styles.noteHeader}>Today's note — 01</Text>
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
  title: { fontSize: 32, fontWeight: '700', color: '#17201f', lineHeight: 32, fontFamily: 'serif' as any },
  subtitle: { fontSize: 14, color: 'rgba(23,32,31,0.6)', lineHeight: 20 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(23,32,31,0.2)', paddingTop: 12 },
  message: { fontSize: 12, color: 'rgba(23,32,31,0.65)' },
  percent: { fontSize: 11, color: 'rgba(23,32,31,0.55)', fontFamily: 'monospace' as any },
  progressBg: { height: 1, backgroundColor: 'rgba(23,32,31,0.15)', marginTop: 12, width: '100%' },
  progressFg: { height: 1, backgroundColor: '#f59e0b' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' },
  loadingText: { fontSize: 10, letterSpacing: 1, color: 'rgba(23,32,31,0.4)', textTransform: 'uppercase' },
  noteCard: { marginTop: 32, backgroundColor: '#fffdf7', borderWidth: 1, borderColor: 'rgba(23,32,31,0.15)', padding: 16, transform: [{ rotate: '-2deg' }] },
  noteHeader: { fontSize: 10, letterSpacing: 1, color: 'rgba(23,32,31,0.45)', textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: 'rgba(23,32,31,0.15)', paddingBottom: 8 },
  noteTitle: { fontSize: 18, fontWeight: '600', color: '#17201f', marginTop: 12, fontFamily: 'serif' as any },
  noteItem: { fontSize: 12, color: 'rgba(23,32,31,0.6)', marginTop: 8 },
  noteFooter: { fontSize: 10, letterSpacing: 1, color: 'rgba(23,32,31,0.4)', textTransform: 'uppercase', borderTopWidth: 1, borderTopColor: 'rgba(23,32,31,0.15)', marginTop: 12, paddingTop: 8 },
});

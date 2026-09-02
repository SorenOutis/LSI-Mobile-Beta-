import { View, StyleSheet } from 'react-native';

export function PageSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.lineLong} />
          <View style={styles.lineShort} />
          <View style={styles.lineMid} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingTop: 8 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EAE5DE', borderRadius: 14, padding: 16, gap: 8 },
  lineLong: { height: 12, backgroundColor: '#EAE5DE', borderRadius: 6, width: '70%' },
  lineShort: { height: 12, backgroundColor: '#F0F0F0', borderRadius: 6, width: '40%' },
  lineMid: { height: 12, backgroundColor: '#F0F0F0', borderRadius: 6, width: '85%' },
});

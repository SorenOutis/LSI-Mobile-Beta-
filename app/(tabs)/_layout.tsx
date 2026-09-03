import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConnection } from '@/lib/api';

function TabIcon({ name, color }: { name: any; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  const { token } = useAuth();
  const router = useRouter();
  const connection = useConnection();

  // Guard: tabs require a session (protects deep links before RootGate redirects).
  useEffect(() => {
    if (!token) router.replace('/');
  }, [token, router]);

  if (!token) return null;

  return (
    <View style={styles.wrap}>
      {!connection.reachable && (
        <View style={styles.banner}>
          <Ionicons name="cloud-offline-outline" size={14} color="#FFF3E0" />
          <Text style={styles.bannerText}>
            Can&apos;t reach the LUA V6 server — check your connection, then pull to retry.
          </Text>
        </View>
      )}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#D96A3E',
          tabBarInactiveTintColor: '#8A8A8A',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#EAE5DE',
            height: 72,
            paddingTop: 8,
            paddingBottom: 10,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />,
          }}
        />
        <Tabs.Screen
          name="exams"
          options={{
            title: 'Exams',
            tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'document-text' : 'document-text-outline'} color={color} />,
          }}
        />
        <Tabs.Screen
          name="agenda"
          options={{
            title: 'Agenda',
            tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'checkbox' : 'checkbox-outline'} color={color} />,
          }}
        />
        <Tabs.Screen
          name="grades"
          options={{
            title: 'Grades',
            tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: 'Chats',
            tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#FDFBF6' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D96A3E',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerText: { flex: 1, color: '#FFF3E0', fontSize: 11, fontWeight: '700' },
});

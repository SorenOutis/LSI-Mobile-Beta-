import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { GlobalLoader } from '@/components/GlobalLoader';

// Keep the native splash visible until the session has been restored.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Route gate: signed-in users land on the tabs, guests on the welcome screen.
 * Also hides the splash once AuthContext has finished restoring the session.
 */
function RootGate() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync().catch(() => {});
    router.replace(token ? '/(tabs)' : '/');
  }, [loading, token, router]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GlobalLoader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="courses" />
        <Stack.Screen name="games" />
        <Stack.Screen name="exams" />
        <Stack.Screen name="ngl" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="about" />
        <Stack.Screen name="how-it-works" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="more" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="u" />
      </Stack>
      <RootGate />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { GlobalLoader } from '@/components/GlobalLoader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
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
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

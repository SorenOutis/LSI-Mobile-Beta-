import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FDFBF6' },
        animation: 'slide_from_right',
      }}
    />
  );
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/theme';

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
        }}
      />
    </>
  );
}

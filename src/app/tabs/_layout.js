// app/(tabs)/_layout.js
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/theme';

export default function TabLayout() {
  const colors = useAppTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.orange,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
      tabBarStyle: { height: 62, paddingTop: 7, paddingBottom: 5, backgroundColor: colors.surface, borderTopColor: colors.line },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="carta"
        options={{
          title: 'Carta',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

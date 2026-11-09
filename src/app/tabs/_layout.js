// app/(tabs)/_layout.js
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Paleta de colores sugerida
const Colors = { accent: '#F28C28', background: '#F7F5F2' };

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.accent,
      tabBarInactiveTintColor: '#87909A',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
      tabBarStyle: { height: 62, paddingTop: 7, paddingBottom: 5, backgroundColor: '#FFFFFF', borderTopColor: '#ECE8E3' },
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

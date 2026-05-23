import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="photo-queue" options={{ title: 'ถ่ายรูป', tabBarIcon: ({ color, size }) => <Ionicons name="camera-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="listing-queue" options={{ title: 'ลงขาย', tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="daily-logs" options={{ title: 'งานวันนี้', tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  )
}

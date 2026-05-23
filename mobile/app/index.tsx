import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { isLoggedIn } from '@/lib/auth'
import { View, ActivityIndicator } from 'react-native'
import { Colors } from '@/constants/Colors'

export default function Index() {
  const router = useRouter()
  useEffect(() => {
    isLoggedIn().then(ok => {
      router.replace(ok ? '/(tabs)' : '/(auth)/login')
    })
  }, [])
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}

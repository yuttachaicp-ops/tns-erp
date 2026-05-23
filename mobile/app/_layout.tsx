import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { isLoggedIn } from '@/lib/auth'
import { useRouter } from 'expo-router'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#0f1117" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f1117' } }} />
    </>
  )
}

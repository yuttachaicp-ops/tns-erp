import AsyncStorage from '@react-native-async-storage/async-storage'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'STAFF'
}

export async function saveSession(token: string, user: AuthUser) {
  await AsyncStorage.multiSet([
    ['tns-token', token],
    ['tns-user', JSON.stringify(user)],
  ])
}

export async function getSession(): Promise<{ token: string | null; user: AuthUser | null }> {
  const [[, token], [, userStr]] = await AsyncStorage.multiGet(['tns-token', 'tns-user'])
  const user = userStr ? JSON.parse(userStr) as AuthUser : null
  return { token, user }
}

export async function clearSession() {
  await AsyncStorage.multiRemove(['tns-token', 'tns-user'])
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await AsyncStorage.getItem('tns-token')
  return !!token
}

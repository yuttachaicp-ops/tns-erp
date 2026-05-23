import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { saveSession } from '@/lib/auth'
import { Colors } from '@/constants/Colors'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) { Alert.alert('⚠️ กรุณากรอกข้อมูลให้ครบ'); return }
    setLoading(true)
    const result = await api.login(email, password)
    setLoading(false)
    if (!result.success) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', result.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      return
    }
    const { token, user } = result.data as { token: string; user: { id: string; email: string; name: string; role: 'ADMIN'|'STAFF' } }
    await saveSession(token, user)
    router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <Text style={styles.appName}>TNS ERP</Text>
          <Text style={styles.appSub}>Daily Operations System</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.label}>อีเมล</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@tns.co.th"
            placeholderTextColor={Colors.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.label, { marginTop: 12 }]}>รหัสผ่าน</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.textDim}
            secureTextEntry
          />
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.btnText}>🚀 เข้าสู่ระบบ</Text>
            }
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>TNS ERP v1.0 © 2024</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoLetter: { fontSize: 32, fontWeight: '800', color: 'white' },
  appName: { fontSize: 26, fontWeight: '800', color: 'white' },
  appSub: { fontSize: 13, color: Colors.primary, marginTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 14, color: Colors.text, fontSize: 15, marginBottom: 4 },
  btn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  footer: { textAlign: 'center', color: Colors.textDim, fontSize: 12, marginTop: 24 },
})

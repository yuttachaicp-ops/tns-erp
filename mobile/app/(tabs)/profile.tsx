import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getSession, clearSession } from '@/lib/auth'
import { api } from '@/lib/api'
import { Colors } from '@/constants/Colors'

export default function ProfileScreen() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)

  useEffect(() => {
    getSession().then(({ user }) => { if (user) setUser(user) })
  }, [])

  async function logout() {
    Alert.alert('ออกจากระบบ', 'ยืนยันการออกจากระบบ?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออกจากระบบ', style: 'destructive',
        onPress: async () => {
          await api.logout()
          await clearSession()
          router.replace('/(auth)/login')
        }
      },
    ])
  }

  const menus = [
    { icon: 'person-outline' as const, label: 'ข้อมูลส่วนตัว', sub: user?.name || '' },
    { icon: 'mail-outline' as const, label: 'อีเมล', sub: user?.email || '' },
    { icon: 'shield-checkmark-outline' as const, label: 'บทบาท', sub: user?.role === 'ADMIN' ? '👑 Administrator' : '👤 Staff' },
  ]

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'T'}</Text>
        </View>
        <Text style={s.name}>{user?.name || '...'}</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleText}>{user?.role === 'ADMIN' ? '👑 Administrator' : '👤 Staff'}</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>ข้อมูลบัญชี</Text>
        {menus.map(m => (
          <View key={m.label} style={s.menuItem}>
            <Ionicons name={m.icon} size={18} color={Colors.primaryLight} />
            <View style={{ flex:1 }}>
              <Text style={s.menuLabel}>{m.label}</Text>
              <Text style={s.menuSub}>{m.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>เกี่ยวกับแอป</Text>
        <View style={s.menuItem}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primaryLight} />
          <View style={{ flex:1 }}>
            <Text style={s.menuLabel}>เวอร์ชัน</Text>
            <Text style={s.menuSub}>TNS ERP v1.0.0</Text>
          </View>
        </View>
        <View style={s.menuItem}>
          <Ionicons name="server-outline" size={18} color={Colors.primaryLight} />
          <View style={{ flex:1 }}>
            <Text style={s.menuLabel}>เซิร์ฟเวอร์</Text>
            <Text style={s.menuSub}>Cloud (Render.com)</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
        <Text style={s.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>

      <Text style={s.footer}>TNS ERP © 2024 — Daily Operations System</Text>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:Colors.bg },
  header: { alignItems:'center', padding:32, paddingTop:60, backgroundColor:Colors.surface, borderBottomWidth:1, borderBottomColor:Colors.border },
  avatar: { width:72, height:72, borderRadius:36, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', marginBottom:12 },
  avatarText: { fontSize:30, fontWeight:'800', color:'white' },
  name: { fontSize:20, fontWeight:'800', color:'white', marginBottom:6 },
  roleBadge: { backgroundColor:`${Colors.primary}20`, borderWidth:1, borderColor:`${Colors.primary}40`, borderRadius:99, paddingHorizontal:12, paddingVertical:4 },
  roleText: { color:Colors.primaryLight, fontSize:12, fontWeight:'600' },
  section: { margin:16, backgroundColor:Colors.surface, borderRadius:12, borderWidth:1, borderColor:Colors.border, overflow:'hidden' },
  sectionTitle: { fontSize:11, fontWeight:'700', color:Colors.textDim, textTransform:'uppercase', letterSpacing:1, padding:12, borderBottomWidth:1, borderBottomColor:Colors.border },
  menuItem: { flexDirection:'row', alignItems:'flex-start', padding:14, borderBottomWidth:1, borderBottomColor:Colors.border, gap:12 },
  menuLabel: { fontSize:13, color:'white', fontWeight:'600' },
  menuSub: { fontSize:12, color:Colors.textMuted, marginTop:2 },
  logoutBtn: { margin:16, backgroundColor:`${Colors.danger}10`, borderWidth:1, borderColor:`${Colors.danger}30`, borderRadius:12, padding:16, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8 },
  logoutText: { color:Colors.danger, fontWeight:'700', fontSize:15 },
  footer: { textAlign:'center', color:Colors.textDim, fontSize:11, padding:20, paddingBottom:40 },
})

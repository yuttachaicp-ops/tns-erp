import { useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { Colors } from '@/constants/Colors'

interface Summary {
  photoQueuePending: number; photoQueueTotal: number
  listingQueuePending: number; listingQueueTotal: number
  todayLogs: number; pendingLogs: number
}

function KPICard({ icon, label, value, sub, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; sub: string; color: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 3 }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.kpiHeader}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={styles.kpiLabel}>{label}</Text>
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value.toLocaleString()}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </TouchableOpacity>
  )
}

export default function DashboardScreen() {
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [userName, setUserName] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { user } = await getSession()
    if (user) setUserName(user.name)
    const result = await api.dashboard()
    if (result.success) setSummary((result.data as { summary: Summary }).summary)
    setLoading(false)
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }
  useEffect(() => { load() }, [])

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'อรุณสวัสดิ์' : now.getHours() < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.userName}>{userName || 'กำลังโหลด...'}</Text>
        </View>
        <View style={styles.logoSmall}>
          <Text style={styles.logoSmallText}>T</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>📊 ภาพรวมวันนี้</Text>

      {loading ? (
        <Text style={styles.loading}>⏳ กำลังโหลด...</Text>
      ) : (
        <View style={styles.grid}>
          <KPICard icon="camera-outline" label="สินค้ารอถ่ายรูป" value={summary?.photoQueuePending || 0} sub={`จากทั้งหมด ${summary?.photoQueueTotal || 0}`} color={Colors.warning} onPress={() => router.push('/(tabs)/photo-queue')} />
          <KPICard icon="cart-outline" label="สินค้ายังไม่ลงขาย" value={summary?.listingQueuePending || 0} sub={`จากทั้งหมด ${summary?.listingQueueTotal || 0}`} color={Colors.danger} onPress={() => router.push('/(tabs)/listing-queue')} />
          <KPICard icon="document-text-outline" label="งานวันนี้" value={summary?.todayLogs || 0} sub="บันทึกวันนี้" color={Colors.success} onPress={() => router.push('/(tabs)/daily-logs')} />
          <KPICard icon="time-outline" label="งานค้าง" value={summary?.pendingLogs || 0} sub="รอดำเนินการ" color={Colors.primaryLight} onPress={() => router.push('/(tabs)/daily-logs')} />
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>⚡ ทำงานเร็ว</Text>
      <View style={styles.quickActions}>
        {[
          { label: '+ เพิ่มสินค้าถ่ายรูป', route: '/(tabs)/photo-queue', color: Colors.warning },
          { label: '+ เพิ่มสินค้าลงขาย', route: '/(tabs)/listing-queue', color: Colors.danger },
          { label: '+ บันทึกงานวันนี้', route: '/(tabs)/daily-logs', color: Colors.success },
        ].map(a => (
          <TouchableOpacity key={a.label} style={[styles.quickBtn, { borderColor: a.color }]} onPress={() => router.push(a.route as never)} activeOpacity={0.7}>
            <Text style={[styles.quickBtnText, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  greeting: { fontSize: 13, color: Colors.textMuted },
  userName: { fontSize: 20, fontWeight: '800', color: 'white', marginTop: 2 },
  logoSmall: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoSmallText: { color: 'white', fontWeight: '800', fontSize: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  loading: { color: Colors.textDim, textAlign: 'center', padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  kpiCard: { width: '47%', marginHorizontal: '1.5%', backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  kpiLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', flex: 1 },
  kpiValue: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  kpiSub: { fontSize: 11, color: Colors.textDim },
  quickActions: { padding: 16, gap: 8 },
  quickBtn: { borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  quickBtnText: { fontWeight: '700', fontSize: 14 },
})

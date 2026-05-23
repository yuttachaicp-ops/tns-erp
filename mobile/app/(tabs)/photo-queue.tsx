import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
  Modal, TextInput, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { Colors } from '@/constants/Colors'

interface Item { id: string; productName: string; sku?: string; category?: string; quantity: number; status: string; note?: string }
const EMPTY: Partial<Item> = { productName:'', sku:'', category:'', quantity:1, status:'PENDING', note:'' }
const STATUS_COLORS: Record<string,string> = { PENDING: Colors.warning, IN_PROGRESS: Colors.primaryLight, COMPLETED: Colors.success }
const STATUS_LABELS: Record<string,string> = { PENDING:'⏳ รอดำเนินการ', IN_PROGRESS:'🔄 กำลังทำ', COMPLETED:'✅ เสร็จสิ้น' }

export default function PhotoQueueScreen() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Item>>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const result = await api.getPhotoQueue()
    if (result.success) setItems((result.data as { items: Item[] }).items)
    setLoading(false)
  }, [])

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }
  useEffect(() => { load() }, [load])

  async function save() {
    if (!editing.productName) { Alert.alert('กรุณากรอกชื่อสินค้า'); return }
    setSaving(true)
    if (isEdit) await api.updatePhoto(editing.id!, editing)
    else await api.createPhoto(editing)
    setSaving(false); setModal(false); setEditing(EMPTY); load()
  }

  async function remove(id: string) {
    Alert.alert('ยืนยันการลบ', 'ต้องการลบรายการนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: async () => { await api.deletePhoto(id); load() } },
    ])
  }

  async function changeStatus(id: string, status: string) {
    await api.updatePhoto(id, { status }); load()
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📷 สินค้ารอถ่ายรูป</Text>
        <Text style={styles.count}>{items.length} รายการ</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.empty}>📭 ไม่มีข้อมูล</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <View style={{ flex:1, marginRight:8 }}>
                <Text style={styles.productName}>{item.productName}</Text>
                {item.sku && <Text style={styles.sku}>SKU: {item.sku}</Text>}
                {item.category && <Text style={styles.sku}>หมวด: {item.category}</Text>}
              </View>
              <View style={{flexDirection:'row',gap:6}}>
                <TouchableOpacity onPress={() => { setEditing(item); setIsEdit(true); setModal(true) }} style={styles.actionBtn}>
                  <Ionicons name="pencil-outline" size={15} color={Colors.primaryLight} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item.id)} style={[styles.actionBtn, { borderColor: Colors.danger }]}>
                  <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection:'row', gap:8, flexWrap:'wrap' }}>
              <Text style={[styles.badge, { borderColor: STATUS_COLORS[item.status], color: STATUS_COLORS[item.status] }]}>
                {STATUS_LABELS[item.status]}
              </Text>
              <Text style={styles.qty}>จำนวน: {item.quantity}</Text>
            </View>
            {item.status !== 'COMPLETED' && (
              <TouchableOpacity onPress={() => changeStatus(item.id, item.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED')}
                style={[styles.progressBtn, { borderColor: item.status === 'PENDING' ? Colors.primaryLight : Colors.success }]}>
                <Text style={{ color: item.status === 'PENDING' ? Colors.primaryLight : Colors.success, fontSize:12, fontWeight:'600' }}>
                  {item.status === 'PENDING' ? '▶ เริ่มถ่ายรูป' : '✓ ถ่ายรูปเสร็จ'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditing(EMPTY); setIsEdit(false); setModal(true) }}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้า'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={24} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16, gap:14 }}>
            {[
              { label:'ชื่อสินค้า *', key:'productName' },
              { label:'SKU', key:'sku' },
              { label:'หมวดหมู่', key:'category' },
              { label:'หมายเหตุ', key:'note' },
            ].map(f => (
              <View key={f.key}>
                <Text style={styles.formLabel}>{f.label}</Text>
                <TextInput style={styles.formInput} value={String(editing[f.key as keyof Item] || '')}
                  onChangeText={v => setEditing({...editing, [f.key]:v})} placeholderTextColor={Colors.textDim} />
              </View>
            ))}
            <View>
              <Text style={styles.formLabel}>จำนวน</Text>
              <TextInput style={styles.formInput} value={String(editing.quantity || 1)} keyboardType="numeric"
                onChangeText={v => setEditing({...editing, quantity: parseInt(v)||1})} placeholderTextColor={Colors.textDim} />
            </View>
            <View>
              <Text style={styles.formLabel}>สถานะ</Text>
              {['PENDING','IN_PROGRESS','COMPLETED'].map(s => (
                <TouchableOpacity key={s} onPress={() => setEditing({...editing, status:s})}
                  style={[styles.optionBtn, editing.status === s && { borderColor: STATUS_COLORS[s], backgroundColor: `${STATUS_COLORS[s]}15` }]}>
                  <Text style={{ color: editing.status === s ? STATUS_COLORS[s] : Colors.textMuted, fontSize:13, fontWeight:'600' }}>{STATUS_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity:0.7 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{isEdit ? '💾 บันทึก' : '➕ เพิ่ม'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: Colors.bg },
  center: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor: Colors.bg },
  header: { paddingTop:50, paddingHorizontal:20, paddingBottom:14, backgroundColor:Colors.surface, borderBottomWidth:1, borderBottomColor:Colors.border, flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end' },
  title: { fontSize:18, fontWeight:'800', color:'white' },
  count: { fontSize:12, color:Colors.textMuted },
  empty: { textAlign:'center', color:Colors.textDim, padding:40, fontSize:15 },
  card: { backgroundColor:Colors.surface, borderRadius:12, padding:14, borderWidth:1, borderColor:Colors.border },
  productName: { fontSize:15, fontWeight:'700', color:'white', marginBottom:3 },
  sku: { fontSize:12, color:Colors.textMuted },
  actionBtn: { borderWidth:1, borderColor:Colors.primaryLight, borderRadius:6, padding:5 },
  badge: { fontSize:11, borderWidth:1, borderRadius:99, paddingHorizontal:8, paddingVertical:2, fontWeight:'600' },
  qty: { fontSize:11, color:Colors.textDim, alignSelf:'center' },
  progressBtn: { marginTop:8, borderWidth:1, borderRadius:8, padding:8, alignItems:'center' },
  fab: { position:'absolute', right:20, bottom:24, width:56, height:56, borderRadius:28, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center', elevation:8, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:6 },
  modalContainer: { flex:1, backgroundColor:Colors.bg },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:50, borderBottomWidth:1, borderBottomColor:Colors.border },
  modalTitle: { fontSize:18, fontWeight:'800', color:'white' },
  formLabel: { fontSize:13, color:Colors.textMuted, fontWeight:'600', marginBottom:6 },
  formInput: { backgroundColor:Colors.surface, borderWidth:1, borderColor:Colors.border, borderRadius:8, padding:12, color:Colors.text, fontSize:14 },
  optionBtn: { borderWidth:1, borderColor:Colors.border, borderRadius:8, padding:10, marginBottom:6, alignItems:'center' },
  modalFooter: { padding:16, borderTopWidth:1, borderTopColor:Colors.border },
  saveBtn: { backgroundColor:Colors.primary, borderRadius:10, padding:15, alignItems:'center' },
  saveBtnText: { color:'white', fontWeight:'700', fontSize:15 },
})

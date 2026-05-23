import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { Colors } from '@/constants/Colors'

interface Item { id: string; productName: string; sku?: string; platform: string; quantity: number; status: string; assignedTo?: string }
const EMPTY: Partial<Item> = { productName:'', sku:'', platform:'SHOPEE', quantity:1, status:'PENDING', assignedTo:'' }
const PLATFORMS = ['SHOPEE','LAZADA','TIKTOK_SHOP','WEBSITE']
const PLATFORM_LABELS: Record<string,string> = { SHOPEE:'🛍️ Shopee', LAZADA:'💜 Lazada', TIKTOK_SHOP:'🎵 TikTok', WEBSITE:'🌐 Website' }
const PLATFORM_COLORS: Record<string,string> = { SHOPEE:'#ff7043', LAZADA:'#ce93d8', TIKTOK_SHOP:'#e0e0e0', WEBSITE:Colors.primaryLight }
const STATUS_LABELS: Record<string,string> = { PENDING:'⏳ รอดำเนินการ', IN_PROGRESS:'🔄 กำลังทำ', COMPLETED:'✅ เสร็จสิ้น', CANCELLED:'❌ ยกเลิก' }

export default function ListingQueueScreen() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Item>>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const r = await api.getListingQueue()
    if (r.success) setItems((r.data as { items: Item[] }).items)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  async function save() {
    if (!editing.productName) { Alert.alert('กรุณากรอกชื่อสินค้า'); return }
    setSaving(true)
    if (isEdit) await api.updateListing(editing.id!, editing); else await api.createListing(editing)
    setSaving(false); setModal(false); setEditing(EMPTY); load()
  }

  async function remove(id: string) {
    Alert.alert('ยืนยัน', 'ต้องการลบ?', [{ text:'ยกเลิก',style:'cancel' }, { text:'ลบ',style:'destructive',onPress: async () => { await api.deleteListing(id); load() } }])
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>🛒 สินค้ายังไม่ได้ลงขาย</Text>
        <Text style={s.count}>{items.length} รายการ</Text>
      </View>
      <FlatList data={items} keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding:16, gap:10, paddingBottom:100 }}
        ListEmptyComponent={<Text style={s.empty}>📭 ไม่มีข้อมูล</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
              <View style={{ flex:1 }}>
                <Text style={s.name}>{item.productName}</Text>
                {item.sku && <Text style={s.sub}>SKU: {item.sku}</Text>}
                {item.assignedTo && <Text style={s.sub}>👤 {item.assignedTo}</Text>}
              </View>
              <View style={{ flexDirection:'row', gap:6 }}>
                <TouchableOpacity onPress={() => { setEditing(item); setIsEdit(true); setModal(true) }} style={s.btn}>
                  <Ionicons name="pencil-outline" size={14} color={Colors.primaryLight} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item.id)} style={[s.btn, { borderColor:Colors.danger }]}>
                  <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection:'row', gap:8, marginTop:8, flexWrap:'wrap' }}>
              <Text style={[s.badge, { borderColor:PLATFORM_COLORS[item.platform], color:PLATFORM_COLORS[item.platform] }]}>{PLATFORM_LABELS[item.platform]}</Text>
              <Text style={[s.badge, { borderColor:Colors.textDim, color:Colors.textMuted }]}>{STATUS_LABELS[item.status]}</Text>
              <Text style={s.qty}>x{item.quantity}</Text>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => { setEditing(EMPTY); setIsEdit(false); setModal(true) }}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={s.modal}>
          <View style={s.modalHead}>
            <Text style={s.modalTitle}>{isEdit ? '✏️ แก้ไข' : '➕ เพิ่มสินค้าลงขาย'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={24} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding:16, gap:14 }}>
            {[{label:'ชื่อสินค้า *',key:'productName'},{label:'SKU',key:'sku'},{label:'ผู้รับผิดชอบ',key:'assignedTo'}].map(f => (
              <View key={f.key}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput style={s.input} value={String(editing[f.key as keyof Item]||'')} onChangeText={v => setEditing({...editing,[f.key]:v})} placeholderTextColor={Colors.textDim} />
              </View>
            ))}
            <View>
              <Text style={s.label}>จำนวน</Text>
              <TextInput style={s.input} value={String(editing.quantity||1)} keyboardType="numeric" onChangeText={v => setEditing({...editing,quantity:parseInt(v)||1})} placeholderTextColor={Colors.textDim} />
            </View>
            <View>
              <Text style={s.label}>Platform *</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
                {PLATFORMS.map(p => (
                  <TouchableOpacity key={p} onPress={() => setEditing({...editing,platform:p})}
                    style={[s.chip, editing.platform===p && { borderColor:PLATFORM_COLORS[p], backgroundColor:`${PLATFORM_COLORS[p]}15` }]}>
                    <Text style={{ color:editing.platform===p?PLATFORM_COLORS[p]:Colors.textMuted, fontSize:12, fontWeight:'600' }}>{PLATFORM_LABELS[p]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text style={s.label}>สถานะ</Text>
              {['PENDING','IN_PROGRESS','COMPLETED','CANCELLED'].map(st => (
                <TouchableOpacity key={st} onPress={() => setEditing({...editing,status:st})}
                  style={[s.optBtn, editing.status===st && { borderColor:Colors.primary, backgroundColor:Colors.primary+'15' }]}>
                  <Text style={{ color:editing.status===st?Colors.primaryLight:Colors.textMuted, fontSize:13, fontWeight:'600' }}>{STATUS_LABELS[st]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={s.foot}>
            <TouchableOpacity style={[s.saveBtn, saving && {opacity:0.7}]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={s.saveTxt}>{isEdit ? '💾 บันทึก' : '➕ เพิ่ม'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:Colors.bg}, center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:Colors.bg},
  header:{paddingTop:50,paddingHorizontal:20,paddingBottom:14,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'},
  title:{fontSize:18,fontWeight:'800',color:'white'}, count:{fontSize:12,color:Colors.textMuted},
  empty:{textAlign:'center',color:Colors.textDim,padding:40,fontSize:15},
  card:{backgroundColor:Colors.surface,borderRadius:12,padding:14,borderWidth:1,borderColor:Colors.border},
  name:{fontSize:15,fontWeight:'700',color:'white',marginBottom:3}, sub:{fontSize:12,color:Colors.textMuted},
  btn:{borderWidth:1,borderColor:Colors.primaryLight,borderRadius:6,padding:5},
  badge:{fontSize:11,borderWidth:1,borderRadius:99,paddingHorizontal:8,paddingVertical:2,fontWeight:'600'},
  qty:{fontSize:11,color:Colors.textDim,alignSelf:'center'},
  fab:{position:'absolute',right:20,bottom:24,width:56,height:56,borderRadius:28,backgroundColor:Colors.primary,alignItems:'center',justifyContent:'center',elevation:8},
  modal:{flex:1,backgroundColor:Colors.bg}, modalHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingTop:50,borderBottomWidth:1,borderBottomColor:Colors.border},
  modalTitle:{fontSize:18,fontWeight:'800',color:'white'},
  label:{fontSize:13,color:Colors.textMuted,fontWeight:'600',marginBottom:6},
  input:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.border,borderRadius:8,padding:12,color:Colors.text,fontSize:14},
  chip:{borderWidth:1,borderColor:Colors.border,borderRadius:8,paddingHorizontal:12,paddingVertical:8},
  optBtn:{borderWidth:1,borderColor:Colors.border,borderRadius:8,padding:10,marginBottom:6,alignItems:'center'},
  foot:{padding:16,borderTopWidth:1,borderTopColor:Colors.border},
  saveBtn:{backgroundColor:Colors.primary,borderRadius:10,padding:15,alignItems:'center'},
  saveTxt:{color:'white',fontWeight:'700',fontSize:15},
})

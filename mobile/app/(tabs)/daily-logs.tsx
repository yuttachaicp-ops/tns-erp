import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { Colors } from '@/constants/Colors'

interface Item { id: string; workTitle: string; workDetail?: string; workCategory: string; priority: string; status: string; assignedUser?: string }
const EMPTY: Partial<Item> = { workTitle:'', workDetail:'', workCategory:'ทั่วไป', priority:'MEDIUM', status:'TODO', assignedUser:'' }
const PRIORITY_COLORS: Record<string,string> = { LOW:Colors.success, MEDIUM:Colors.warning, HIGH:'#fb923c', URGENT:Colors.danger }
const PRIORITY_LABELS: Record<string,string> = { LOW:'🟢 ต่ำ', MEDIUM:'🟡 กลาง', HIGH:'🟠 สูง', URGENT:'🔴 เร่งด่วน' }
const STATUS_COLORS: Record<string,string> = { TODO:Colors.textMuted, IN_PROGRESS:Colors.primaryLight, DONE:Colors.success, CANCELLED:Colors.danger }
const STATUS_LABELS: Record<string,string> = { TODO:'📋 รอทำ', IN_PROGRESS:'🔄 กำลังทำ', DONE:'✅ เสร็จ', CANCELLED:'❌ ยกเลิก' }
const CATEGORIES = ['ทั่วไป','ถ่ายรูป','ลงขาย','แพ็คสินค้า','จัดส่ง','ติดต่อลูกค้า','รับสินค้า','อื่นๆ']

export default function DailyLogsScreen() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Item>>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const r = await api.getDailyLogs()
    if (r.success) setItems((r.data as { items: Item[] }).items)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  async function save() {
    if (!editing.workTitle) { Alert.alert('กรุณากรอกหัวข้องาน'); return }
    setSaving(true)
    if (isEdit) await api.updateLog(editing.id!, editing); else await api.createLog(editing)
    setSaving(false); setModal(false); setEditing(EMPTY); load()
  }

  async function markDone(id: string) {
    await api.updateLog(id, { status: 'DONE' }); load()
  }

  async function remove(id: string) {
    Alert.alert('ยืนยัน', 'ต้องการลบ?', [{ text:'ยกเลิก',style:'cancel' }, { text:'ลบ',style:'destructive',onPress: async () => { await api.deleteLog(id); load() } }])
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>📝 บันทึกงานประจำวัน</Text>
        <Text style={s.count}>{items.length} งาน</Text>
      </View>
      <FlatList data={items} keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding:16, gap:10, paddingBottom:100 }}
        ListEmptyComponent={<Text style={s.empty}>📭 ยังไม่มีงานวันนี้</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between' }}>
              <View style={{ flex:1, marginRight:8 }}>
                <Text style={s.workTitle}>{item.workTitle}</Text>
                {item.workDetail ? <Text style={s.detail} numberOfLines={2}>{item.workDetail}</Text> : null}
              </View>
              <View style={{ flexDirection:'row', gap:5 }}>
                {item.status !== 'DONE' && (
                  <TouchableOpacity onPress={() => markDone(item.id)} style={[s.btn, { borderColor:Colors.success }]}>
                    <Ionicons name="checkmark" size={14} color={Colors.success} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => { setEditing(item); setIsEdit(true); setModal(true) }} style={s.btn}>
                  <Ionicons name="pencil-outline" size={14} color={Colors.primaryLight} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item.id)} style={[s.btn, { borderColor:Colors.danger }]}>
                  <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection:'row', gap:6, marginTop:8, flexWrap:'wrap' }}>
              <Text style={[s.badge, { borderColor:PRIORITY_COLORS[item.priority], color:PRIORITY_COLORS[item.priority] }]}>{PRIORITY_LABELS[item.priority]}</Text>
              <Text style={[s.badge, { borderColor:STATUS_COLORS[item.status], color:STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
              <Text style={s.catBadge}>{item.workCategory}</Text>
              {item.assignedUser ? <Text style={s.assignee}>👤 {item.assignedUser}</Text> : null}
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
            <Text style={s.modalTitle}>{isEdit ? '✏️ แก้ไขงาน' : '➕ บันทึกงานใหม่'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={24} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding:16, gap:14 }}>
            <View>
              <Text style={s.label}>หัวข้องาน *</Text>
              <TextInput style={s.input} value={editing.workTitle||''} onChangeText={v => setEditing({...editing,workTitle:v})} placeholderTextColor={Colors.textDim} />
            </View>
            <View>
              <Text style={s.label}>รายละเอียด</Text>
              <TextInput style={[s.input,{height:80,textAlignVertical:'top'}]} value={editing.workDetail||''} onChangeText={v => setEditing({...editing,workDetail:v})} multiline placeholderTextColor={Colors.textDim} />
            </View>
            <View>
              <Text style={s.label}>ผู้รับผิดชอบ</Text>
              <TextInput style={s.input} value={editing.assignedUser||''} onChangeText={v => setEditing({...editing,assignedUser:v})} placeholderTextColor={Colors.textDim} />
            </View>
            <View>
              <Text style={s.label}>หมวดหมู่</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:4 }}>
                <View style={{ flexDirection:'row', gap:6 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} onPress={() => setEditing({...editing,workCategory:c})}
                      style={[s.chip, editing.workCategory===c && { borderColor:Colors.primary, backgroundColor:Colors.primary+'20' }]}>
                      <Text style={{ color:editing.workCategory===c?Colors.primaryLight:Colors.textMuted, fontSize:12, fontWeight:'600' }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View>
              <Text style={s.label}>ความสำคัญ</Text>
              <View style={{ flexDirection:'row', gap:8, flexWrap:'wrap' }}>
                {['LOW','MEDIUM','HIGH','URGENT'].map(p => (
                  <TouchableOpacity key={p} onPress={() => setEditing({...editing,priority:p})}
                    style={[s.chip, editing.priority===p && { borderColor:PRIORITY_COLORS[p], backgroundColor:`${PRIORITY_COLORS[p]}15` }]}>
                    <Text style={{ color:editing.priority===p?PRIORITY_COLORS[p]:Colors.textMuted, fontSize:12, fontWeight:'600' }}>{PRIORITY_LABELS[p]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text style={s.label}>สถานะ</Text>
              <View style={{ flexDirection:'row', gap:8, flexWrap:'wrap' }}>
                {['TODO','IN_PROGRESS','DONE','CANCELLED'].map(st => (
                  <TouchableOpacity key={st} onPress={() => setEditing({...editing,status:st})}
                    style={[s.chip, editing.status===st && { borderColor:STATUS_COLORS[st], backgroundColor:`${STATUS_COLORS[st]}15` }]}>
                    <Text style={{ color:editing.status===st?STATUS_COLORS[st]:Colors.textMuted, fontSize:12, fontWeight:'600' }}>{STATUS_LABELS[st]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  workTitle:{fontSize:15,fontWeight:'700',color:'white',marginBottom:3},
  detail:{fontSize:12,color:Colors.textMuted,marginBottom:4},
  btn:{borderWidth:1,borderColor:Colors.primaryLight,borderRadius:6,padding:5},
  badge:{fontSize:11,borderWidth:1,borderRadius:99,paddingHorizontal:8,paddingVertical:2,fontWeight:'600'},
  catBadge:{fontSize:11,backgroundColor:Colors.border,borderRadius:99,paddingHorizontal:8,paddingVertical:2,color:Colors.textMuted},
  assignee:{fontSize:11,color:Colors.textDim,alignSelf:'center'},
  fab:{position:'absolute',right:20,bottom:24,width:56,height:56,borderRadius:28,backgroundColor:Colors.primary,alignItems:'center',justifyContent:'center',elevation:8},
  modal:{flex:1,backgroundColor:Colors.bg}, modalHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingTop:50,borderBottomWidth:1,borderBottomColor:Colors.border},
  modalTitle:{fontSize:18,fontWeight:'800',color:'white'},
  label:{fontSize:13,color:Colors.textMuted,fontWeight:'600',marginBottom:6},
  input:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.border,borderRadius:8,padding:12,color:Colors.text,fontSize:14},
  chip:{borderWidth:1,borderColor:Colors.border,borderRadius:8,paddingHorizontal:12,paddingVertical:8},
  foot:{padding:16,borderTopWidth:1,borderTopColor:Colors.border},
  saveBtn:{backgroundColor:Colors.primary,borderRadius:10,padding:15,alignItems:'center'},
  saveTxt:{color:'white',fontWeight:'700',fontSize:15},
})

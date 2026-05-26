'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'

interface LogItem { id: string; workTitle: string; workDetail?: string; workCategory: string; priority: string; status: string; assignedUser?: string; workDate: string; workTime?: string; createdAt: string; updatedAt: string }
const EMPTY: Partial<LogItem> = { workTitle:'', workDetail:'', workCategory:'ทั่วไป', priority:'MEDIUM', status:'TODO', assignedUser:'', workTime:'' }

const CATEGORIES = ['ทั่วไป','ถ่ายรูป','ลงขาย','แพ็คสินค้า','จัดส่ง','ติดต่อลูกค้า','รับสินค้า','อื่นๆ']

export default function DailyLogsPage() {
  const [items, setItems] = useState<LogItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<LogItem>>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [filter, setFilter] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('tns-token')
    const q = new URLSearchParams()
    if (filter) q.set('status', filter)
    const res = await fetch(`/api/daily-logs?${q}`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) { setItems(d.data.items); setTotal(d.data.total) }
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  async function save() {
    const token = localStorage.getItem('tns-token')
    const url = isEdit ? `/api/daily-logs/${editing.id}` : '/api/daily-logs'
    const method = isEdit ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(editing) })
    setModal(false); setEditing(EMPTY); fetchData()
  }

  async function remove(id: string) {
    if (!confirm('ยืนยันการลบ?')) return
    const token = localStorage.getItem('tns-token')
    await fetch(`/api/daily-logs/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    fetchData()
  }

  async function updateStatus(id: string, status: string) {
    const token = localStorage.getItem('tns-token')
    await fetch(`/api/daily-logs/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ status }) })
    fetchData()
  }

  return (
    <AppShell>
      <Header title="📝 บันทึกงานประจำวัน" subtitle={`ทั้งหมด ${total} งาน`} />
      <div style={{padding:'24px',flex:1}}>
        <div style={{display:'flex',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}>
            <option value="">ทุกสถานะ</option>
            <option value="TODO">รอทำ</option>
            <option value="IN_PROGRESS">กำลังทำ</option>
            <option value="DONE">เสร็จ</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>
          <button onClick={() => { setEditing({...EMPTY, workDate: new Date().toISOString().split('T')[0]}); setIsEdit(false); setModal(true) }}
            style={{marginLeft:'auto',padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',cursor:'pointer',fontWeight:'600'}}>
            + บันทึกงาน
          </button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {loading ? <div style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>⏳ กำลังโหลด...</div>
          : items.length === 0 ? <div style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>📭 ไม่มีข้อมูล</div>
          : items.map(item => (
            <div key={item.id} style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',padding:'16px 20px',display:'flex',alignItems:'flex-start',gap:'16px'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px',flexWrap:'wrap'}}>
                  <span style={{fontWeight:'700',color:'white',fontSize:'15px'}}>{item.workTitle}</span>
                  <PriorityBadge priority={item.priority} />
                  <StatusBadge status={item.status} />
                  <span style={{fontSize:'12px',padding:'3px 8px',borderRadius:'999px',background:'rgba(148,163,184,0.1)',color:'#94a3b8'}}>{item.workCategory}</span>
                </div>
                {item.workDetail && <p style={{color:'#94a3b8',fontSize:'13px',margin:'0 0 8px',whiteSpace:'pre-wrap'}}>{item.workDetail}</p>}
                <div style={{display:'flex',gap:'16px',fontSize:'12px',color:'#4a5568'}}>
                  {item.assignedUser && <span>👤 {item.assignedUser}</span>}
                  <span>📅 {new Date(item.workDate).toLocaleDateString('th-TH')}</span>
                  {item.workTime && <span>🕐 {item.workTime}</span>}
                  {item.updatedAt && item.createdAt && new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 5000 && (
                    <span style={{color:'#6366f1'}}>✏️ แก้ไขล่าสุด {new Date(item.updatedAt).toLocaleString('th-TH', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
                  )}
                </div>
              </div>
              <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                {item.status !== 'DONE' && (
                  <button onClick={() => updateStatus(item.id, 'DONE')} title="เสร็จแล้ว"
                    style={{padding:'6px 10px',borderRadius:'6px',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',color:'#4ade80',cursor:'pointer',fontSize:'13px'}}>✅</button>
                )}
                <button onClick={() => { setEditing(item); setIsEdit(true); setModal(true) }}
                  style={{padding:'6px 10px',borderRadius:'6px',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#818cf8',cursor:'pointer',fontSize:'13px'}}>✏️</button>
                <button onClick={() => remove(item.id)}
                  style={{padding:'6px 10px',borderRadius:'6px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',cursor:'pointer',fontSize:'13px'}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={isEdit ? '✏️ แก้ไขงาน' : '➕ บันทึกงานใหม่'}>
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <div>
            <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>หัวข้องาน *</label>
            <input type="text" value={editing.workTitle || ''} onChange={e => setEditing({...editing, workTitle: e.target.value})}
              style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>รายละเอียด</label>
            <textarea value={editing.workDetail || ''} onChange={e => setEditing({...editing, workDetail: e.target.value})} rows={3}
              style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none',resize:'vertical'}} />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div>
              <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>หมวดหมู่</label>
              <select value={editing.workCategory || 'ทั่วไป'} onChange={e => setEditing({...editing, workCategory: e.target.value})}
                style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>ความสำคัญ</label>
              <select value={editing.priority || 'MEDIUM'} onChange={e => setEditing({...editing, priority: e.target.value})}
                style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
                <option value="LOW">🟢 ต่ำ</option>
                <option value="MEDIUM">🟡 กลาง</option>
                <option value="HIGH">🟠 สูง</option>
                <option value="URGENT">🔴 เร่งด่วน</option>
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>สถานะ</label>
              <select value={editing.status || 'TODO'} onChange={e => setEditing({...editing, status: e.target.value})}
                style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
                <option value="TODO">📋 รอทำ</option>
                <option value="IN_PROGRESS">🔄 กำลังทำ</option>
                <option value="DONE">✅ เสร็จ</option>
                <option value="CANCELLED">❌ ยกเลิก</option>
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>ผู้รับผิดชอบ</label>
              <input type="text" value={editing.assignedUser || ''} onChange={e => setEditing({...editing, assignedUser: e.target.value})}
                style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}} />
            </div>
          </div>
          <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
            <button onClick={() => setModal(false)} style={{flex:1,padding:'10px',borderRadius:'8px',background:'rgba(148,163,184,0.1)',border:'1px solid #2d3154',color:'#94a3b8',cursor:'pointer'}}>ยกเลิก</button>
            <button onClick={save} style={{flex:1,padding:'10px',borderRadius:'8px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',cursor:'pointer',fontWeight:'600'}}>
              {isEdit ? '💾 บันทึก' : '➕ เพิ่ม'}
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}

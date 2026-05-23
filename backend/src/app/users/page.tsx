'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'

interface UserItem { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string }
const EMPTY = { name:'', email:'', password:'', role:'STAFF', isActive: true }

export default function UsersPage() {
  const [items, setItems] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<typeof EMPTY>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('tns-token')
    const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) setItems(d.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function save() {
    const token = localStorage.getItem('tns-token')
    const url = isEdit ? `/api/users/${editId}` : '/api/users'
    const method = isEdit ? 'PUT' : 'POST'
    const body: Record<string,unknown> = { name: editing.name, role: editing.role }
    if (!isEdit) { body.email = editing.email; body.password = editing.password }
    if (isEdit && editing.password) body.password = editing.password
    await fetch(url, { method, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body) })
    setModal(false); setEditing(EMPTY); fetchData()
  }

  async function toggleActive(id: string, current: boolean) {
    const token = localStorage.getItem('tns-token')
    await fetch(`/api/users/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ isActive: !current }) })
    fetchData()
  }

  return (
    <AppShell>
      <Header title="👥 จัดการผู้ใช้งาน" subtitle={`ทั้งหมด ${items.length} บัญชี`} />
      <div style={{padding:'24px',flex:1}}>
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'20px'}}>
          <button onClick={() => { setEditing(EMPTY); setIsEdit(false); setModal(true) }}
            style={{padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',cursor:'pointer',fontWeight:'600'}}>
            + เพิ่มผู้ใช้
          </button>
        </div>
        <div style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
            <thead><tr style={{background:'#0f1117'}}>
              {['ชื่อ','อีเมล','บทบาท','สถานะ','วันที่สร้าง','จัดการ'].map(h => (
                <th key={h} style={{padding:'12px 16px',textAlign:'left',color:'#6366f1',fontWeight:'600',fontSize:'12px',textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>⏳ กำลังโหลด...</td></tr>
              : items.map(user => (
                <tr key={user.id} style={{borderTop:'1px solid #2d3154'}}>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'13px',fontWeight:'600',flexShrink:0}}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{color:'white',fontWeight:'500'}}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{padding:'12px 16px',color:'#94a3b8'}}>{user.email}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{padding:'3px 10px',borderRadius:'999px',fontSize:'12px',fontWeight:'600',background:user.role==='ADMIN'?'rgba(245,158,11,0.1)':'rgba(99,102,241,0.1)',color:user.role==='ADMIN'?'#f59e0b':'#818cf8'}}>
                      {user.role === 'ADMIN' ? '👑 Admin' : '👤 Staff'}
                    </span>
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{padding:'3px 10px',borderRadius:'999px',fontSize:'12px',fontWeight:'600',background:user.isActive?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',color:user.isActive?'#4ade80':'#f87171'}}>
                      {user.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td style={{padding:'12px 16px',color:'#94a3b8',fontSize:'12px'}}>{new Date(user.createdAt).toLocaleDateString('th-TH')}</td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={() => { setEditing({name:user.name,email:user.email,password:'',role:user.role,isActive:user.isActive}); setEditId(user.id); setIsEdit(true); setModal(true) }}
                        style={{padding:'5px 10px',borderRadius:'6px',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)',color:'#818cf8',cursor:'pointer',fontSize:'12px'}}>✏️</button>
                      <button onClick={() => toggleActive(user.id, user.isActive)}
                        style={{padding:'5px 10px',borderRadius:'6px',background:user.isActive?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)',border:user.isActive?'1px solid rgba(239,68,68,0.2)':'1px solid rgba(34,197,94,0.2)',color:user.isActive?'#f87171':'#4ade80',cursor:'pointer',fontSize:'12px'}}>
                        {user.isActive ? '🔒' : '🔓'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={isEdit ? '✏️ แก้ไขผู้ใช้' : '➕ เพิ่มผู้ใช้ใหม่'}>
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {[
            { label:'ชื่อ *', key:'name', type:'text' },
            ...(!isEdit ? [{ label:'อีเมล *', key:'email', type:'email' }] : []),
            { label: isEdit ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน *', key:'password', type:'password' },
          ].map(f => (
            <div key={f.key}>
              <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>{f.label}</label>
              <input type={f.type} value={editing[f.key as keyof typeof editing] as string || ''}
                onChange={e => setEditing({...editing, [f.key]: e.target.value})}
                style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}} />
            </div>
          ))}
          <div>
            <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>บทบาท</label>
            <select value={editing.role} onChange={e => setEditing({...editing, role: e.target.value})}
              style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
              <option value="STAFF">👤 Staff</option>
              <option value="ADMIN">👑 Admin</option>
            </select>
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

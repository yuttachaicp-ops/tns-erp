'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface PhotoItem { id: string; productName: string; sku?: string; category?: string; quantity: number; status: string; note?: string; createdAt: string; user?: { name: string } }

const EMPTY: Partial<PhotoItem> = { productName:'', sku:'', category:'', quantity:1, status:'PENDING', note:'' }

export default function PhotoQueuePage() {
  const [items, setItems] = useState<PhotoItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<PhotoItem>>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('tns-token')
    const q = new URLSearchParams()
    if (filter) q.set('status', filter)
    if (search) q.set('search', search)
    const res = await fetch(`/api/photo-queue?${q}`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) { setItems(d.data.items); setTotal(d.data.total) }
    setLoading(false)
  }, [filter, search])

  useEffect(() => { fetchData() }, [fetchData])

  async function save() {
    const token = localStorage.getItem('tns-token')
    const url = isEdit ? `/api/photo-queue/${editing.id}` : '/api/photo-queue'
    const method = isEdit ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(editing) })
    setModal(false); setEditing(EMPTY); fetchData()
  }

  async function remove(id: string) {
    if (!confirm('ยืนยันการลบ?')) return
    const token = localStorage.getItem('tns-token')
    await fetch(`/api/photo-queue/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    fetchData()
  }

  function openEdit(item: PhotoItem) { setEditing(item); setIsEdit(true); setModal(true) }
  function openNew() { setEditing(EMPTY); setIsEdit(false); setModal(true) }

  return (
    <AppShell>
      <Header title="📷 สินค้ารอถ่ายรูป" subtitle={`ทั้งหมด ${total} รายการ`} />
      <div style={{padding:'24px',flex:1}}>
        {/* Toolbar */}
        <div style={{display:'flex',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหาสินค้า..."
            style={{flex:1,minWidth:'200px',padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}} />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}>
            <option value="">ทุกสถานะ</option>
            <option value="PENDING">รอดำเนินการ</option>
            <option value="IN_PROGRESS">กำลังทำ</option>
            <option value="COMPLETED">เสร็จสิ้น</option>
          </select>
          <button onClick={openNew}
            style={{padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'14px'}}>
            + เพิ่มสินค้า
          </button>
        </div>

        {/* Table */}
        <div style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
            <thead><tr style={{background:'#0f1117'}}>
              {['ชื่อสินค้า','SKU','หมวดหมู่','จำนวน','สถานะ','วันที่รับ','โดย','จัดการ'].map(h => (
                <th key={h} style={{padding:'12px 16px',textAlign:'left',color:'#6366f1',fontWeight:'600',fontSize:'12px',textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>⏳ กำลังโหลด...</td></tr>
              : items.length === 0 ? <tr><td colSpan={8} style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>📭 ไม่มีข้อมูล</td></tr>
              : items.map(item => (
                <tr key={item.id} style={{borderTop:'1px solid #2d3154'}}>
                  <td style={{padding:'12px 16px',color:'white',fontWeight:'500'}}>{item.productName}</td>
                  <td style={{padding:'12px 16px',color:'#94a3b8'}}>{item.sku || '-'}</td>
                  <td style={{padding:'12px 16px',color:'#94a3b8'}}>{item.category || '-'}</td>
                  <td style={{padding:'12px 16px',color:'#e2e8f0'}}>{item.quantity}</td>
                  <td style={{padding:'12px 16px'}}><StatusBadge status={item.status} /></td>
                  <td style={{padding:'12px 16px',color:'#94a3b8',fontSize:'12px'}}>{new Date(item.createdAt).toLocaleDateString('th-TH')}</td>
                  <td style={{padding:'12px 16px',color:'#94a3b8',fontSize:'12px'}}>{item.user?.name || '-'}</td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={() => openEdit(item)} style={{padding:'5px 10px',borderRadius:'6px',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)',color:'#818cf8',cursor:'pointer',fontSize:'12px'}}>✏️</button>
                      <button onClick={() => remove(item.id)} style={{padding:'5px 10px',borderRadius:'6px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',cursor:'pointer',fontSize:'12px'}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={isEdit ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้า'}>
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {[
            { label:'ชื่อสินค้า *', key:'productName', type:'text', placeholder:'กรอกชื่อสินค้า' },
            { label:'SKU', key:'sku', type:'text', placeholder:'รหัสสินค้า' },
            { label:'หมวดหมู่', key:'category', type:'text', placeholder:'หมวดหมู่สินค้า' },
            { label:'จำนวน', key:'quantity', type:'number', placeholder:'1' },
            { label:'หมายเหตุ', key:'note', type:'text', placeholder:'หมายเหตุเพิ่มเติม' },
          ].map(f => (
            <div key={f.key}>
              <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder}
                value={String(editing[f.key as keyof PhotoItem] || '')}
                onChange={e => setEditing({...editing, [f.key]: f.type==='number' ? parseInt(e.target.value)||1 : e.target.value})}
                style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}} />
            </div>
          ))}
          <div>
            <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>สถานะ</label>
            <select value={editing.status || 'PENDING'} onChange={e => setEditing({...editing, status: e.target.value})}
              style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="IN_PROGRESS">กำลังทำ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
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

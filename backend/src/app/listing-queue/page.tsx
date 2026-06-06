'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { StatusBadge, PlatformBadge } from '@/components/ui/StatusBadge'

interface ListItem {
  id: string
  productName: string
  sku?: string
  platform: string
  quantity: number
  status: string
  assignedTo?: string
  note?: string
  image?: string
  createdAt: string
}
const EMPTY: Partial<ListItem> = { productName:'', sku:'', platform:'SHOPEE', quantity:1, status:'PENDING', assignedTo:'', note:'', image:'' }

// Resize image via canvas → base64 JPEG max 800px
function resizeImage(file: File, maxW = 800, maxH = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let w = img.naturalWidth
      let h = img.naturalHeight
      const ratio = Math.min(maxW / w, maxH / h, 1)
      w = Math.round(w * ratio)
      h = Math.round(h * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ListingQueuePage() {
  const [items, setItems] = useState<ListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<ListItem>>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [filter, setFilter] = useState('')
  const [platform, setPlatform] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [previewModal, setPreviewModal] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('tns-token')
    const q = new URLSearchParams()
    if (filter) q.set('status', filter)
    if (platform) q.set('platform', platform)
    const res = await fetch(`/api/listing-queue?${q}`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) { setItems(d.data.items); setTotal(d.data.total) }
    setLoading(false)
  }, [filter, platform])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleImageFile(file: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น'); return }
    if (file.size > 15 * 1024 * 1024) { alert('ไฟล์ใหญ่เกิน 15MB'); return }
    setImageUploading(true)
    try {
      const base64 = await resizeImage(file)
      setEditing(prev => ({ ...prev, image: base64 }))
    } catch {
      alert('ไม่สามารถโหลดรูปได้')
    } finally {
      setImageUploading(false)
    }
  }

  async function save() {
    const token = localStorage.getItem('tns-token')
    const url = isEdit ? `/api/listing-queue/${editing.id}` : '/api/listing-queue'
    const method = isEdit ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(editing) })
    setModal(false); setEditing(EMPTY); fetchData()
  }

  async function remove(id: string) {
    if (!confirm('ยืนยันการลบ?')) return
    const token = localStorage.getItem('tns-token')
    await fetch(`/api/listing-queue/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    fetchData()
  }

  function openEdit(item: ListItem) {
    setEditing(item); setIsEdit(true); setModal(true)
  }
  function openAdd() {
    setEditing(EMPTY); setIsEdit(false); setModal(true)
  }

  return (
    <AppShell>
      <Header title="🛒 สินค้ายังไม่ได้ลงขาย" subtitle={`ทั้งหมด ${total} รายการ`} />
      <div style={{padding:'24px',flex:1}}>
        {/* Filters */}
        <div style={{display:'flex',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
          <select value={platform} onChange={e => setPlatform(e.target.value)}
            style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}>
            <option value="">ทุก Platform</option>
            <option value="SHOPEE">Shopee</option>
            <option value="LAZADA">Lazada</option>
            <option value="TIKTOK_SHOP">TikTok Shop</option>
            <option value="WEBSITE">Website</option>
          </select>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}>
            <option value="">ทุกสถานะ</option>
            <option value="PENDING">รอดำเนินการ</option>
            <option value="IN_PROGRESS">กำลังทำ</option>
            <option value="COMPLETED">เสร็จสิ้น</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>
          <button onClick={openAdd}
            style={{marginLeft:'auto',padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',cursor:'pointer',fontWeight:'600'}}>
            + เพิ่มสินค้า
          </button>
        </div>

        {/* Table */}
        <div style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',overflow:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px',minWidth:'700px'}}>
            <thead><tr style={{background:'#0f1117'}}>
              {['รูป','ชื่อสินค้า','SKU','Platform','จำนวน','สถานะ','ผู้รับผิดชอบ','วันที่','จัดการ'].map(h => (
                <th key={h} style={{padding:'12px 14px',textAlign:'left',color:'#6366f1',fontWeight:'600',fontSize:'12px',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={9} style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>⏳ กำลังโหลด...</td></tr>
                : items.length === 0
                  ? <tr><td colSpan={9} style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>📭 ไม่มีข้อมูล</td></tr>
                  : items.map(item => (
                    <tr key={item.id} style={{borderTop:'1px solid #2d3154'}}>
                      {/* Image thumbnail */}
                      <td style={{padding:'8px 14px'}}>
                        {item.image
                          ? <div
                              onClick={() => setPreviewModal(item.image!)}
                              style={{width:52,height:52,borderRadius:8,overflow:'hidden',border:'1px solid #2d3154',cursor:'pointer',flexShrink:0,background:'#0f1117'}}>
                              <img src={item.image} alt={item.productName}
                                style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block'}} />
                            </div>
                          : <div style={{width:52,height:52,borderRadius:8,border:'1px dashed #2d3154',display:'flex',alignItems:'center',justifyContent:'center',color:'#3a4060',fontSize:20}}>
                              📦
                            </div>
                        }
                      </td>
                      <td style={{padding:'12px 14px',color:'white',fontWeight:'500'}}>{item.productName}</td>
                      <td style={{padding:'12px 14px',color:'#94a3b8'}}>{item.sku || '-'}</td>
                      <td style={{padding:'12px 14px'}}><PlatformBadge platform={item.platform} /></td>
                      <td style={{padding:'12px 14px',color:'#e2e8f0'}}>{item.quantity}</td>
                      <td style={{padding:'12px 14px'}}><StatusBadge status={item.status} /></td>
                      <td style={{padding:'12px 14px',color:'#94a3b8'}}>{item.assignedTo || '-'}</td>
                      <td style={{padding:'12px 14px',color:'#94a3b8',fontSize:'12px',whiteSpace:'nowrap'}}>{new Date(item.createdAt).toLocaleDateString('th-TH')}</td>
                      <td style={{padding:'12px 14px'}}>
                        <div style={{display:'flex',gap:'6px'}}>
                          <button onClick={() => openEdit(item)} style={{padding:'5px 10px',borderRadius:'6px',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)',color:'#818cf8',cursor:'pointer',fontSize:'12px'}}>✏️</button>
                          <button onClick={() => remove(item.id)} style={{padding:'5px 10px',borderRadius:'6px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',cursor:'pointer',fontSize:'12px'}}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(EMPTY) }} title={isEdit ? '✏️ แก้ไขรายการ' : '➕ เพิ่มสินค้าลงขาย'}>
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>

          {/* Image Upload */}
          <div>
            <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'8px'}}>รูปสินค้า (JPG/PNG)</label>
            {editing.image ? (
              <div style={{position:'relative',display:'inline-block'}}>
                <div style={{width:'100%',maxWidth:280,height:180,borderRadius:10,overflow:'hidden',border:'1px solid #2d3154',background:'#0f1117',margin:'0 auto',display:'block'}}>
                  <img src={editing.image} alt="preview"
                    style={{width:'100%',height:'100%',objectFit:'contain',objectPosition:'center',display:'block'}} />
                </div>
                <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                  <button type="button"
                    onClick={() => { fileRef.current?.click() }}
                    style={{flex:1,padding:'8px',borderRadius:'8px',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)',color:'#818cf8',cursor:'pointer',fontSize:'13px'}}>
                    🔄 เปลี่ยนรูป
                  </button>
                  <button type="button"
                    onClick={() => setEditing(prev => ({ ...prev, image: '' }))}
                    style={{flex:1,padding:'8px',borderRadius:'8px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',cursor:'pointer',fontSize:'13px'}}>
                    🗑️ ลบรูป
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                style={{width:'100%',height:140,border:'2px dashed #2d3154',borderRadius:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer',background:'#0f1117',transition:'border-color 0.2s'}}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2d3154')}>
                {imageUploading
                  ? <><span style={{fontSize:28}}>⏳</span><span style={{color:'#6366f1',fontSize:13}}>กำลังโหลดรูป...</span></>
                  : <><span style={{fontSize:32}}>📷</span><span style={{color:'#64748b',fontSize:13}}>คลิกเพื่อเลือกรูปสินค้า</span><span style={{color:'#3a4060',fontSize:11}}>รองรับ JPG, PNG — resize อัตโนมัติ</span></>
                }
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{display:'none'}}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = '' }}
            />
          </div>

          {/* Text fields */}
          {[
            { label:'ชื่อสินค้า *', key:'productName', type:'text' },
            { label:'SKU', key:'sku', type:'text' },
            { label:'จำนวน', key:'quantity', type:'number' },
            { label:'ผู้รับผิดชอบ', key:'assignedTo', type:'text' },
            { label:'หมายเหตุ', key:'note', type:'text' },
          ].map(f => (
            <div key={f.key}>
              <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>{f.label}</label>
              <input type={f.type} value={String(editing[f.key as keyof ListItem] || '')}
                onChange={e => setEditing({...editing, [f.key]: f.type==='number' ? parseInt(e.target.value)||1 : e.target.value})}
                style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none',boxSizing:'border-box'}} />
            </div>
          ))}

          <div>
            <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>Platform *</label>
            <select value={editing.platform || 'SHOPEE'} onChange={e => setEditing({...editing, platform: e.target.value})}
              style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
              <option value="SHOPEE">Shopee</option>
              <option value="LAZADA">Lazada</option>
              <option value="TIKTOK_SHOP">TikTok Shop</option>
              <option value="WEBSITE">Website</option>
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>สถานะ</label>
            <select value={editing.status || 'PENDING'} onChange={e => setEditing({...editing, status: e.target.value})}
              style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="IN_PROGRESS">กำลังทำ</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
          </div>

          <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
            <button onClick={() => { setModal(false); setEditing(EMPTY) }} style={{flex:1,padding:'10px',borderRadius:'8px',background:'rgba(148,163,184,0.1)',border:'1px solid #2d3154',color:'#94a3b8',cursor:'pointer'}}>ยกเลิก</button>
            <button onClick={save} disabled={imageUploading} style={{flex:1,padding:'10px',borderRadius:'8px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',cursor:imageUploading?'not-allowed':'pointer',fontWeight:'600',opacity:imageUploading?0.6:1}}>
              {isEdit ? '💾 บันทึก' : '➕ เพิ่ม'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Image Preview Modal (full size) */}
      {previewModal && (
        <div
          onClick={() => setPreviewModal(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{position:'relative',maxWidth:'90vw',maxHeight:'90vh'}}>
            <img src={previewModal} alt="preview"
              style={{maxWidth:'100%',maxHeight:'85vh',borderRadius:12,objectFit:'contain',display:'block',boxShadow:'0 0 40px rgba(99,102,241,0.4)'}} />
            <button
              onClick={() => setPreviewModal(null)}
              style={{position:'absolute',top:-12,right:-12,width:32,height:32,borderRadius:'50%',background:'#1a1d2e',border:'1px solid #2d3154',color:'#94a3b8',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
              ✕
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}

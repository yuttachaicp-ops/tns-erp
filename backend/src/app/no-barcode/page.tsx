'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'

interface NoBarcodeItem {
  id: string
  productName: string
  description?: string
  category?: string
  quantity: number
  sku?: string
  image?: string
  status: string
  note?: string
  createdAt: string
  user?: { name: string }
}

const EMPTY: Partial<NoBarcodeItem> = {
  productName: '', description: '', category: '', quantity: 1,
  sku: '', image: '', status: 'NO_BARCODE', note: '',
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  NO_BARCODE:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', label: '❌ ไม่มีบาร์โค้ดในระบบ' },
  HAS_BARCODE: { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', label: '✅ มีบาร์โค้ด' },
  NEW_BARCODE: { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', label: '🆕 บาร์โค้ดใหม่' },
}

const CATEGORIES = [
  'สายไฟ, สายสัญญาณ',
  'อุปกรณ์และเครื่องมือ LAN, CCTV, TEL',
  'สวิตช์, ปลั๊ก, หน้ากาก, บ็อกซ์อลอย',
  'เบรกเกอร์, มิเตอร์ไฟฟ้า, ตู้ควบคุม',
  'ฟิวส์, เซฟตี้สวิตช์, สวิตช์ตัดตอน',
  'แมกเนติก, อุปกรณ์ควบคุมมอเตอร์',
  'หม้อแปลง, สวิตชิ่ง, UPS',
  'อุปกรณ์คอนโทรลอุตสาหกรรม',
  'เครื่องใช้ไฟฟ้า, พัดลม, ปั๊มน้ำ, เครื่องทำน้ำอุ่น',
  'เครื่องมือวัด, เครื่องมือช่าง, อุปกรณ์เซฟตี้',
  'ปลั๊ก, อุปกรณ์จัดการสายไฟ, หางปลา, เทอร์มินอล',
  'หลอดไฟ, โคมไฟ, อุปกรณ์แสงสว่าง',
  'ระบบกราวด์, ระบบบ่อฟ้า',
  'ไฟฉุกเฉิน, ป้ายทางออก',
  'ระบบแจ้งเหตุเพลิงไหม้',
  'แรคไฟฟ้า, อุปกรณ์เดินสายแบบหนัก',
  'ท่อร้อยสายไฟ, อุปกรณ์ติดตั้ง Pipe, Fitting',
  'รางเดินสายไฟ Cable Trunking',
  'บ็อกซ์พักสาย Junction Box',
  'ตู้เหล็ก, ตู้พลาสติก, แผงไฟ',
  'อุปกรณ์ก่อสร้าง Screw, Nut, Bolt',
  'โซลาร์เซลล์และอุปกรณ์',
  'มอเตอร์',
  'อื่นๆ',
]

function resizeImage(file: File, maxW = 800, maxH = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight
      const ratio = Math.min(maxW / w, maxH / h, 1)
      w = Math.round(w * ratio); h = Math.round(h * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { bg: 'rgba(100,100,100,0.1)', color: '#888', label: status }
  return (
    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

export default function NoBarcodeePage() {
  const [items, setItems] = useState<NoBarcodeItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Partial<NoBarcodeItem>>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [previewModal, setPreviewModal] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Stats counts
  const noBarcode  = items.filter(i => i.status === 'NO_BARCODE').length
  const hasBarcode = items.filter(i => i.status === 'HAS_BARCODE').length
  const newBarcode = items.filter(i => i.status === 'NEW_BARCODE').length

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('tns-token')
    const q = new URLSearchParams()
    if (filterStatus)   q.set('status', filterStatus)
    if (filterCategory) q.set('category', filterCategory)
    if (search)         q.set('search', search)
    const res = await fetch(`/api/no-barcode?${q}&limit=100`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await res.json()
    if (d.success) { setItems(d.data.items); setTotal(d.data.total) }
    setLoading(false)
  }, [filterStatus, filterCategory, search])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) { alert('กรุณาเลือกไฟล์รูปภาพ'); return }
    if (file.size > 15 * 1024 * 1024) { alert('ไฟล์ใหญ่เกิน 15MB'); return }
    setImageUploading(true)
    try {
      const b64 = await resizeImage(file)
      setEditing(prev => ({ ...prev, image: b64 }))
    } catch { alert('ไม่สามารถโหลดรูปได้') }
    finally { setImageUploading(false) }
  }

  async function save() {
    const token = localStorage.getItem('tns-token')
    const url    = isEdit ? `/api/no-barcode/${editing.id}` : '/api/no-barcode'
    const method = isEdit ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(editing) })
    setModal(false); setEditing(EMPTY); fetchData()
  }

  async function quickStatus(id: string, status: string) {
    const token = localStorage.getItem('tns-token')
    await fetch(`/api/no-barcode/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) })
    fetchData()
  }

  async function remove(id: string) {
    if (!confirm('ยืนยันการลบ?')) return
    const token = localStorage.getItem('tns-token')
    await fetch(`/api/no-barcode/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchData()
  }

  const card = (label: string, count: number, color: string, bg: string) => (
    <div style={{ flex: 1, minWidth: 110, background: bg, border: `1px solid ${color}30`, borderRadius: 12, padding: '14px 18px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  )

  return (
    <AppShell>
      <Header title="🏷️ สินค้าไม่มีบาร์โค้ด" subtitle={`ทั้งหมด ${total} รายการ`} />
      <div style={{ padding: '24px', flex: 1 }}>

        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {card('ไม่มีบาร์โค้ดในระบบ', noBarcode,  '#f87171', 'rgba(239,68,68,0.07)')}
          {card('มีบาร์โค้ด',          hasBarcode, '#4ade80', 'rgba(34,197,94,0.07)')}
          {card('บาร์โค้ดใหม่',        newBarcode, '#818cf8', 'rgba(99,102,241,0.07)')}
          <div style={{ flex: 1, minWidth: 110, background: 'rgba(148,163,184,0.07)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#94a3b8' }}>{total}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>ทั้งหมด</div>
          </div>
        </div>

        {/* Filters + Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 ค้นหาชื่อสินค้า, SKU..."
            style={{ flex: 1, minWidth: 180, padding: '10px 14px', borderRadius: 10, background: '#1a1d2e', border: '1px solid #2d3154', color: 'white', outline: 'none', fontSize: 14 }}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, background: '#1a1d2e', border: '1px solid #2d3154', color: 'white', outline: 'none' }}>
            <option value="">ทุกสถานะ</option>
            <option value="NO_BARCODE">ไม่มีบาร์โค้ดในระบบ</option>
            <option value="HAS_BARCODE">มีบาร์โค้ด</option>
            <option value="NEW_BARCODE">บาร์โค้ดใหม่</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, background: '#1a1d2e', border: '1px solid #2d3154', color: 'white', outline: 'none' }}>
            <option value="">ทุกหมวดหมู่</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => { setEditing(EMPTY); setIsEdit(false); setModal(true) }}
            style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            + เพิ่มสินค้า
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#1a1d2e', borderRadius: 12, border: '1px solid #2d3154', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 750 }}>
            <thead>
              <tr style={{ background: '#0f1117' }}>
                {['รูป', 'ชื่อสินค้า', 'หมวดหมู่', 'SKU ที่กำหนด', 'จำนวน', 'สถานะ', 'หมายเหตุ', 'จัดการ'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#6366f1', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#4a5568' }}>⏳ กำลังโหลด...</td></tr>
                : items.length === 0
                  ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#4a5568' }}>📭 ยังไม่มีสินค้า</td></tr>
                  : items.map(item => (
                    <tr key={item.id} style={{ borderTop: '1px solid #2d3154' }}>
                      {/* Image */}
                      <td style={{ padding: '8px 14px' }}>
                        {item.image
                          ? <div onClick={() => setPreviewModal(item.image!)}
                              style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', border: '1px solid #2d3154', cursor: 'pointer', background: '#0f1117', flexShrink: 0 }}>
                              <img src={item.image} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                            </div>
                          : <div style={{ width: 52, height: 52, borderRadius: 8, border: '1px dashed #2d3154', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a4060', fontSize: 20 }}>🏷️</div>
                        }
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: 'white', fontWeight: 500 }}>{item.productName}</div>
                        {item.description && <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{item.description}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: 13 }}>{item.category || <span style={{ color: '#3a4060' }}>-</span>}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {item.sku
                          ? <code style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{item.sku}</code>
                          : <span style={{ color: '#3a4060' }}>-</span>
                        }
                      </td>
                      <td style={{ padding: '12px 14px', color: '#e2e8f0', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={item.status} /></td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.note || '-'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {/* Quick status */}
                          {item.status !== 'HAS_BARCODE' && (
                            <button onClick={() => quickStatus(item.id, 'HAS_BARCODE')}
                              title="มีบาร์โค้ด"
                              style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', cursor: 'pointer', fontSize: 12 }}>✅</button>
                          )}
                          {item.status !== 'NEW_BARCODE' && (
                            <button onClick={() => quickStatus(item.id, 'NEW_BARCODE')}
                              title="บาร์โค้ดใหม่"
                              style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', cursor: 'pointer', fontSize: 12 }}>🆕</button>
                          )}
                          {item.status !== 'NO_BARCODE' && (
                            <button onClick={() => quickStatus(item.id, 'NO_BARCODE')}
                              title="ไม่มีบาร์โค้ดในระบบ"
                              style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>❌</button>
                          )}
                          <button onClick={() => { setEditing(item); setIsEdit(true); setModal(true) }}
                            style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                          <button onClick={() => remove(item.id)}
                            style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
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
      <Modal open={modal} onClose={() => { setModal(false); setEditing(EMPTY) }} title={isEdit ? '✏️ แก้ไขรายการ' : '➕ เพิ่มสินค้าไม่มีบาร์โค้ด'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Image Upload */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>รูปสินค้า (JPG/PNG)</label>
            {editing.image ? (
              <div>
                <div style={{ width: '100%', height: 170, borderRadius: 10, overflow: 'hidden', border: '1px solid #2d3154', background: '#0f1117' }}>
                  <img src={editing.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer', fontSize: 13 }}>🔄 เปลี่ยนรูป</button>
                  <button type="button" onClick={() => setEditing(p => ({ ...p, image: '' }))}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontSize: 13 }}>🗑️ ลบรูป</button>
                </div>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()}
                style={{ width: '100%', height: 130, border: '2px dashed #2d3154', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: '#0f1117' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2d3154')}>
                {imageUploading
                  ? <><span style={{ fontSize: 26 }}>⏳</span><span style={{ color: '#6366f1', fontSize: 13 }}>กำลังโหลดรูป...</span></>
                  : <><span style={{ fontSize: 30 }}>📷</span><span style={{ color: '#64748b', fontSize: 13 }}>คลิกเพื่อเลือกรูปสินค้า</span><span style={{ color: '#3a4060', fontSize: 11 }}>รองรับ JPG, PNG — resize อัตโนมัติ</span></>
                }
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = '' }} />
          </div>

          {/* ชื่อสินค้า */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>ชื่อสินค้า *</label>
            <input value={editing.productName || ''} onChange={e => setEditing(p => ({ ...p, productName: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* คำอธิบาย */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>คำอธิบาย</label>
            <input value={editing.description || ''} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
              placeholder="รายละเอียดเพิ่มเติม เช่น สี, ขนาด..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* แถว: หมวดหมู่ + จำนวน */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>หมวดหมู่</label>
              <select value={editing.category || ''} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none' }}>
                <option value="">-- เลือกหมวดหมู่ --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>จำนวน</label>
              <input type="number" min={1} value={editing.quantity || 1} onChange={e => setEditing(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* SKU ที่กำหนด */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>SKU ที่กำหนด <span style={{ color: '#4a5568', fontSize: 11 }}>(กรอกถ้ามีการกำหนด SKU แล้ว)</span></label>
            <input value={editing.sku || ''} onChange={e => setEditing(p => ({ ...p, sku: e.target.value }))}
              placeholder="เช่น TNS-001"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* สถานะ */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>สถานะ</label>
            <select value={editing.status || 'NO_BARCODE'} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none' }}>
              <option value="NO_BARCODE">❌ ไม่มีบาร์โค้ดในระบบ</option>
              <option value="HAS_BARCODE">✅ มีบาร์โค้ด</option>
              <option value="NEW_BARCODE">🆕 บาร์โค้ดใหม่</option>
            </select>
          </div>

          {/* หมายเหตุ */}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>หมายเหตุ</label>
            <textarea value={editing.note || ''} onChange={e => setEditing(p => ({ ...p, note: e.target.value }))}
              rows={2} placeholder="หมายเหตุเพิ่มเติม..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => { setModal(false); setEditing(EMPTY) }}
              style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(148,163,184,0.1)', border: '1px solid #2d3154', color: '#94a3b8', cursor: 'pointer' }}>ยกเลิก</button>
            <button onClick={save} disabled={imageUploading || !editing.productName}
              style={{ flex: 1, padding: 10, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', cursor: imageUploading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: (imageUploading || !editing.productName) ? 0.6 : 1 }}>
              {isEdit ? '💾 บันทึก' : '➕ เพิ่ม'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Full image preview */}
      {previewModal && (
        <div onClick={() => setPreviewModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={previewModal} alt="preview"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain', display: 'block', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }} />
            <button onClick={() => setPreviewModal(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', background: '#1a1d2e', border: '1px solid #2d3154', color: '#94a3b8', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}

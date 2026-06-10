'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'

/* ────────── Types ────────── */
interface OrderItem {
  id: string; productName: string; sku: string | null
  variantName: string | null; quantity: number
  isOutOfStock: boolean; expectedArrival: string | null; note: string | null
}
interface DelayedOrder {
  id: string; orderNumber: string; platform: string; shop: string
  orderStatus: string; buyerName: string | null
  trackingNumber: string | null; shipByDate: string | null
  orderDate: string | null; importBatch: string | null
  status: string; note: string | null; items: OrderItem[]
}

/* ────────── Shop config ────────── */
const SHOPS = [
  { key: 'THUN_SHOPEE',    platform: 'SHOPEE', label: 'ธันไฟฟ้า thunonline',  icon: '🧡', color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  border: '#fb923c40' },
  { key: 'THUN_LAZADA',    platform: 'LAZADA', label: 'ธันไฟฟ้า thunonline',  icon: '💜', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: '#a78bfa40' },
  { key: 'SUNTREE_SHOPEE', platform: 'SHOPEE', label: 'Suntree Electric',      icon: '🧡', color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  border: '#fb923c40' },
  { key: 'SUNTREE_LAZADA', platform: 'LAZADA', label: 'Suntree Electric',      icon: '💜', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: '#a78bfa40' },
]
function getShop(key: string) { return SHOPS.find(s => s.key === key) || SHOPS[0] }
interface CountEntry { status: string; _count: { id: number } }

/* ────────── Urgency ────────── */
function getUrgency(shipByDate: string | null, orderStatus: string): { label: string; color: string; bg: string; rank: number } {
  if (orderStatus === 'การจัดส่ง') return { label: '🚚 กำลังจัดส่ง', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', rank: 4 }
  if (!shipByDate) return { label: '⚪ ไม่มีกำหนด', color: '#64748b', bg: 'rgba(100,116,139,0.1)', rank: 3 }
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const ship  = new Date(shipByDate)
  const shipDay = new Date(ship.getFullYear(), ship.getMonth(), ship.getDate())
  const diff  = Math.floor((shipDay.getTime() - today.getTime()) / 86400000)
  if (diff < 0)  return { label: '🔴 เกินกำหนด', color: '#f87171', bg: 'rgba(248,113,113,0.12)', rank: 0 }
  if (diff === 0) return { label: '🟠 วันนี้',    color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  rank: 1 }
  if (diff === 1) return { label: '🟡 พรุ่งนี้',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', rank: 2 }
  return { label: `⚪ อีก ${diff} วัน`, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', rank: 3 }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: '⏳ รอดำเนินการ', color: '#fbbf24' },
  PACKED:    { label: '📦 แพ็คแล้ว',    color: '#60a5fa' },
  SHIPPED:   { label: '🚚 ส่งแล้ว',     color: '#4ade80' },
  CANCELLED: { label: '❌ ยกเลิก',      color: '#f87171' },
}

/* ────────── Auto-detect platform from headers ────────── */
function parseExcelRows(rows: unknown[][]): ReturnType<typeof buildOrdersFromRows> {
  if (rows.length < 2) return []
  const header = rows[0] as string[]
  const isShopee = header[0] === 'หมายเลขคำสั่งซื้อ'
  // Lazada: header[0] = 'orderItemId'  OR  header[12] = 'orderNumber'
  const isLazada = header[0] === 'orderItemId' || header[12] === 'orderNumber'
  if (!isShopee && !isLazada) return []
  return buildOrdersFromRows(rows, isShopee ? 'SHOPEE' : 'LAZADA')
}

// Parse "10 Jun 2026 14:44" → "2026-06-10T14:44:00" (Lazada date format)
function parseLazadaDate(s: string): string {
  if (!s) return ''
  const months: Record<string, string> = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' }
  const m = s.match(/(\d+)\s+(\w+)\s+(\d+)\s+(\d+:\d+)/)
  if (!m) return s
  const [, d, mon, y, t] = m
  return `${y}-${months[mon] || '01'}-${d.padStart(2, '0')}T${t}:00`
}

function buildOrdersFromRows(rows: unknown[][], platform: string) {
  const map = new Map<string, {
    orderNumber: string; platform: string; orderStatus: string
    buyerName?: string; trackingNumber?: string; shipByDate?: string; orderDate?: string
    items: Map<string, { productName: string; sku?: string; variantName?: string; quantity: number }>
  }>()

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[]
    if (!r[0]) continue

    let orderNumber: string, orderStatus: string, buyerName: string, orderDate: string,
        trackingNumber: string, shipByDate: string,
        productName: string, sku: string, variantName: string

    if (platform === 'SHOPEE') {
      orderNumber    = String(r[0]  || '')
      orderStatus    = String(r[1]  || '')
      buyerName      = String(r[5]  || '')
      orderDate      = String(r[6]  || '')
      trackingNumber = String(r[14] || '')
      shipByDate     = String(r[15] || '')
      productName    = String(r[18] || '')
      sku            = String(r[19] || '')
      variantName    = String(r[20] || '')

      const actionable = ['ที่ต้องจัดส่ง', 'การจัดส่ง']
      if (!actionable.some(s => orderStatus.includes(s))) continue

      if (!map.has(orderNumber)) {
        map.set(orderNumber, { orderNumber, platform, orderStatus,
          buyerName: buyerName || undefined,
          trackingNumber: trackingNumber || undefined,
          shipByDate: shipByDate || undefined,
          orderDate: orderDate || undefined,
          items: new Map(),
        })
      }
      const qty = Number(r[23]) || 1
      const key = `${sku}|${variantName}`
      const itemMap = map.get(orderNumber)!.items
      if (!itemMap.has(key)) {
        itemMap.set(key, { productName, sku: sku || undefined, variantName: variantName || undefined, quantity: qty })
      }

    } else {
      // Lazada: one row = one unit, group by orderNumber + sku + variation for quantity
      orderNumber    = String(r[12] || '')
      orderStatus    = String(r[66] || '')
      buyerName      = String(r[19] || '')   // shippingName
      orderDate      = parseLazadaDate(String(r[8] || ''))
      trackingNumber = String(r[59] || '')   // trackingCode
      shipByDate     = parseLazadaDate(String(r[11] || ''))   // ttsSla
      productName    = String(r[52] || '')   // itemName
      sku            = String(r[5]  || '')   // sellerSku
      variantName    = String(r[53] || '')   // variation

      if (!orderNumber) continue
      const actionable = ['pending', 'ready_to_ship', 'shipped']
      if (!actionable.includes(orderStatus.toLowerCase())) continue

      if (!map.has(orderNumber)) {
        map.set(orderNumber, { orderNumber, platform, orderStatus,
          buyerName: buyerName || undefined,
          trackingNumber: trackingNumber || undefined,
          shipByDate: shipByDate || undefined,
          orderDate: orderDate || undefined,
          items: new Map(),
        })
      }
      // Each row = 1 unit → accumulate quantity by SKU+variant key
      const key = `${sku}|${variantName}`
      const itemMap = map.get(orderNumber)!.items
      if (itemMap.has(key)) {
        itemMap.get(key)!.quantity += 1
      } else {
        itemMap.set(key, { productName, sku: sku || undefined, variantName: variantName || undefined, quantity: 1 })
      }
    }
  }

  // Convert inner item Maps to arrays
  return Array.from(map.values()).map(o => ({
    ...o,
    items: Array.from(o.items.values()),
  }))
}

/* ────────── Component ────────── */
export default function DelayedOrdersPage() {
  const [orders,   setOrders]   = useState<DelayedOrder[]>([])
  const [counts,   setCounts]   = useState<CountEntry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; shop: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL')
  const [filterShop, setFilterShop] = useState<string>('ALL')
  const [editingItem, setEditingItem] = useState<{ id: string; field: string; value: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('tns-token') : ''

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/delayed-orders', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        setOrders(data.data.orders)
        setCounts(data.data.counts)
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchOrders()
    // Preload SheetJS in background so it's ready when user uploads
    if (!(window as unknown as Record<string, unknown>).XLSX) {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
      document.head.appendChild(s)
    }
  }, [fetchOrders])

  /* ── Load SheetJS from CDN, parse Excel ── */
  async function loadXLSX() {
    if ((window as unknown as Record<string, unknown>).XLSX) return (window as unknown as Record<string, unknown>).XLSX
    return new Promise((resolve) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
      s.onload = () => resolve((window as unknown as Record<string, unknown>).XLSX)
      document.head.appendChild(s)
    })
  }

  async function handleFile(file: File) {
    setImporting(true)
    setImportResult(null)
    try {
      const XLSX = await loadXLSX() as {
        read: (data: ArrayBuffer, opts: { type: string }) => { SheetNames: string[]; Sheets: Record<string, unknown> }
        utils: { sheet_to_json: (sheet: unknown, opts: { header: number; defval: string }) => unknown[][] }
      }
      const buf  = await file.arrayBuffer()
      const wb   = XLSX.read(buf, { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]

      const parsed = parseExcelRows(rows)
      if (parsed.length === 0) {
        alert('ไม่พบคำสั่งซื้อที่รอดำเนินการในไฟล์นี้\n(รองรับเฉพาะรายการสถานะ: ที่ต้องจัดส่ง, การจัดส่ง)')
        return
      }

      const today = new Date().toISOString().slice(0, 10)
      const res = await fetch('/api/delayed-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ importBatch: today, shop: selectedShop, orders: parsed }),
      })
      const data = await res.json()
      if (data.success) {
        setImportResult({ ...data.data, shop: selectedShop })
        await fetchOrders()
      }
    } catch (e) {
      console.error(e)
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์')
    } finally {
      setImporting(false)
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    await fetch(`/api/delayed-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function updateItem(itemId: string, field: string, value: string | boolean) {
    const body: Record<string, unknown> = { [field]: value }
    await fetch(`/api/delayed-orders/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    setOrders(prev => prev.map(o => ({
      ...o,
      items: o.items.map(it => it.id === itemId ? { ...it, [field]: value } : it),
    })))
    setEditingItem(null)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  /* ── Filter ── */
  const countMap: Record<string, number> = {}
  counts.forEach(c => { countMap[c.status] = c._count.id })

  const filtered = orders.filter(o => {
    if (filterStatus  !== 'ALL' && o.status !== filterStatus) return false
    if (filterShop    !== 'ALL' && o.shop   !== filterShop)   return false
    if (filterUrgency !== 'ALL') {
      const u = getUrgency(o.shipByDate, o.orderStatus)
      if (filterUrgency === 'OVERDUE'   && u.rank !== 0) return false
      if (filterUrgency === 'TODAY'     && u.rank !== 1) return false
      if (filterUrgency === 'TOMORROW'  && u.rank !== 2) return false
    }
    return true
  })

  const pendingCount   = countMap['PENDING']   || 0
  const packedCount    = countMap['PACKED']     || 0
  const shippedCount   = countMap['SHIPPED']    || 0
  const overdueCount   = orders.filter(o => o.status === 'PENDING' && getUrgency(o.shipByDate, o.orderStatus).rank === 0).length
  const todayCount     = orders.filter(o => o.status === 'PENDING' && getUrgency(o.shipByDate, o.orderStatus).rank === 1).length

  return (
    <AppShell>
      <Header title="📦 คำสั่งซื้อที่ล้าช้า" subtitle="ติดตามคำสั่งซื้อที่รอจัดส่งและเกินกำหนด" />
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Shop Selector ── */}
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>เลือกร้านก่อนอัปโหลด Excel</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {SHOPS.map(shop => (
              <button key={shop.key} onClick={() => setSelectedShop(selectedShop === shop.key ? '' : shop.key)}
                style={{
                  padding: '10px 18px', borderRadius: 10, border: `2px solid ${selectedShop === shop.key ? shop.color : '#2d3154'}`,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                  background: selectedShop === shop.key ? shop.bg : '#1a1d2e',
                  color: selectedShop === shop.key ? shop.color : '#64748b',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                <span style={{ fontSize: 16 }}>{shop.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{shop.platform}</div>
                  <div>{shop.label}</div>
                </div>
                {selectedShop === shop.key && <span style={{ fontSize: 14 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Upload Zone ── */}
        <div
          onDragOver={e => { e.preventDefault(); if (selectedShop) setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (!selectedShop) { alert('กรุณาเลือกร้านก่อนอัปโหลด'); return; } const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => { if (!selectedShop) { alert('กรุณาเลือกร้านก่อนอัปโหลด'); return; } fileInputRef.current?.click() }}
          style={{
            border: `2px dashed ${!selectedShop ? '#1e2235' : dragOver ? '#6366f1' : '#2d3154'}`,
            borderRadius: 12, padding: '24px 20px', textAlign: 'center',
            cursor: selectedShop ? 'pointer' : 'not-allowed',
            background: dragOver ? 'rgba(99,102,241,0.08)' : '#1a1d2e',
            opacity: selectedShop ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
        >
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          {importing ? (
            <div style={{ color: '#818cf8' }}>
              ⏳ กำลังนำเข้าข้อมูล {selectedShop ? `(${getShop(selectedShop).label})` : ''}...
            </div>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              {selectedShop ? (
                <div style={{ color: getShop(selectedShop).color, fontSize: 14, fontWeight: 600 }}>
                  {getShop(selectedShop).icon} {getShop(selectedShop).platform} · {getShop(selectedShop).label}
                </div>
              ) : (
                <div style={{ color: '#4a5568', fontSize: 14 }}>← เลือกร้านก่อน</div>
              )}
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>ลาก-วาง หรือคลิกเพื่ออัปโหลด Excel</div>
              <div style={{ color: '#4a5568', fontSize: 11, marginTop: 2 }}>นำเข้าเฉพาะ: ที่ต้องจัดส่ง, การจัดส่ง, ready_to_ship</div>
            </>
          )}
        </div>

        {importResult && (
          <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '12px 16px', color: '#4ade80', fontSize: 13 }}>
            ✅ นำเข้าสำเร็จ {importResult.shop ? `(${getShop(importResult.shop).icon} ${getShop(importResult.shop).label})` : ''} — สร้างใหม่ {importResult.created} รายการ | อัพเดท {importResult.updated} รายการ
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: '⏳ รอดำเนินการ', value: pendingCount,  color: '#fbbf24' },
            { label: '📦 แพ็คแล้ว',   value: packedCount,   color: '#60a5fa' },
            { label: '🚚 ส่งแล้ว',    value: shippedCount,  color: '#4ade80' },
            { label: '🔴 เกินกำหนด',  value: overdueCount,  color: '#f87171' },
            { label: '🟠 วันนี้',      value: todayCount,    color: '#fb923c' },
          ].map(c => (
            <div key={c.label} style={{ background: '#1a1d2e', border: '1px solid #2d3154', borderRadius: 10, padding: '12px 18px', minWidth: 110 }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Shop filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b', marginRight: 4 }}>ร้าน:</span>
            <button onClick={() => setFilterShop('ALL')}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                background: filterShop === 'ALL' ? '#6366f1' : '#2d3154',
                color: filterShop === 'ALL' ? 'white' : '#94a3b8' }}>
              ทั้งหมด
            </button>
            {SHOPS.map(shop => (
              <button key={shop.key} onClick={() => setFilterShop(filterShop === shop.key ? 'ALL' : shop.key)}
                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${filterShop === shop.key ? shop.color : 'transparent'}`, cursor: 'pointer', fontSize: 12,
                  background: filterShop === shop.key ? shop.bg : '#2d3154',
                  color: filterShop === shop.key ? shop.color : '#94a3b8' }}>
                {shop.icon} {shop.platform === 'SHOPEE' ? 'Shopee' : 'Lazada'} · {shop.label}
              </button>
            ))}
          </div>
          {/* Status + urgency filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b', marginRight: 4 }}>สถานะ:</span>
            {['ALL', 'PENDING', 'PACKED', 'SHIPPED'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                  background: filterStatus === s ? '#6366f1' : '#2d3154',
                  color: filterStatus === s ? 'white' : '#94a3b8' }}>
                {s === 'ALL' ? 'ทั้งหมด' : STATUS_LABEL[s]?.label || s}
              </button>
            ))}
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, marginRight: 4 }}>ความเร่งด่วน:</span>
            {[
              { key: 'ALL', label: 'ทั้งหมด' },
              { key: 'OVERDUE', label: '🔴 เกินกำหนด' },
              { key: 'TODAY', label: '🟠 วันนี้' },
              { key: 'TOMORROW', label: '🟡 พรุ่งนี้' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilterUrgency(f.key)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                  background: filterUrgency === f.key ? '#6366f1' : '#2d3154',
                  color: filterUrgency === f.key ? 'white' : '#94a3b8' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div style={{ color: '#4a5568', textAlign: 'center', padding: 40 }}>⏳ กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#4a5568', textAlign: 'center', padding: 60, fontSize: 14 }}>
            ไม่มีคำสั่งซื้อที่ตรงตามเงื่อนไข<br />
            <span style={{ fontSize: 12 }}>อัปโหลด Excel เพื่อนำเข้าคำสั่งซื้อ</span>
          </div>
        ) : (
          <div style={{ background: '#1a1d2e', border: '1px solid #2d3154', borderRadius: 12, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 140px 90px 120px 160px', gap: 0, borderBottom: '1px solid #2d3154', background: '#0f1117', padding: '10px 16px', fontSize: 11, color: '#4a5568', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div>ความเร่งด่วน</div>
              <div>เลขออร์เดอร์ / ผู้ซื้อ</div>
              <div>ส่งภายใน</div>
              <div>เลขพัสดุ</div>
              <div>สินค้า</div>
              <div>สถานะ</div>
              <div>ดำเนินการ</div>
            </div>

            {filtered.map(order => {
              const u = getUrgency(order.shipByDate, order.orderStatus)
              const isExpanded = expanded.has(order.id)
              const hasOutOfStock = order.items.some(it => it.isOutOfStock)

              return (
                <div key={order.id} style={{ borderBottom: '1px solid #2d3154' }}>
                  {/* Main row */}
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 140px 90px 120px 160px', gap: 0, padding: '12px 16px', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(99,102,241,0.06)' : 'transparent' }}
                    onClick={() => toggleExpand(order.id)}
                  >
                    {/* Urgency */}
                    <div>
                      <span style={{ fontSize: 11, color: u.color, background: u.bg, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{u.label}</span>
                      {hasOutOfStock && <div style={{ fontSize: 10, color: '#f87171', marginTop: 4 }}>⚠️ สินค้าหมด</div>}
                    </div>
                    {/* Order number */}
                    <div>
                      {/* Shop badge */}
                      {(() => {
                        const sh = getShop(order.shop)
                        return (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                            background: sh.bg, color: sh.color, border: `1px solid ${sh.border}`,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            {sh.icon} {sh.platform} · {sh.label || (order.platform === 'SHOPEE' ? 'Shopee' : 'Lazada')}
                          </span>
                        )
                      })()}
                      <div style={{ fontSize: 13, color: 'white', fontWeight: 700, fontFamily: 'monospace', marginTop: 4, letterSpacing: '0.02em' }}>{order.orderNumber}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{order.buyerName || '—'}</div>
                      <div style={{ fontSize: 10, color: '#4a5568' }}>{order.orderStatus}</div>
                    </div>
                    {/* Ship by */}
                    <div style={{ fontSize: 12, color: u.color }}>
                      {order.shipByDate ? new Date(order.shipByDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                    {/* Tracking */}
                    <div style={{ fontSize: 11, color: '#818cf8', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {order.trackingNumber || '—'}
                    </div>
                    {/* Items count */}
                    <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
                      {order.items.length} รายการ
                      <div style={{ fontSize: 10, color: '#4a5568' }}>{isExpanded ? '▲' : '▼'}</div>
                    </div>
                    {/* Status */}
                    <div onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: 11, color: STATUS_LABEL[order.status]?.color || '#94a3b8' }}>
                        {STATUS_LABEL[order.status]?.label || order.status}
                      </span>
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                      {order.status === 'PENDING' && (
                        <button onClick={() => updateOrderStatus(order.id, 'PACKED')}
                          style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontWeight: 600 }}>
                          📦 แพ็คแล้ว
                        </button>
                      )}
                      {order.status === 'PACKED' && (
                        <button onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                          style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, background: 'rgba(74,222,128,0.15)', color: '#4ade80', fontWeight: 600 }}>
                          🚚 ส่งแล้ว
                        </button>
                      )}
                      {(order.status === 'PENDING' || order.status === 'PACKED') && (
                        <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                          style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                          ❌
                        </button>
                      )}
                      {order.status === 'CANCELLED' && (
                        <button onClick={() => updateOrderStatus(order.id, 'PENDING')}
                          style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                          ↩️ คืน
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded items */}
                  {isExpanded && (
                    <div style={{ background: 'rgba(15,17,23,0.5)', borderTop: '1px solid #2d3154', padding: '12px 20px' }}>
                      <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>รายการสินค้า</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {order.items.map(item => (
                          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 140px', gap: 12, alignItems: 'center', padding: '8px 12px', background: '#1a1d2e', borderRadius: 8, border: `1px solid ${item.isOutOfStock ? '#f8717140' : '#2d3154'}` }}>
                            {/* Product info */}
                            <div>
                              <div style={{ fontSize: 13, color: item.isOutOfStock ? '#f87171' : 'white' }}>{item.productName}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                {item.sku && <span>SKU: {item.sku}</span>}
                                {item.variantName && <span> · {item.variantName}</span>}
                                <span> · จำนวน: {item.quantity}</span>
                              </div>
                            </div>
                            {/* Out of stock toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                onClick={() => updateItem(item.id, 'isOutOfStock', !item.isOutOfStock)}
                                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, background: item.isOutOfStock ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.1)', color: item.isOutOfStock ? '#f87171' : '#4ade80', fontWeight: 600 }}>
                                {item.isOutOfStock ? '⚠️ หมดสต็อก' : '✅ มีสต็อก'}
                              </button>
                            </div>
                            {/* Expected arrival */}
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                              {item.isOutOfStock && (
                                <span style={{ fontSize: 10, color: '#64748b' }}>คาดว่าจะได้รับ</span>
                              )}
                            </div>
                            <div>
                              {item.isOutOfStock && (
                                editingItem?.id === item.id && editingItem.field === 'expectedArrival' ? (
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <input type="date" value={editingItem.value}
                                      onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                                      style={{ padding: '4px 8px', borderRadius: 6, background: '#0f1117', border: '1px solid #6366f1', color: 'white', fontSize: 12, outline: 'none' }} />
                                    <button onClick={() => updateItem(item.id, 'expectedArrival', editingItem.value)}
                                      style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#6366f1', color: 'white', fontSize: 11 }}>✓</button>
                                    <button onClick={() => setEditingItem(null)}
                                      style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#2d3154', color: '#94a3b8', fontSize: 11 }}>✕</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setEditingItem({ id: item.id, field: 'expectedArrival', value: item.expectedArrival || '' })}
                                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px dashed #4a5568', cursor: 'pointer', background: 'transparent', color: item.expectedArrival ? '#fbbf24' : '#4a5568', fontSize: 11 }}>
                                    {item.expectedArrival ? `📅 ${item.expectedArrival}` : '+ กำหนดวันสินค้าถึง'}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'

interface PlatformPricing {
  id: string
  platform: string
  multiplier: number
  commission: number
  note: string | null
}

const PLATFORM_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  SHOPEE:         { label: 'Shopee',          icon: '🧡', color: '#fb923c' },
  LAZADA:         { label: 'Lazada',          icon: '💜', color: '#a78bfa' },
  SHOPEE_SUNTREE: { label: 'Shopee Suntree',  icon: '🌳', color: '#f97316' },
  LAZADA_SUNTREE: { label: 'Lazada Suntree',  icon: '🌿', color: '#818cf8' },
}

export default function PlatformPricingPage() {
  const [items, setItems]     = useState<PlatformPricing[]>([])
  const [editing, setEditing] = useState<Record<string, PlatformPricing>>({})
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const res  = await fetch('/api/platform-pricing')
    const data = await res.json()
    if (data.success) {
      setItems(data.data)
      const map: Record<string, PlatformPricing> = {}
      data.data.forEach((i: PlatformPricing) => { map[i.platform] = { ...i } })
      setEditing(map)
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const res  = await fetch('/api/platform-pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.values(editing)),
    })
    const data = await res.json()
    if (data.success) {
      setItems(data.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const isDirty = JSON.stringify(Object.values(editing).map(e => ({ p: e.platform, m: e.multiplier, n: e.note })))
               !== JSON.stringify(items.map(e => ({ p: e.platform, m: e.multiplier, n: e.note })))

  return (
    <AppShell>
      <Header title="💰 ตัวคูณราคาแพลตฟอร์ม" subtitle="บันทึกตัวคูณราคาสำหรับแต่ละช่องทาง" />
      <div style={{ padding: 24, flex: 1 }}>
        {loading ? (
          <div style={{ color: '#4a5568', padding: 40, textAlign: 'center' }}>⏳ กำลังโหลด...</div>
        ) : (
          <div style={{ background: '#1a1d2e', border: '1px solid #2d3154', borderRadius: 12, overflow: 'hidden', maxWidth: 560 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#0f1117' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4a5568', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4a5568', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ตัวคูณ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4a5568', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(editing).map(item => {
                  const p = PLATFORM_LABEL[item.platform] || { label: item.platform, icon: '🛒', color: '#818cf8' }
                  return (
                    <tr key={item.platform} style={{ borderTop: '1px solid #2d3154' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: p.color }}>
                          <span>{p.icon}</span> {p.label}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <input
                          type="number" step="0.01" min="1"
                          value={item.multiplier}
                          onChange={e => setEditing(prev => ({ ...prev, [item.platform]: { ...prev[item.platform], multiplier: parseFloat(e.target.value) || 1 } }))}
                          style={{ width: 90, padding: '8px 10px', borderRadius: 8, background: '#0f1117', border: `1px solid ${p.color}40`, color: 'white', outline: 'none', fontSize: 15, fontWeight: 700, textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <input
                          value={item.note || ''}
                          onChange={e => setEditing(prev => ({ ...prev, [item.platform]: { ...prev[item.platform], note: e.target.value } }))}
                          placeholder="หมายเหตุ..."
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ padding: '14px 16px', borderTop: '1px solid #2d3154', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={handleSave} disabled={saving || !isDirty}
                style={{ padding: '9px 22px', borderRadius: 8, background: isDirty ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#2d3154', color: isDirty ? 'white' : '#4a5568', border: 'none', cursor: isDirty ? 'pointer' : 'default', fontWeight: 600, fontSize: 13 }}>
                {saving ? '⏳ บันทึก...' : '💾 บันทึก'}
              </button>
              {saved && <span style={{ color: '#4ade80', fontSize: 13 }}>✅ บันทึกแล้ว</span>}
              {isDirty && !saving && <span style={{ color: '#fbbf24', fontSize: 12 }}>● มีการเปลี่ยนแปลง</span>}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

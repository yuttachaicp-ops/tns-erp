'use client'
import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { CSSProperties } from 'react'

interface CarLoan {
  id: string; name: string; bankName: string; totalAmount: number
  monthlyPayment: number; totalInstallments: number; paidInstallments: number
  startDate: string; note: string
}
const EM: Partial<CarLoan> = { name: '', bankName: '', totalAmount: 0, monthlyPayment: 0, totalInstallments: 0, paidInstallments: 0, startDate: '', note: '' }

function tok() { return typeof window === 'undefined' ? '' : localStorage.getItem('tns-token') || '' }
function fmt(n: number) { return n.toLocaleString('th-TH', { minimumFractionDigits: 2 }) }
function Lbl({ t }: { t: string }) {
  return <label style={{ fontWeight: 600, marginBottom: 4, display: 'block', color: '#94a3b8', fontSize: 13 }}>{t}</label>
}
function Inp({ val, onChange, type = 'text', placeholder = '' }: { val: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #2d3154', boxSizing: 'border-box' as const, background: '#0f1117', color: 'white', fontSize: 14 }} />
}

export default function CarLoansPage() {
  const [loans, setLoans] = useState<CarLoan[]>([])
  const [mod, setMod] = useState(false)
  const [ed, setEd] = useState<Partial<CarLoan>>(EM)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const fetchData = useCallback(async () => {
    const r = await fetch('/api/car-loans', { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) setLoans(await r.json())
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  async function save() {
    if (!ed.name || !ed.totalAmount || !ed.monthlyPayment || !ed.totalInstallments) { setErr('กรุณากรอกข้อมูลที่จำเป็น'); return }
    setSaving(true); setErr('')
    try {
      const url = isEdit ? `/api/car-loans/${ed.id}` : '/api/car-loans'
      const r = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(ed) })
      if (r.ok) { setMod(false); setEd(EM); setIsEdit(false); await fetchData() }
      else { const e = await r.json().catch(() => ({})); setErr(e.error || 'บันทึกไม่สำเร็จ') }
    } catch (e: any) { setErr('เกิดข้อผิดพลาด: ' + e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('ลบข้อมูลผ่อนรถคันนี้?')) return
    await fetch(`/api/car-loans/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    fetchData()
  }

  async function updatePaid(l: CarLoan, delta: number) {
    const newPaid = Math.max(0, Math.min(l.totalInstallments, l.paidInstallments + delta))
    await fetch(`/api/car-loans/${l.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ ...l, paidInstallments: newPaid }) })
    fetchData()
  }

  const card: CSSProperties = { background: '#1a1d2e', borderRadius: 16, padding: 24, border: '1px solid #2d3154' }
  const btnPrimary: CSSProperties = { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }
  const IS: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
  const TA: CSSProperties = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2d3154', fontFamily: 'inherit', resize: 'vertical' as const, background: '#0f1117', color: 'white' }

  const totalMonthly = loans.reduce((s, l) => s + l.monthlyPayment, 0)
  const totalRemaining = loans.reduce((s, l) => s + (l.totalInstallments - l.paidInstallments) * l.monthlyPayment, 0)
  const activeCount = loans.filter(l => l.paidInstallments < l.totalInstallments).length

  return (
    <AppShell>
      <Header title="🚗 ผ่อนรถ" subtitle={`${loans.length} รายการ`} />
      <div style={{ padding: '24px', flex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {loans.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ ...card, background: 'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05))', border: '1px solid rgba(34,197,94,0.4)' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>ยอดผ่อน/เดือน (รวม)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>฿{fmt(totalMonthly)}</div>
              </div>
              <div style={{ ...card, background: 'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>ยอดคงเหลือรวม</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#f87171' }}>฿{fmt(totalRemaining)}</div>
              </div>
              <div style={{ ...card }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>กำลังผ่อนอยู่</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{activeCount} คัน</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ color: 'white', fontWeight: 700, margin: 0 }}>รายการผ่อนรถ</h2>
            <button onClick={() => { setEd(EM); setIsEdit(false); setMod(true) }} style={btnPrimary}>+ เพิ่มรถ</button>
          </div>

          {loans.length === 0 ? (
            <div style={{ ...card, textAlign: 'center' as const, padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
              <div style={{ color: '#64748b', fontSize: 16 }}>ยังไม่มีข้อมูลการผ่อนรถ</div>
              <div style={{ color: '#475569', fontSize: 13, marginTop: 8, marginBottom: 24 }}>เพิ่มรายการผ่อนรถเพื่อติดตามยอดคงเหลือ</div>
              <button onClick={() => { setEd(EM); setIsEdit(false); setMod(true) }} style={btnPrimary}>+ เพิ่มรถคันแรก</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
              {loans.map(l => {
                const pct = l.totalInstallments > 0 ? (l.paidInstallments / l.totalInstallments) * 100 : 0
                const remaining = (l.totalInstallments - l.paidInstallments) * l.monthlyPayment
                const paid = l.paidInstallments * l.monthlyPayment
                const done = l.paidInstallments >= l.totalInstallments
                return (
                  <div key={l.id} style={{ ...card, borderLeft: `4px solid ${done ? '#4ade80' : '#22d3ee'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 28 }}>🚗</span>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{l.name}</div>
                          {l.bankName && <div style={{ fontSize: 13, color: '#22d3ee', marginTop: 2 }}>🏦 {l.bankName}</div>}
                        </div>
                        {done && <span style={{ background: '#4ade80', color: '#052e16', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>✅ ผ่อนครบแล้ว</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEd(l); setIsEdit(true); setMod(true) }}
                          style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', fontSize: 13 }}>✏️ แก้ไข</button>
                        <button onClick={() => del(l.id)}
                          style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontSize: 13 }}>🗑️ ลบ</button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>ความคืบหน้า</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: done ? '#4ade80' : '#22d3ee' }}>{pct.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: '#2d3154', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: done ? 'linear-gradient(90deg,#4ade80,#22c55e)' : 'linear-gradient(90deg,#22d3ee,#0891b2)', width: `${pct}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 16 }}>
                      <div style={{ background: '#0f1117', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>ราคารถ</div>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>฿{fmt(l.totalAmount)}</div>
                      </div>
                      <div style={{ background: '#0f1117', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>ผ่อน/เดือน</div>
                        <div style={{ fontWeight: 700, color: '#22d3ee', fontSize: 15 }}>฿{fmt(l.monthlyPayment)}</div>
                      </div>
                      <div style={{ background: '#0f1117', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>จ่ายไปแล้ว</div>
                        <div style={{ fontWeight: 700, color: '#4ade80', fontSize: 15 }}>฿{fmt(paid)}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{l.paidInstallments} / {l.totalInstallments} งวด</div>
                      </div>
                      <div style={{ background: '#0f1117', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>คงเหลือ</div>
                        <div style={{ fontWeight: 700, color: done ? '#4ade80' : '#f87171', fontSize: 15 }}>฿{fmt(remaining)}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{l.totalInstallments - l.paidInstallments} งวด</div>
                      </div>
                    </div>

                    {!done && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(34,211,238,0.08)', borderRadius: 10, padding: '10px 16px' }}>
                        <span style={{ fontSize: 13, color: '#94a3b8', flex: 1 }}>อัพเดทงวดที่จ่าย</span>
                        <button onClick={() => updatePaid(l, -1)} disabled={l.paidInstallments <= 0}
                          style={{ width: 32, height: 32, borderRadius: 8, background: '#2d3154', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, fontWeight: 700, opacity: l.paidInstallments <= 0 ? 0.4 : 1 }}>−</button>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'white', minWidth: 80, textAlign: 'center' as const }}>{l.paidInstallments} งวด</span>
                        <button onClick={() => updatePaid(l, 1)} disabled={l.paidInstallments >= l.totalInstallments}
                          style={{ width: 32, height: 32, borderRadius: 8, background: '#22d3ee', border: 'none', color: '#0f172a', cursor: 'pointer', fontSize: 18, fontWeight: 700, opacity: l.paidInstallments >= l.totalInstallments ? 0.4 : 1 }}>+</button>
                      </div>
                    )}
                    {l.note && <div style={{ marginTop: 12, color: '#94a3b8', fontSize: 13, borderTop: '1px solid #2d3154', paddingTop: 12 }}>📝 {l.note}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={mod} onClose={() => { setMod(false); setEd(EM); setIsEdit(false) }} title={isEdit ? 'แก้ไขข้อมูลผ่อนรถ' : 'เพิ่มรายการผ่อนรถ'} size="md">
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div><Lbl t="ชื่อ/รุ่นรถ *" /><Inp val={ed.name || ''} onChange={v => setEd({ ...ed, name: v })} placeholder="เช่น Toyota Yaris 2023" /></div>
          <div><Lbl t="ธนาคาร/ไฟแนนซ์" /><Inp val={ed.bankName || ''} onChange={v => setEd({ ...ed, bankName: v })} placeholder="เช่น Toyota Leasing, SCB" /></div>
          <div style={IS}>
            <div><Lbl t="ราคารถ (฿) *" /><Inp val={ed.totalAmount || ''} onChange={v => setEd({ ...ed, totalAmount: Number(v) })} type="number" placeholder="0" /></div>
            <div><Lbl t="ยอดผ่อน/เดือน (฿) *" /><Inp val={ed.monthlyPayment || ''} onChange={v => setEd({ ...ed, monthlyPayment: Number(v) })} type="number" placeholder="0" /></div>
            <div><Lbl t="จำนวนงวดทั้งหมด *" /><Inp val={ed.totalInstallments || ''} onChange={v => setEd({ ...ed, totalInstallments: Number(v) })} type="number" placeholder="เช่น 60" /></div>
            <div><Lbl t="จ่ายไปแล้ว (งวด)" /><Inp val={ed.paidInstallments ?? 0} onChange={v => setEd({ ...ed, paidInstallments: Number(v) })} type="number" placeholder="0" /></div>
          </div>
          <div><Lbl t="วันเริ่มผ่อน" /><Inp val={ed.startDate || ''} onChange={v => setEd({ ...ed, startDate: v })} type="date" /></div>
          <div><Lbl t="หมายเหตุ" /><textarea value={ed.note || ''} onChange={e => setEd({ ...ed, note: e.target.value })} style={TA} rows={2} placeholder="บันทึกเพิ่มเติม..." /></div>
          {err && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{err}</div>}
          <button onClick={save} disabled={saving} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}

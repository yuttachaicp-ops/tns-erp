'use client'
import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { CSSProperties } from 'react'

interface SavingsGoal {
  id: string; name: string; targetAmount: number; savedAmount: number
  targetDate: string; icon: string; note: string
}
const EM: Partial<SavingsGoal> = { name: '', targetAmount: 0, savedAmount: 0, targetDate: '', icon: '🎯', note: '' }
const ICONS = ['🎯','🏠','🚗','✈️','💍','📱','💻','🎓','👶','🌴','💰','🏋️']

function tok() { return typeof window === 'undefined' ? '' : localStorage.getItem('tns-token') || '' }
function fmt(n: number) { return n.toLocaleString('th-TH', { minimumFractionDigits: 2 }) }
function daysLeft(date: string) {
  if (!date) return null
  const diff = new Date(date).getTime() - new Date().getTime()
  const d = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return d
}

function Lbl({ t }: { t: string }) {
  return <label style={{ fontWeight: 600, marginBottom: 4, display: 'block', color: '#94a3b8', fontSize: 13 }}>{t}</label>
}
function Inp({ val, onChange, type = 'text', placeholder = '' }: { val: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #2d3154', boxSizing: 'border-box' as const, background: '#0f1117', color: 'white', fontSize: 14 }} />
}

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [mod, setMod] = useState(false)
  const [addMod, setAddMod] = useState(false)
  const [ed, setEd] = useState<Partial<SavingsGoal>>(EM)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [topupGoal, setTopupGoal] = useState<SavingsGoal | null>(null)
  const [topupAmt, setTopupAmt] = useState('')

  const fetchData = useCallback(async () => {
    const r = await fetch('/api/savings-goals', { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) setGoals(await r.json())
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  async function save() {
    if (!ed.name || !ed.targetAmount) { setErr('กรุณากรอกชื่อและเป้าหมาย'); return }
    setSaving(true); setErr('')
    try {
      const url = isEdit ? `/api/savings-goals/${ed.id}` : '/api/savings-goals'
      const r = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(ed) })
      if (r.ok) { setMod(false); setEd(EM); setIsEdit(false); await fetchData() }
      else { const e = await r.json().catch(() => ({})); setErr(e.error || 'บันทึกไม่สำเร็จ') }
    } catch (e: any) { setErr('เกิดข้อผิดพลาด: ' + e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('ลบเป้าหมายนี้?')) return
    await fetch(`/api/savings-goals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    fetchData()
  }

  async function topup() {
    if (!topupGoal || !topupAmt) return
    const newSaved = topupGoal.savedAmount + Number(topupAmt)
    await fetch(`/api/savings-goals/${topupGoal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
      body: JSON.stringify({ ...topupGoal, savedAmount: newSaved }),
    })
    setTopupGoal(null); setTopupAmt(''); fetchData()
  }

  const card: CSSProperties = { background: '#1a1d2e', borderRadius: 16, padding: 24, border: '1px solid #2d3154' }
  const btnPrimary: CSSProperties = { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }
  const TA: CSSProperties = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2d3154', fontFamily: 'inherit', resize: 'vertical' as const, background: '#0f1117', color: 'white' }

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0)

  return (
    <AppShell>
      <Header title="🎯 เป้าหมายการออม" subtitle={`${goals.length} เป้าหมาย`} />
      <div style={{ padding: '24px', flex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {goals.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ ...card, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.4)' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>ออมแล้วทั้งหมด</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#818cf8' }}>฿{fmt(totalSaved)}</div>
              </div>
              <div style={{ ...card }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>เป้าหมายรวม</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>฿{fmt(totalTarget)}</div>
              </div>
              <div style={{ ...card, background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.05))', border: '1px solid rgba(34,197,94,0.3)' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>ยังขาดอยู่</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>฿{fmt(Math.max(0, totalTarget - totalSaved))}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ color: 'white', fontWeight: 700, margin: 0 }}>เป้าหมายทั้งหมด</h2>
            <button onClick={() => { setEd(EM); setIsEdit(false); setMod(true) }} style={btnPrimary}>+ เพิ่มเป้าหมาย</button>
          </div>

          {goals.length === 0 ? (
            <div style={{ ...card, textAlign: 'center' as const, padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <div style={{ color: '#64748b', fontSize: 16 }}>ยังไม่มีเป้าหมายการออม</div>
              <div style={{ color: '#475569', fontSize: 13, marginTop: 8, marginBottom: 24 }}>ตั้งเป้าหมายเพื่อแรงจูงใจในการออมเงิน</div>
              <button onClick={() => { setEd(EM); setIsEdit(false); setMod(true) }} style={btnPrimary}>+ ตั้งเป้าหมายแรก</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {goals.map(g => {
                const pct = g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0
                const done = g.savedAmount >= g.targetAmount
                const dl = daysLeft(g.targetDate)
                const remaining = Math.max(0, g.targetAmount - g.savedAmount)
                return (
                  <div key={g.id} style={{ ...card, borderTop: `4px solid ${done ? '#4ade80' : '#6366f1'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 28 }}>{g.icon || '🎯'}</span>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{g.name}</div>
                          {g.targetDate && dl !== null && (
                            <div style={{ fontSize: 12, color: dl < 0 ? '#f87171' : dl < 30 ? '#fbbf24' : '#64748b', marginTop: 2 }}>
                              {dl < 0 ? `เกินกำหนด ${Math.abs(dl)} วัน` : `อีก ${dl} วัน`}
                            </div>
                          )}
                        </div>
                      </div>
                      {done && <span style={{ background: '#4ade80', color: '#052e16', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' as const }}>✅ สำเร็จ!</span>}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>฿{fmt(g.savedAmount)} / ฿{fmt(g.targetAmount)}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: done ? '#4ade80' : '#818cf8' }}>{pct.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 10, borderRadius: 999, background: '#2d3154', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: done ? 'linear-gradient(90deg,#4ade80,#22c55e)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${pct}%`, transition: 'width 0.5s' }} />
                      </div>
                    </div>

                    {!done && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>ยังขาดอีก <span style={{ color: '#f87171', fontWeight: 700 }}>฿{fmt(remaining)}</span></div>}

                    <div style={{ display: 'flex', gap: 8 }}>
                      {!done && (
                        <button onClick={() => { setTopupGoal(g); setTopupAmt('') }}
                          style={{ flex: 1, padding: '8px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                          💰 เติมเงิน
                        </button>
                      )}
                      <button onClick={() => { setEd(g); setIsEdit(true); setMod(true) }}
                        style={{ flex: 1, padding: '8px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>✏️ แก้ไข</button>
                      <button onClick={() => del(g.id)}
                        style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>🗑️</button>
                    </div>
                    {g.note && <div style={{ marginTop: 10, color: '#94a3b8', fontSize: 12, borderTop: '1px solid #2d3154', paddingTop: 10 }}>📝 {g.note}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={mod} onClose={() => { setMod(false); setEd(EM); setIsEdit(false) }} title={isEdit ? 'แก้ไขเป้าหมาย' : 'เพิ่มเป้าหมายการออม'} size="md">
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div>
            <Lbl t="ไอคอน" />
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setEd({ ...ed, icon: ic })} type="button"
                  style={{ width: 40, height: 40, fontSize: 20, borderRadius: 8, border: ed.icon === ic ? '2px solid #6366f1' : '1px solid #2d3154', background: ed.icon === ic ? 'rgba(99,102,241,0.2)' : '#0f1117', cursor: 'pointer' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div><Lbl t="ชื่อเป้าหมาย *" /><Inp val={ed.name || ''} onChange={v => setEd({ ...ed, name: v })} placeholder="เช่น ซื้อรถ, ท่องเที่ยวญี่ปุ่น" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><Lbl t="เป้าหมาย (฿) *" /><Inp val={ed.targetAmount || ''} onChange={v => setEd({ ...ed, targetAmount: Number(v) })} type="number" placeholder="0" /></div>
            <div><Lbl t="ออมแล้ว (฿)" /><Inp val={ed.savedAmount || ''} onChange={v => setEd({ ...ed, savedAmount: Number(v) })} type="number" placeholder="0" /></div>
          </div>
          <div><Lbl t="วันที่ต้องการถึงเป้า" /><Inp val={ed.targetDate || ''} onChange={v => setEd({ ...ed, targetDate: v })} type="date" /></div>
          <div><Lbl t="หมายเหตุ" /><textarea value={ed.note || ''} onChange={e => setEd({ ...ed, note: e.target.value })} style={TA} rows={2} placeholder="บันทึกเพิ่มเติม..." /></div>
          {err && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{err}</div>}
          <button onClick={save} disabled={saving} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </Modal>

      {/* Topup Modal */}
      <Modal open={!!topupGoal} onClose={() => { setTopupGoal(null); setTopupAmt('') }} title={`💰 เติมเงิน — ${topupGoal?.name}`} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: '#0f1117', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>ออมแล้ว</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#818cf8' }}>฿{fmt(topupGoal?.savedAmount || 0)}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>จากเป้า ฿{fmt(topupGoal?.targetAmount || 0)}</div>
          </div>
          <div><Lbl t="จำนวนที่ต้องการเพิ่ม (฿)" /><Inp val={topupAmt} onChange={v => setTopupAmt(v)} type="number" placeholder="0" /></div>
          {topupAmt && Number(topupAmt) > 0 && (
            <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#4ade80' }}>
              หลังเติม: ฿{fmt((topupGoal?.savedAmount || 0) + Number(topupAmt))}
            </div>
          )}
          <button onClick={topup} style={{ padding: '10px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            ยืนยันการเติมเงิน
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}

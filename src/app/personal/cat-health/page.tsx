'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import AppShell from '@/components/layout/AppShell'
import Modal from '@/components/ui/Modal'
import { CSSProperties } from 'react'

interface Cat { id: string; name: string; breed: string; color: string; birthDate: string; weight: string; microchip: string; allergy: string; note: string }
interface DLog { id: string; catId: string; logDate: string; weight: string; food: string; water: string; poop: string; mood: string; symptom: string; note: string; breathRate: string }
interface VVis { id: string; catId: string; visitDate: string; clinic: string; doctor: string; reason: string; diagnosis: string; treatment: string; cost: string; nextDate: string; note: string }
interface Vacc { id: string; catId: string; vaccineName: string; vacDate: string; nextDate: string; clinic: string; note: string }

const EC: Partial<Cat> = { name: '', breed: '', color: '', birthDate: '', weight: '', microchip: '', allergy: '', note: '' }
const ED: Partial<DLog> = { logDate: new Date().toISOString().split('T')[0], weight: '', food: '', water: '', poop: '', mood: '', symptom: '', note: '', breathRate: '' }
const EV: Partial<VVis> = { visitDate: new Date().toISOString().split('T')[0], clinic: '', doctor: '', reason: '', diagnosis: '', treatment: '', cost: '', nextDate: '', note: '' }
const EVC: Partial<Vacc> = { vaccineName: '', vacDate: new Date().toISOString().split('T')[0], nextDate: '', clinic: '', note: '' }
const IS: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
const TA: CSSProperties = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2d3154', fontFamily: 'inherit', resize: 'vertical' as const, background: '#0f1117', color: 'white' }
const TABS = [
  { id: 'profile', label: 'ข้อมูลแมว' },
  { id: 'daily', label: 'บันทึกรายวัน' },
  { id: 'vet', label: 'บันทึกพบหมอ' },
  { id: 'vacc', label: 'วัคซีน' },
]

function Lbl({ t }: { t: string }) {
  return <label style={{ fontWeight: 600, marginBottom: 4, display: 'block', color: '#94a3b8', fontSize: 13 }}>{t}</label>
}
function Inp({ val, onChange, type = 'text', placeholder = '' }: { val: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2d3154', boxSizing: 'border-box' as const, background: '#1a1d2e', color: 'white' }} />
}

function tok(): string { return typeof window === 'undefined' ? '' : localStorage.getItem('tns-token') || '' }
function fmt(d: string): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function BreathTimer({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [running, setRunning] = useState(false)
  const [secs, setSecs] = useState(60)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!running) return
    if (secs === 0) { setRunning(false); onChange(String(count)); return }
    const t = setTimeout(() => setSecs(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, secs, count, onChange])
  function start() { setSecs(60); setCount(0); setRunning(true) }
  function reset() { setRunning(false); setSecs(60); setCount(0); onChange('') }
  const statusColor = !value ? '' : Number(value) <= 40 ? '#4ade80' : Number(value) <= 50 ? '#fbbf24' : '#f87171'
  const status = !value ? '' : Number(value) <= 40 ? 'ปกติ' : Number(value) <= 50 ? 'เฝ้าระวัง' : 'หอบเหนื่อย!'
  return (
    <div>
      {running && (
        <div style={{ textAlign: 'center' as const, marginBottom: 12 }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#6366f1' }}>{secs}</div>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>วินาที</div>
          <button onClick={() => setCount(c => c + 1)} style={{ marginTop: 8, padding: '12px 32px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>
            +1 ครั้ง ({count})
          </button>
        </div>
      )}
      {!running && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
          <button onClick={start} style={{ padding: '8px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>จับเวลา 1 นาที</button>
          <Inp val={value} onChange={onChange} placeholder="หรือพิมพ์ตรงนี้" />
          {value && <button onClick={reset} style={{ padding: '8px 12px', background: '#2d3154', color: '#94a3b8', border: 'none', borderRadius: 8, cursor: 'pointer' }}>รีเซ็ต</button>}
        </div>
      )}
      {value && !running && (
        <div style={{ marginTop: 8, fontWeight: 700, color: statusColor, fontSize: 15 }}>
          {value} ครั้ง/นาที — {status}{Number(value) > 50 && ' ควรพบสัตวแพทย์'}
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>ปกติ: 20-40 ครั้ง | เฝ้าระวัง: 41-50 | หอบเหนื่อย: 50+</div>
    </div>
  )
}

export default function CatHealth() {
  const [cats, setCats] = useState<Cat[]>([])
  const [catId, setCatId] = useState<string>('')
  const [tab, setTab] = useState('profile')
  const [catMod, setCatMod] = useState(false)
  const [catEd, setCatEd] = useState<Partial<Cat>>(EC)
  const [catIsE, setCatIsE] = useState(false)
  const [logs, setLogs] = useState<DLog[]>([])
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [dMod, setDMod] = useState(false)
  const [dEd, setDEd] = useState<Partial<DLog>>(ED)
  const [dIsE, setDIsE] = useState(false)
  const [vets, setVets] = useState<VVis[]>([])
  const [vMod, setVMod] = useState(false)
  const [vEd, setVEd] = useState<Partial<VVis>>(EV)
  const [vIsE, setVIsE] = useState(false)
  const [vaccs, setVaccs] = useState<Vacc[]>([])
  const [vcMod, setVcMod] = useState(false)
  const [vcEd, setVcEd] = useState<Partial<Vacc>>(EVC)
  const [vcIsE, setVcIsE] = useState(false)

  const fetchCats = useCallback(async () => {
    const r = await fetch('/api/cat-health/cats', { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) {
      const data = await r.json()
      setCats(data)
      
    }
  }, [catId])
  const fetchLogs = useCallback(async () => {
    if (!catId) return
    const r = await fetch(`/api/cat-health/daily-logs?catId=${catId}&month=${month}`, { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) { const d = await r.json(); setLogs(d.data || d) }
  }, [catId, month])
  const fetchVets = useCallback(async () => {
    if (!catId) return
    const r = await fetch(`/api/cat-health/vet?catId=${catId}`, { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) setVets(await r.json())
  }, [catId])
  const fetchVaccs = useCallback(async () => {
    if (!catId) return
    const r = await fetch(`/api/cat-health/vaccinations?catId=${catId}`, { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) setVaccs(await r.json())
  }, [catId])

  useEffect(() => { fetchCats() }, [])
  useEffect(() => { if (tab === 'daily') fetchLogs() }, [tab, catId, fetchLogs])
  useEffect(() => { if (tab === 'vet') fetchVets() }, [tab, catId, fetchVets])
  useEffect(() => { if (tab === 'vacc') fetchVaccs() }, [tab, catId, fetchVaccs])

  const selectedCat = cats.find(c => c.id === catId)

  async function saveCat() {
    const url = catIsE ? `/api/cat-health/cats/${catEd.id}` : '/api/cat-health/cats'
    const r = await fetch(url, { method: catIsE ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(catEd) })
    if (r.ok) {
      setCatMod(false); setCatEd(EC); setCatIsE(false)
      await fetchCats()
      if (!catIsE) { const d = await r.json(); setCatId(d.id) }
    }
  }
  async function delCat(id: string) {
    if (!confirm('ลบแมวตัวนี้และข้อมูลทั้งหมด?')) return
    await fetch(`/api/cat-health/cats/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    setCatId('')
    fetchCats()
  }
  async function saveLog() {
    const url = dIsE ? `/api/cat-health/daily/${dEd.id}` : '/api/cat-health/daily'
    const r = await fetch(url, { method: dIsE ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ ...dEd, catId }) })
    if (r.ok) { setDMod(false); setDEd(ED); setDIsE(false); fetchLogs() }
  }
  async function delLog(id: string) {
    if (!confirm('ลบบันทึกนี้?')) return
    await fetch(`/api/cat-health/daily/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    fetchLogs()
  }
  async function saveVet() {
    const url = vIsE ? `/api/cat-health/vet/${vEd.id}` : '/api/cat-health/vet'
    const r = await fetch(url, { method: vIsE ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ ...vEd, catId }) })
    if (r.ok) { setVMod(false); setVEd(EV); setVIsE(false); fetchVets() }
  }
  async function delVet(id: string) {
    if (!confirm('ลบบันทึกนี้?')) return
    await fetch(`/api/cat-health/vet/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    fetchVets()
  }
  async function saveVacc() {
    const url = vcIsE ? `/api/cat-health/vaccinations/${vcEd.id}` : '/api/cat-health/vaccinations'
    const r = await fetch(url, { method: vcIsE ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ ...vcEd, catId }) })
    if (r.ok) { setVcMod(false); setVcEd(EVC); setVcIsE(false); fetchVaccs() }
  }
  async function delVacc(id: string) {
    if (!confirm('ลบข้อมูลวัคซีนนี้?')) return
    await fetch(`/api/cat-health/vaccinations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    fetchVaccs()
  }

  function tabSt(id: string): CSSProperties {
    const a = tab === id
    return { padding: '10px 18px', cursor: 'pointer', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: a ? '3px solid #6366f1' : '3px solid transparent', fontWeight: a ? 700 : 400, color: a ? '#818cf8' : '#64748b', background: 'none', fontSize: 14, whiteSpace: 'nowrap' as const }
  }

  const card: CSSProperties = { background: '#1a1d2e', borderRadius: 12, padding: 20, border: '1px solid #2d3154' }
  const btnPrimary: CSSProperties = { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }
  const btnEdit: CSSProperties = { padding: '4px 12px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'none', cursor: 'pointer' }
  const btnDel: CSSProperties = { padding: '4px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', cursor: 'pointer' }

  return (
    <AppShell>
      <Header title="สุขภาพแมว" />
      <div style={{ padding: '24px', flex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Cat selector */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' as const }}>
            <select value={catId} onChange={e => setCatId(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2d3154', background: '#1a1d2e', color: 'white', fontSize: 15, fontWeight: 600, minWidth: 160 }}>
              {cats.length === 0 && <option value="">ยังไม่มีแมว</option>}
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => { setCatEd(EC); setCatIsE(false); setCatMod(true) }} style={btnPrimary}>+ เพิ่มแมว</button>
            {selectedCat && (
              <>
                <button onClick={() => { setCatEd(selectedCat); setCatIsE(true); setCatMod(true) }} style={btnEdit}>แก้ไขข้อมูล</button>
                <button onClick={() => delCat(catId)} style={btnDel}>ลบแมวตัวนี้</button>
              </>
            )}
          </div>

          {cats.length === 0 ? (
            <div style={{ ...card, textAlign: 'center' as const, padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🐱</div>
              <div style={{ color: '#94a3b8', fontSize: 16, marginBottom: 20 }}>ยังไม่มีข้อมูลแมว กดเพิ่มแมวเพื่อเริ่มต้น</div>
              <button onClick={() => { setCatEd(EC); setCatIsE(false); setCatMod(true) }} style={btnPrimary}>+ เพิ่มแมวตัวแรก</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', borderBottom: '1px solid #2d3154', marginBottom: 24, overflowX: 'auto' as const }}>
                {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={tabSt(t.id)}>{t.label}</button>)}
              </div>

              {tab === 'profile' && selectedCat && (
                <div style={card}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 20 }}>ข้อมูล {selectedCat.name}</h2>
                  <div style={IS}>
                    {[['ชื่อ', selectedCat.name], ['สายพันธุ์', selectedCat.breed || '-'], ['สี', selectedCat.color || '-'],
                      ['วันเกิด', fmt(selectedCat.birthDate || '')], ['น้ำหนัก (kg)', selectedCat.weight || '-'],
                      ['ไมโครชิป', selectedCat.microchip || '-'], ['แพ้อะไร', selectedCat.allergy || '-'], ['หมายเหตุ', selectedCat.note || '-']
                    ].map(([k, v]) => (
                      <div key={k}><div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{k}</div><div style={{ fontWeight: 500, color: 'white' }}>{v}</div></div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'daily' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2d3154', background: '#1a1d2e', color: 'white' }} />
                    <button onClick={() => { setDEd(ED); setDIsE(false); setDMod(true) }} style={btnPrimary}>+ เพิ่มบันทึก</button>
                  </div>
                  {logs.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' as const, padding: 40 }}>ยังไม่มีบันทึกในเดือนนี้</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                      {logs.map(l => (
                        <div key={l.id} style={card}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{fmt(l.logDate)}</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => { setDEd(l); setDIsE(true); setDMod(true) }} style={btnEdit}>แก้ไข</button>
                              <button onClick={() => delLog(l.id)} style={btnDel}>ลบ</button>
                            </div>
                          </div>
                          <div style={{ ...IS, marginTop: 12 }}>
                            <div><span style={{ color: '#64748b', fontSize: 12 }}>น้ำหนัก: </span><span style={{ color: 'white' }}>{l.weight || '-'} kg</span></div>
                            <div><span style={{ color: '#64748b', fontSize: 12 }}>อาหาร: </span><span style={{ color: 'white' }}>{l.food || '-'}</span></div>
                            <div><span style={{ color: '#64748b', fontSize: 12 }}>น้ำ: </span><span style={{ color: 'white' }}>{l.water || '-'}</span></div>
                            <div><span style={{ color: '#64748b', fontSize: 12 }}>อุจจาระ: </span><span style={{ color: 'white' }}>{l.poop || '-'}</span></div>
                            <div><span style={{ color: '#64748b', fontSize: 12 }}>อารมณ์: </span><span style={{ color: 'white' }}>{l.mood || '-'}</span></div>
                            <div><span style={{ color: '#64748b', fontSize: 12 }}>อาการ: </span><span style={{ color: 'white' }}>{l.symptom || '-'}</span></div>
                            {l.breathRate && <div><span style={{ color: '#64748b', fontSize: 12 }}>หายใจ: </span><span style={{ color: Number(l.breathRate) > 50 ? '#f87171' : Number(l.breathRate) > 40 ? '#fbbf24' : '#4ade80' }}>{l.breathRate} ครั้ง/นาที</span></div>}
                          </div>
                          {l.note && <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 13 }}>{l.note}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'vet' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button onClick={() => { setVEd(EV); setVIsE(false); setVMod(true) }} style={btnPrimary}>+ เพิ่มบันทึก</button>
                  </div>
                  {vets.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' as const, padding: 40 }}>ยังไม่มีบันทึกการพบหมอ</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                      {vets.map(v => (
                        <div key={v.id} style={card}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{fmt(v.visitDate)}</div>
                              <div style={{ color: '#818cf8', fontWeight: 600 }}>{v.clinic}{v.doctor ? ` — ${v.doctor}` : ''}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => { setVEd(v); setVIsE(true); setVMod(true) }} style={btnEdit}>แก้ไข</button>
                              <button onClick={() => delVet(v.id)} style={btnDel}>ลบ</button>
                            </div>
                          </div>
                          <div style={{ marginTop: 12 }}>
                            {v.reason && <div><span style={{ color: '#64748b', fontSize: 12 }}>เหตุผล: </span><span style={{ color: 'white' }}>{v.reason}</span></div>}
                            {v.diagnosis && <div><span style={{ color: '#64748b', fontSize: 12 }}>การวินิจฉัย: </span><span style={{ color: 'white' }}>{v.diagnosis}</span></div>}
                            {v.treatment && <div><span style={{ color: '#64748b', fontSize: 12 }}>การรักษา: </span><span style={{ color: 'white' }}>{v.treatment}</span></div>}
                            {v.cost && <div><span style={{ color: '#64748b', fontSize: 12 }}>ค่าใช้จ่าย: </span><span style={{ color: 'white' }}>฿{v.cost}</span></div>}
                            {v.nextDate && <div style={{ marginTop: 4, color: '#4ade80', fontWeight: 600 }}>นัดครั้งต่อไป: {fmt(v.nextDate)}</div>}
                            {v.note && <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 13 }}>{v.note}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'vacc' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button onClick={() => { setVcEd(EVC); setVcIsE(false); setVcMod(true) }} style={btnPrimary}>+ เพิ่มวัคซีน</button>
                  </div>
                  {vaccs.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' as const, padding: 40 }}>ยังไม่มีบันทึกวัคซีน</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                      {vaccs.map(v => {
                        const overdue = !!(v.nextDate && new Date(v.nextDate) < new Date())
                        return (
                          <div key={v.id} style={{ ...card, border: overdue ? '2px solid #ef4444' : '1px solid #2d3154' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: 'white', marginBottom: 4 }}>{v.vaccineName}</div>
                                {overdue && <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>เกินนัด!</span>}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => { setVcEd(v); setVcIsE(true); setVcMod(true) }} style={btnEdit}>แก้ไข</button>
                                <button onClick={() => delVacc(v.id)} style={btnDel}>ลบ</button>
                              </div>
                            </div>
                            <div style={{ marginTop: 12 }}>
                              <div><span style={{ color: '#64748b', fontSize: 12 }}>วันที่ฉีด: </span><span style={{ color: 'white' }}>{fmt(v.vacDate)}</span></div>
                              {v.nextDate && <div style={{ color: overdue ? '#f87171' : '#4ade80', fontWeight: 600, marginTop: 4 }}>นัดครั้งต่อไป: {fmt(v.nextDate)}</div>}
                              {v.clinic && <div style={{ marginTop: 4 }}><span style={{ color: '#64748b', fontSize: 12 }}>คลินิก/หมอ: </span><span style={{ color: 'white' }}>{v.clinic}</span></div>}
                              {v.note && <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 13 }}>{v.note}</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Cat Modal */}
      <Modal open={catMod} onClose={() => { setCatMod(false); setCatEd(EC); setCatIsE(false) }} title={catIsE ? 'แก้ไขข้อมูลแมว' : 'เพิ่มแมวใหม่'}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div><Lbl t="ชื่อแมว *" /><Inp val={catEd.name || ''} onChange={v => setCatEd({ ...catEd, name: v })} placeholder="ชื่อแมว" /></div>
          <div style={IS}>
            <div><Lbl t="สายพันธุ์" /><Inp val={catEd.breed || ''} onChange={v => setCatEd({ ...catEd, breed: v })} /></div>
            <div><Lbl t="สี" /><Inp val={catEd.color || ''} onChange={v => setCatEd({ ...catEd, color: v })} /></div>
            <div><Lbl t="วันเกิด" /><Inp val={catEd.birthDate || ''} onChange={v => setCatEd({ ...catEd, birthDate: v })} type="date" /></div>
            <div><Lbl t="น้ำหนัก (kg)" /><Inp val={catEd.weight || ''} onChange={v => setCatEd({ ...catEd, weight: v })} /></div>
            <div><Lbl t="ไมโครชิป" /><Inp val={catEd.microchip || ''} onChange={v => setCatEd({ ...catEd, microchip: v })} /></div>
            <div><Lbl t="แพ้อะไร" /><Inp val={catEd.allergy || ''} onChange={v => setCatEd({ ...catEd, allergy: v })} /></div>
          </div>
          <div><Lbl t="หมายเหตุ" /><textarea value={catEd.note || ''} onChange={e => setCatEd({ ...catEd, note: e.target.value })} style={TA} rows={3} /></div>
          <button onClick={saveCat} style={{ ...btnPrimary, opacity: catEd.name ? 1 : 0.5 }} disabled={!catEd.name}>บันทึก</button>
        </div>
      </Modal>

      {/* Daily Modal */}
      <Modal open={dMod} onClose={() => { setDMod(false); setDEd(ED); setDIsE(false) }} title={dIsE ? 'แก้ไขบันทึกรายวัน' : 'เพิ่มบันทึกรายวัน'}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div><Lbl t="วันที่" /><Inp val={dEd.logDate || ''} onChange={v => setDEd({ ...dEd, logDate: v })} type="date" /></div>
          <div style={IS}>
            <div><Lbl t="น้ำหนัก (kg)" /><Inp val={dEd.weight || ''} onChange={v => setDEd({ ...dEd, weight: v })} /></div>
            <div><Lbl t="อาหาร" /><Inp val={dEd.food || ''} onChange={v => setDEd({ ...dEd, food: v })} /></div>
            <div><Lbl t="น้ำ" /><Inp val={dEd.water || ''} onChange={v => setDEd({ ...dEd, water: v })} /></div>
            <div><Lbl t="อุจจาระ" /><Inp val={dEd.poop || ''} onChange={v => setDEd({ ...dEd, poop: v })} /></div>
            <div><Lbl t="อารมณ์" /><Inp val={dEd.mood || ''} onChange={v => setDEd({ ...dEd, mood: v })} /></div>
            <div><Lbl t="อาการ" /><Inp val={dEd.symptom || ''} onChange={v => setDEd({ ...dEd, symptom: v })} /></div>
          </div>
          <div style={{ background: '#0f1117', borderRadius: 8, padding: 16, border: '1px solid #2d3154' }}>
            <Lbl t="อัตราการหายใจ (ครั้ง/นาที)" />
            <BreathTimer value={dEd.breathRate || ''} onChange={v => setDEd({ ...dEd, breathRate: v })} />
          </div>
          <div><Lbl t="หมายเหตุ" /><textarea value={dEd.note || ''} onChange={e => setDEd({ ...dEd, note: e.target.value })} style={TA} rows={3} /></div>
          <button onClick={saveLog} style={btnPrimary}>บันทึก</button>
        </div>
      </Modal>

      {/* Vet Modal */}
      <Modal open={vMod} onClose={() => { setVMod(false); setVEd(EV); setVIsE(false) }} title={vIsE ? 'แก้ไขบันทึกพบหมอ' : 'เพิ่มบันทึกพบหมอ'}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={IS}>
            <div><Lbl t="วันที่" /><Inp val={vEd.visitDate || ''} onChange={v => setVEd({ ...vEd, visitDate: v })} type="date" /></div>
            <div><Lbl t="คลินิก" /><Inp val={vEd.clinic || ''} onChange={v => setVEd({ ...vEd, clinic: v })} /></div>
            <div><Lbl t="หมอ" /><Inp val={vEd.doctor || ''} onChange={v => setVEd({ ...vEd, doctor: v })} /></div>
            <div><Lbl t="ค่าใช้จ่าย (฿)" /><Inp val={vEd.cost || ''} onChange={v => setVEd({ ...vEd, cost: v })} /></div>
          </div>
          <div><Lbl t="เหตุผล" /><Inp val={vEd.reason || ''} onChange={v => setVEd({ ...vEd, reason: v })} /></div>
          <div><Lbl t="การวินิจฉัย" /><Inp val={vEd.diagnosis || ''} onChange={v => setVEd({ ...vEd, diagnosis: v })} /></div>
          <div><Lbl t="การรักษา" /><Inp val={vEd.treatment || ''} onChange={v => setVEd({ ...vEd, treatment: v })} /></div>
          <div><Lbl t="นัดครั้งต่อไป" /><Inp val={vEd.nextDate || ''} onChange={v => setVEd({ ...vEd, nextDate: v })} type="date" /></div>
          <div><Lbl t="หมายเหตุ" /><textarea value={vEd.note || ''} onChange={e => setVEd({ ...vEd, note: e.target.value })} style={TA} rows={3} /></div>
          <button onClick={saveVet} style={btnPrimary}>บันทึก</button>
        </div>
      </Modal>

      {/* Vacc Modal */}
      <Modal open={vcMod} onClose={() => { setVcMod(false); setVcEd(EVC); setVcIsE(false) }} title={vcIsE ? 'แก้ไขข้อมูลวัคซีน' : 'เพิ่มข้อมูลวัคซีน'}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div><Lbl t="ชื่อวัคซีน" /><Inp val={vcEd.vaccineName || ''} onChange={v => setVcEd({ ...vcEd, vaccineName: v })} placeholder="Tricat, Rabies, FeLV..." /></div>
          <div style={IS}>
            <div><Lbl t="วันที่ฉีด" /><Inp val={vcEd.vacDate || ''} onChange={v => setVcEd({ ...vcEd, vacDate: v })} type="date" /></div>
            <div><Lbl t="วันนัดครั้งต่อไป" /><Inp val={vcEd.nextDate || ''} onChange={v => setVcEd({ ...vcEd, nextDate: v })} type="date" /></div>
          </div>
          <div><Lbl t="คลินิก/หมอ" /><Inp val={vcEd.clinic || ''} onChange={v => setVcEd({ ...vcEd, clinic: v })} /></div>
          <div><Lbl t="หมายเหตุ" /><textarea value={vcEd.note || ''} onChange={e => setVcEd({ ...vcEd, note: e.target.value })} style={TA} rows={3} /></div>
          <button onClick={saveVacc} style={btnPrimary}>บันทึก</button>
        </div>
      </Modal>
    </AppShell>
  )
}
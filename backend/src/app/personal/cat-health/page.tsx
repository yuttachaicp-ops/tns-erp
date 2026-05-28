'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { CSSProperties } from 'react'

interface Prof { id: string; name: string; breed: string; color: string; birthDate: string; weight: string; microchip: string; allergy: string; note: string }
interface DLog { id: string; logDate: string; weight: string; food: string; water: string; poop: string; mood: string; symptom: string; note: string }
interface VVis { id: string; visitDate: string; clinic: string; doctor: string; reason: string; diagnosis: string; treatment: string; cost: string; nextDate: string; note: string }
interface Vacc { id: string; vaccineName: string; vacDate: string; nextDate: string; clinic: string; note: string }

const EP: Partial<Prof> = { name: '', breed: '', color: '', birthDate: '', weight: '', microchip: '', allergy: '', note: '' }
const ED: Partial<DLog> = { logDate: new Date().toISOString().split('T')[0], weight: '', food: '', water: '', poop: '', mood: '', symptom: '', note: '' }
const EV: Partial<VVis> = { visitDate: new Date().toISOString().split('T')[0], clinic: '', doctor: '', reason: '', diagnosis: '', treatment: '', cost: '', nextDate: '', note: '' }
const EVC: Partial<Vacc> = { vaccineName: '', vacDate: new Date().toISOString().split('T')[0], nextDate: '', clinic: '', note: '' }
const IS: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
const TA: CSSProperties = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontFamily: 'inherit', resize: 'vertical' as const }
const TABS = [
  { id: 'profile', label: '🐱 ข้อมูลแมว' },
  { id: 'daily', label: '📋 บันทึกรายวัน' },
  { id: 'vet', label: '🏥 บันทึกพบหมอ' },
  { id: 'vacc', label: '💉 วัคซีน' },
]

function Lbl({ t }: { t: string }) {
  return <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>{t}</label>
}
function Inp({ val, onChange, type = 'text', placeholder = '' }: { val: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' as const }} />
}

function tok(): string { return typeof window === 'undefined' ? '' : localStorage.getItem('token') || '' }
function fmt(d: string): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function CatHealth() {
  const [tab, setTab] = useState('profile')
  const [prof, setProf] = useState<Partial<Prof>>(EP)
  const [editP, setEditP] = useState(false)
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

  const fetchProf = useCallback(async () => {
    const r = await fetch('/api/cat-health/profile', { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) { const d = await r.json(); setProf(d || EP) }
  }, [])
  const fetchLogs = useCallback(async () => {
    const r = await fetch(`/api/cat-health/daily?month=${month}`, { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) setLogs(await r.json())
  }, [month])
  const fetchVets = useCallback(async () => {
    const r = await fetch('/api/cat-health/vet', { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) setVets(await r.json())
  }, [])
  const fetchVaccs = useCallback(async () => {
    const r = await fetch('/api/cat-health/vaccinations', { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) setVaccs(await r.json())
  }, [])

  useEffect(() => { fetchProf() }, [fetchProf])
  useEffect(() => { if (tab === 'daily') fetchLogs() }, [tab, fetchLogs])
  useEffect(() => { if (tab === 'vet') fetchVets() }, [tab, fetchVets])
  useEffect(() => { if (tab === 'vacc') fetchVaccs() }, [tab, fetchVaccs])

  async function saveProf() {
    const r = await fetch('/api/cat-health/profile', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(prof) })
    if (r.ok) { setEditP(false); fetchProf() }
  }
  async function saveLog() {
    const url = dIsE ? `/api/cat-health/daily/${dEd.id}` : '/api/cat-health/daily'
    const r = await fetch(url, { method: dIsE ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(dEd) })
    if (r.ok) { setDMod(false); setDEd(ED); setDIsE(false); fetchLogs() }
  }
  async function delLog(id: string) {
    if (!confirm('ลบบันทึกนี้?')) return
    await fetch(`/api/cat-health/daily/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    fetchLogs()
  }
  async function saveVet() {
    const url = vIsE ? `/api/cat-health/vet/${vEd.id}` : '/api/cat-health/vet'
    const r = await fetch(url, { method: vIsE ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(vEd) })
    if (r.ok) { setVMod(false); setVEd(EV); setVIsE(false); fetchVets() }
  }
  async function delVet(id: string) {
    if (!confirm('ลบบันทึกนี้?')) return
    await fetch(`/api/cat-health/vet/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    fetchVets()
  }
  async function saveVacc() {
    const url = vcIsE ? `/api/cat-health/vaccinations/${vcEd.id}` : '/api/cat-health/vaccinations'
    const r = await fetch(url, { method: vcIsE ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify(vcEd) })
    if (r.ok) { setVcMod(false); setVcEd(EVC); setVcIsE(false); fetchVaccs() }
  }
  async function delVacc(id: string) {
    if (!confirm('ลบข้อมูลวัคซีนนี้?')) return
    await fetch(`/api/cat-health/vaccinations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    fetchVaccs()
  }

  function tabSt(id: string): CSSProperties {
    const a = tab === id
    return { padding: '10px 18px', cursor: 'pointer', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: a ? '3px solid #6c63ff' : '3px solid transparent', fontWeight: a ? 700 : 400, color: a ? '#6c63ff' : '#666', background: 'none', fontSize: 14, whiteSpace: 'nowrap' as const }
  }

  const profFields: [string, string][] = [
    ['ชื่อ', prof.name || '-'], ['สายพันธุ์', prof.breed || '-'],
    ['สี', prof.color || '-'], ['วันเกิด', fmt(prof.birthDate || '')],
    ['น้ำหนัก (kg)', prof.weight || '-'], ['ไมโครชิป', prof.microchip || '-'],
    ['แพ้อะไร', prof.allergy || '-'], ['หมายเหตุ', prof.note || '-'],
  ]

  const card: CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
  const btnPrimary: CSSProperties = { padding: '10px 20px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }
  const btnEdit: CSSProperties = { padding: '4px 12px', borderRadius: 6, background: '#f0efff', color: '#6c63ff', border: 'none', cursor: 'pointer' }
  const btnDel: CSSProperties = { padding: '4px 12px', borderRadius: 6, background: '#fff0f0', color: '#e74c3c', border: 'none', cursor: 'pointer' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Header title="?????????" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🐾 สุขภาพแมว</h1>
        <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: 24, overflowX: 'auto' as const }}>
          {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={tabSt(t.id)}>{t.label}</button>)}
        </div>

        {tab === 'profile' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>ข้อมูลส่วนตัวแมว</h2>
              <button onClick={() => setEditP(!editP)} style={{ ...btnPrimary, background: editP ? '#eee' : '#6c63ff', color: editP ? '#333' : '#fff' }}>
                {editP ? 'ยกเลิก' : '✏️ แก้ไข'}
              </button>
            </div>
            {!editP ? (
              <div style={IS}>{profFields.map(([k, v]) => (
                <div key={k}><div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{k}</div><div style={{ fontWeight: 500 }}>{v}</div></div>
              ))}</div>
            ) : (
              <div>
                <div style={IS}>
                  <div><Lbl t="ชื่อ" /><Inp val={prof.name || ''} onChange={v => setProf({ ...prof, name: v })} /></div>
                  <div><Lbl t="สายพันธุ์" /><Inp val={prof.breed || ''} onChange={v => setProf({ ...prof, breed: v })} /></div>
                  <div><Lbl t="สี" /><Inp val={prof.color || ''} onChange={v => setProf({ ...prof, color: v })} /></div>
                  <div><Lbl t="วันเกิด" /><Inp val={prof.birthDate || ''} onChange={v => setProf({ ...prof, birthDate: v })} type="date" /></div>
                  <div><Lbl t="น้ำหนัก (kg)" /><Inp val={prof.weight || ''} onChange={v => setProf({ ...prof, weight: v })} /></div>
                  <div><Lbl t="ไมโครชิป" /><Inp val={prof.microchip || ''} onChange={v => setProf({ ...prof, microchip: v })} /></div>
                </div>
                <div style={{ marginTop: 12 }}><Lbl t="แพ้อะไร" /><Inp val={prof.allergy || ''} onChange={v => setProf({ ...prof, allergy: v })} /></div>
                <div style={{ marginTop: 12 }}><Lbl t="หมายเหตุ" /><textarea value={prof.note || ''} onChange={e => setProf({ ...prof, note: e.target.value })} style={TA} rows={3} /></div>
                <button onClick={saveProf} style={{ ...btnPrimary, marginTop: 16 }}>💾 บันทึก</button>
              </div>
            )}
          </div>
        )}

        {tab === 'daily' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }} />
              <button onClick={() => { setDEd(ED); setDIsE(false); setDMod(true) }} style={btnPrimary}>+ เพิ่มบันทึก</button>
            </div>
            {logs.length === 0 ? <p style={{ color: '#888', textAlign: 'center' as const, padding: 40 }}>ยังไม่มีบันทึกในเดือนนี้</p> : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {logs.map(l => (
                  <div key={l.id} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(l.logDate)}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setDEd(l); setDIsE(true); setDMod(true) }} style={btnEdit}>แก้ไข</button>
                        <button onClick={() => delLog(l.id)} style={btnDel}>ลบ</button>
                      </div>
                    </div>
                    <div style={{ ...IS, marginTop: 12 }}>
                      <div><span style={{ color: '#888', fontSize: 12 }}>น้ำหนัก: </span>{l.weight || '-'} kg</div>
                      <div><span style={{ color: '#888', fontSize: 12 }}>อาหาร: </span>{l.food || '-'}</div>
                      <div><span style={{ color: '#888', fontSize: 12 }}>น้ำ: </span>{l.water || '-'}</div>
                      <div><span style={{ color: '#888', fontSize: 12 }}>อุจจาระ: </span>{l.poop || '-'}</div>
                      <div><span style={{ color: '#888', fontSize: 12 }}>อารมณ์: </span>{l.mood || '-'}</div>
                      <div><span style={{ color: '#888', fontSize: 12 }}>อาการ: </span>{l.symptom || '-'}</div>
                    </div>
                    {l.note && <div style={{ marginTop: 8, color: '#555', fontSize: 13 }}>📝 {l.note}</div>}
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
            {vets.length === 0 ? <p style={{ color: '#888', textAlign: 'center' as const, padding: 40 }}>ยังไม่มีบันทึกการพบหมอ</p> : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {vets.map(v => (
                  <div key={v.id} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(v.visitDate)}</div>
                        <div style={{ color: '#6c63ff', fontWeight: 600 }}>{v.clinic}{v.doctor ? ` — ${v.doctor}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setVEd(v); setVIsE(true); setVMod(true) }} style={btnEdit}>แก้ไข</button>
                        <button onClick={() => delVet(v.id)} style={btnDel}>ลบ</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      {v.reason && <div><span style={{ color: '#888', fontSize: 12 }}>เหตุผล: </span>{v.reason}</div>}
                      {v.diagnosis && <div><span style={{ color: '#888', fontSize: 12 }}>การวินิจฉัย: </span>{v.diagnosis}</div>}
                      {v.treatment && <div><span style={{ color: '#888', fontSize: 12 }}>การรักษา: </span>{v.treatment}</div>}
                      {v.cost && <div><span style={{ color: '#888', fontSize: 12 }}>ค่าใช้จ่าย: </span>฿{v.cost}</div>}
                      {v.nextDate && <div style={{ marginTop: 4, color: '#2ecc71', fontWeight: 600 }}>📅 นัดครั้งต่อไป: {fmt(v.nextDate)}</div>}
                      {v.note && <div style={{ marginTop: 4, color: '#555', fontSize: 13 }}>📝 {v.note}</div>}
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
            {vaccs.length === 0 ? <p style={{ color: '#888', textAlign: 'center' as const, padding: 40 }}>ยังไม่มีบันทึกวัคซีน</p> : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {vaccs.map(v => {
                  const overdue = !!(v.nextDate && new Date(v.nextDate) < new Date())
                  return (
                    <div key={v.id} style={{ ...card, border: overdue ? '2px solid #e74c3c' : '2px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{v.vaccineName}</div>
                          {overdue && <span style={{ background: '#e74c3c', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>เกินนัด!</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setVcEd(v); setVcIsE(true); setVcMod(true) }} style={btnEdit}>แก้ไข</button>
                          <button onClick={() => delVacc(v.id)} style={btnDel}>ลบ</button>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <div><span style={{ color: '#888', fontSize: 12 }}>วันที่ฉีด: </span>{fmt(v.vacDate)}</div>
                        {v.nextDate && <div style={{ color: overdue ? '#e74c3c' : '#2ecc71', fontWeight: 600, marginTop: 4 }}>📅 นัดครั้งต่อไป: {fmt(v.nextDate)}</div>}
                        {v.clinic && <div style={{ marginTop: 4 }}><span style={{ color: '#888', fontSize: 12 }}>คลินิก/หมอ: </span>{v.clinic}</div>}
                        {v.note && <div style={{ marginTop: 4, color: '#555', fontSize: 13 }}>📝 {v.note}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

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
          <div><Lbl t="หมายเหตุ" /><textarea value={dEd.note || ''} onChange={e => setDEd({ ...dEd, note: e.target.value })} style={TA} rows={3} /></div>
          <button onClick={saveLog} style={btnPrimary}>💾 บันทึก</button>
        </div>
      </Modal>

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
          <button onClick={saveVet} style={btnPrimary}>💾 บันทึก</button>
        </div>
      </Modal>

      <Modal open={vcMod} onClose={() => { setVcMod(false); setVcEd(EVC); setVcIsE(false) }} title={vcIsE ? 'แก้ไขข้อมูลวัคซีน' : 'เพิ่มข้อมูลวัคซีน'}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div><Lbl t="ชื่อวัคซีน" /><Inp val={vcEd.vaccineName || ''} onChange={v => setVcEd({ ...vcEd, vaccineName: v })} placeholder="Tricat, Rabies, FeLV..." /></div>
          <div style={IS}>
            <div><Lbl t="วันที่ฉีด" /><Inp val={vcEd.vacDate || ''} onChange={v => setVcEd({ ...vcEd, vacDate: v })} type="date" /></div>
            <div><Lbl t="วันนัดครั้งต่อไป" /><Inp val={vcEd.nextDate || ''} onChange={v => setVcEd({ ...vcEd, nextDate: v })} type="date" /></div>
          </div>
          <div><Lbl t="คลินิก/หมอ" /><Inp val={vcEd.clinic || ''} onChange={v => setVcEd({ ...vcEd, clinic: v })} /></div>
          <div><Lbl t="หมายเหตุ" /><textarea value={vcEd.note || ''} onChange={e => setVcEd({ ...vcEd, note: e.target.value })} style={TA} rows={3} /></div>
          <button onClick={saveVacc} style={btnPrimary}>💾 บันทึก</button>
        </div>
      </Modal>
    </div>
  )
}
'use client'
import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Link from 'next/link'

function tok() { return typeof window === 'undefined' ? '' : localStorage.getItem('tns-token') || '' }
function fmt(n: number) { return n.toLocaleString('th-TH', { maximumFractionDigits: 0 }) }
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'เมื่อกี้'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface Issue {
  id: string; title: string; description: string; severity: string; status: string; createdAt: string; resolvedAt: string | null
}

const SEV_COLOR: Record<string, string> = { LOW: '#00ff88', MEDIUM: '#ffd60a', HIGH: '#ff8800', CRITICAL: '#ff4444' }
const SEV_LABEL: Record<string, string> = { LOW: 'LOW', MEDIUM: 'MED', HIGH: 'HIGH', CRITICAL: 'CRIT' }
const STATUS_COLOR: Record<string, string> = { OPEN: '#ff4444', IN_PROGRESS: '#ffd60a', RESOLVED: '#00ff88' }
const STATUS_LABEL: Record<string, string> = { OPEN: 'OPEN', IN_PROGRESS: 'IN PROG', RESOLVED: 'FIXED' }

function PixelBox({ children, title, color = '#00f5d4', style = {} }: { children: React.ReactNode; title?: string; color?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#0a1410', border: `1px solid ${color}44`, position: 'relative', padding: title ? '28px 14px 14px' : '14px', boxShadow: `0 0 10px ${color}0a`, ...style }}>
      {['tl','tr','bl','br'].map(c => (
        <div key={c} style={{ position: 'absolute', top: c.startsWith('t') ? 0 : 'auto', bottom: c.startsWith('b') ? 0 : 'auto', left: c.endsWith('l') ? 0 : 'auto', right: c.endsWith('r') ? 0 : 'auto', width: 8, height: 8, borderTop: c.startsWith('t') ? `2px solid ${color}` : 'none', borderBottom: c.startsWith('b') ? `2px solid ${color}` : 'none', borderLeft: c.endsWith('l') ? `2px solid ${color}` : 'none', borderRight: c.endsWith('r') ? `2px solid ${color}` : 'none' }} />
      ))}
      {title && <div style={{ position: 'absolute', top: -1, left: 10, background: '#060d0b', padding: '0 6px', fontSize: '10px', color, fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.18em', fontWeight: 700 }}>{title}</div>}
      {children}
    </div>
  )
}

function StatusDot({ color = '#00ff88' }: { color?: string }) {
  return <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
}

export default function PixelDashboard() {
  const [time, setTime] = useState('')
  const [issues, setIssues] = useState<Issue[]>([])
  const [photoQ, setPhotoQ] = useState(0)
  const [listingQ, setListingQ] = useState(0)
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [tasks, setTasks] = useState({ todo: 0, inProgress: 0, done: 0 })
  const [loaded, setLoaded] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showIssueDetail, setShowIssueDetail] = useState<Issue | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSev, setNewSev] = useState('MEDIUM')
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [])

  const fetchIssues = useCallback(async () => {
    const r = await fetch('/api/pipeline-issues', { headers: { Authorization: `Bearer ${tok()}` } })
    if (r.ok) setIssues(await r.json())
  }, [])

  useEffect(() => {
    const h = { Authorization: `Bearer ${tok()}` }
    const month = new Date().toISOString().slice(0, 7)
    fetchIssues()
    Promise.all([
      fetch('/api/photo-queue', { headers: h }).then(r => r.json()),
      fetch('/api/listing-queue', { headers: h }).then(r => r.json()),
      fetch(`/api/transactions?month=${month}`, { headers: h }).then(r => r.json()),
      fetch(`/api/daily-logs?month=${month}`, { headers: h }).then(r => r.json()),
    ]).then(([pq, lq, tx, dl]) => {
      const pqArr = Array.isArray(pq?.data) ? pq.data : Array.isArray(pq) ? pq : []
      const lqArr = Array.isArray(lq?.data) ? lq.data : Array.isArray(lq) ? lq : []
      setPhotoQ(pqArr.filter((x: any) => ['PENDING','IN_PROGRESS'].includes(x.status)).length)
      setListingQ(lqArr.filter((x: any) => ['PENDING','IN_PROGRESS'].includes(x.status)).length)
      if (tx?.success) { setIncome(tx.data.income || 0); setExpense(tx.data.expense || 0) }
      if (dl?.success && Array.isArray(dl.data)) {
        const d = dl.data
        setTasks({ todo: d.filter((x: any) => x.status === 'TODO').length, inProgress: d.filter((x: any) => x.status === 'IN_PROGRESS').length, done: d.filter((x: any) => x.status === 'DONE').length })
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [fetchIssues])

  async function addIssue() {
    if (!newTitle.trim()) return
    setAdding(true)
    await fetch('/api/pipeline-issues', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim(), severity: newSev }) })
    setNewTitle(''); setNewDesc(''); setNewSev('MEDIUM'); setShowAddModal(false); setAdding(false)
    fetchIssues()
  }

  async function updateStatus(id: string, status: string) {
    const issue = issues.find(i => i.id === id)
    if (!issue) return
    await fetch(`/api/pipeline-issues/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ ...issue, status }) })
    fetchIssues()
    if (showIssueDetail?.id === id) setShowIssueDetail({ ...showIssueDetail, status })
  }

  async function deleteIssue(id: string) {
    if (!confirm('ลบปัญหานี้?')) return
    await fetch(`/api/pipeline-issues/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } })
    setShowIssueDetail(null); fetchIssues()
  }

  const filtered = filter === 'ALL' ? issues : issues.filter(i => i.status === filter)
  const openCount = issues.filter(i => i.status === 'OPEN').length
  const inProgCount = issues.filter(i => i.status === 'IN_PROGRESS').length
  const resolvedCount = issues.filter(i => i.status === 'RESOLVED').length
  const criticalCount = issues.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length
  const totalTasks = tasks.todo + tasks.inProgress + tasks.done
  const thDate = new Date().toLocaleDateString('th-TH', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })

  const PX = 'Inter, "Noto Sans Thai", sans-serif'

  return (
    <AppShell>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        @keyframes px-blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes px-pulse { 0%,100%{box-shadow:0 0 4px rgba(0,245,212,0.2)} 50%{box-shadow:0 0 16px rgba(0,245,212,0.6)} }
        @keyframes px-warn { 0%,100%{box-shadow:0 0 4px rgba(255,68,68,0.2)} 50%{box-shadow:0 0 14px rgba(255,68,68,0.6)} }
        .px-scanlines { position:relative; }
        .px-scanlines::after { content:''; position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.055) 2px,rgba(0,0,0,0.055) 4px); pointer-events:none; z-index:1; }
        .px-btn:hover { filter:brightness(1.3); }
        .issue-row:hover { background: rgba(0,245,212,0.04) !important; cursor:pointer; }
      `}</style>

      <div className="px-scanlines" style={{ minHeight: '100vh', background: '#060d0b', padding: 16, fontFamily: 'Inter, "Noto Sans Thai", sans-serif' }}>

        {/* TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#00f5d4', letterSpacing: '0.15em', textShadow: '0 0 14px rgba(0,245,212,0.6)', fontFamily: '"Share Tech Mono", monospace' }}>TNS COMMAND CENTER</div>
            <div style={{ fontSize: 11, color: '#5a9a75', letterSpacing: '0.3em' }}>PIPELINE v2.0 — ISSUE TRACKER ONLINE</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#7abf99' }}>{thDate}</span>
            <div style={{ background: '#0d1a14', border: '1px solid #0d4a35', padding: '4px 12px', color: '#00f5d4', fontSize: 15, letterSpacing: '0.18em', fontFamily: '"Share Tech Mono", monospace', textShadow: '0 0 8px rgba(0,245,212,0.5)' }}>⏱ {time || '--:--:--'}</div>
            {criticalCount > 0 && (
              <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.4)', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, animation: 'px-warn 1.2s ease-in-out infinite' }}>
                <span style={{ fontSize: 12, animation: 'px-blink 0.8s step-end infinite' }}>⚠</span>
                <span style={{ fontSize: 11, color: '#ff4444', letterSpacing: '0.1em' }}>{criticalCount} CRITICAL ISSUE{criticalCount > 1 ? 'S' : ''}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)', padding: '4px 10px' }}>
              <StatusDot />
              <span style={{ fontSize: 11, color: '#00ff88', letterSpacing: '0.12em' }}>ALL SYSTEMS ONLINE</span>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12 }}>

          {/* ===== LEFT: ISSUE TRACKER (col 1-8) ===== */}
          <div style={{ gridColumn: 'span 8' }}>
            <PixelBox title="🐛 ISSUE TRACKER — PIPELINE PROBLEMS" color="#ff4444" style={{ minHeight: 400 }}>

              {/* Issue stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'OPEN', val: openCount, c: '#ff4444' },
                  { label: 'IN PROG', val: inProgCount, c: '#ffd60a' },
                  { label: 'RESOLVED', val: resolvedCount, c: '#00ff88' },
                  { label: 'TOTAL', val: issues.length, c: '#00f5d4' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#0d1a14', border: `1px solid ${s.c}22`, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#7abf99', letterSpacing: '0.12em', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.c, textShadow: `0 0 8px ${s.c}66` }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Filter + Add button */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {(['ALL','OPEN','IN_PROGRESS','RESOLVED'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className="px-btn" style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'Inter, "Noto Sans Thai", sans-serif', letterSpacing: '0.1em', cursor: 'pointer', background: filter === f ? 'rgba(0,245,212,0.15)' : 'transparent', border: `1px solid ${filter === f ? '#00f5d4' : '#0d2a1e'}`, color: filter === f ? '#00f5d4' : '#3a6a55', transition: 'all 0.15s' }}>
                    {f === 'IN_PROGRESS' ? 'IN PROG' : f}
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                <button onClick={() => setShowAddModal(true)} className="px-btn" style={{ padding: '5px 14px', fontSize: 10, fontFamily: 'Inter, "Noto Sans Thai", sans-serif', letterSpacing: '0.1em', cursor: 'pointer', background: 'rgba(255,68,68,0.12)', border: '1px solid #ff4444', color: '#ff4444', fontWeight: 700 }}>
                  + REPORT ISSUE
                </button>
              </div>

              {/* Issue List */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a9a75', fontSize: 11, letterSpacing: '0.1em' }}>
                  {filter === 'ALL' ? '[ NO ISSUES REPORTED — SYSTEM CLEAN ✓ ]' : `[ NO ${filter} ISSUES ]`}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 56px 72px 70px 70px', gap: 8, padding: '4px 8px', borderBottom: '1px solid #0d2a1e', marginBottom: 2 }}>
                    {['SEV','ISSUE TITLE','STATUS','TIME','ACTION',''].map(h => (
                      <div key={h} style={{ fontSize: 10, color: '#5a9a75', letterSpacing: '0.15em' }}>{h}</div>
                    ))}
                  </div>
                  {filtered.map(issue => (
                    <div key={issue.id} className="issue-row" onClick={() => setShowIssueDetail(issue)}
                      style={{ display: 'grid', gridTemplateColumns: '60px 1fr 56px 72px 70px 70px', gap: 8, padding: '10px', background: 'transparent', borderBottom: '1px solid #0a1a12', alignItems: 'center', transition: 'background 0.1s' }}>

                      {/* Severity */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, background: SEV_COLOR[issue.severity], boxShadow: `0 0 4px ${SEV_COLOR[issue.severity]}`, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: SEV_COLOR[issue.severity], letterSpacing: '0.08em' }}>{SEV_LABEL[issue.severity]}</span>
                      </div>

                      {/* Title */}
                      <div>
                        <div style={{ fontSize: 11, color: issue.status === 'RESOLVED' ? '#3a6a55' : '#c8f0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: issue.status === 'RESOLVED' ? 'line-through' : 'none' }}>{issue.title}</div>
                        {issue.description && <div style={{ fontSize: 11, color: '#6aaa88', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{issue.description}</div>}
                      </div>

                      {/* Status badge */}
                      <div style={{ background: `${STATUS_COLOR[issue.status]}15`, border: `1px solid ${STATUS_COLOR[issue.status]}44`, padding: '2px 4px', textAlign: 'center' }}>
                        <span style={{ fontSize: 10, color: STATUS_COLOR[issue.status], letterSpacing: '0.05em' }}>{STATUS_LABEL[issue.status]}</span>
                      </div>

                      {/* Time */}
                      <div style={{ fontSize: 11, color: '#6aaa88' }}>{timeAgo(issue.createdAt)}</div>

                      {/* Quick status change */}
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 3 }}>
                        {issue.status !== 'IN_PROGRESS' && issue.status !== 'RESOLVED' && (
                          <button onClick={() => updateStatus(issue.id, 'IN_PROGRESS')} className="px-btn" title="Mark In Progress"
                            style={{ width: 22, height: 22, background: 'rgba(255,214,10,0.1)', border: '1px solid #ffd60a44', color: '#ffd60a', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙</button>
                        )}
                        {issue.status !== 'RESOLVED' && (
                          <button onClick={() => updateStatus(issue.id, 'RESOLVED')} className="px-btn" title="Mark Resolved"
                            style={{ width: 22, height: 22, background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8844', color: '#00ff88', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                        )}
                        {issue.status === 'RESOLVED' && (
                          <button onClick={() => updateStatus(issue.id, 'OPEN')} className="px-btn" title="Reopen"
                            style={{ width: 22, height: 22, background: 'rgba(255,68,68,0.1)', border: '1px solid #ff444444', color: '#ff4444', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↺</button>
                        )}
                      </div>

                      {/* Delete */}
                      <div onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteIssue(issue.id)} className="px-btn" title="Delete"
                          style={{ width: 22, height: 22, background: 'transparent', border: '1px solid #1a3a2a', color: '#6aaa88', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget.style.borderColor = '#ff4444'); (e.currentTarget.style.color = '#ff4444') }}
                          onMouseLeave={e => { (e.currentTarget.style.borderColor = '#1a3a2a'); (e.currentTarget.style.color = '#2a4a35') }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PixelBox>
          </div>

          {/* ===== RIGHT: STATS (col 9-12) ===== */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Pipeline Log */}
            <PixelBox title="PIPELINE LOG" color="#00ff88">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[['PLAN','✓',true],['CODE','✓',true],['TEST','✓',true],['REVIEW','✓',true]].map(([l,ic,done]) => (
                  <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: done ? '#00ff88' : '#1a5a40', width: 40, fontFamily: 'Inter, "Noto Sans Thai", sans-serif' }}>{l}</span>
                    <div style={{ flex: 1, height: 4, background: '#0d1a14', border: '1px solid #0d2a1e', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: done ? '100%' : '0%', background: 'linear-gradient(90deg,#00ff88,#00f5d4)', boxShadow: done ? '0 0 6px #00ff88' : 'none' }} />
                    </div>
                    <span style={{ fontSize: 11, color: done ? '#00ff88' : '#1a5a40' }}>{done ? '✓' : '○'}</span>
                  </div>
                ))}
                <div style={{ marginTop: 4, textAlign: 'center', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', padding: '5px', fontSize: 11, color: '#00ff88', letterSpacing: '0.15em' }}>
                  ► APPROVED ◄
                </div>
              </div>
            </PixelBox>

            {/* Task Counter */}
            <PixelBox title="DAILY TASKS" color="#00f5d4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[['TODO', tasks.todo, '#ffd60a'], ['ACTIVE', tasks.inProgress, '#00f5d4'], ['DONE', tasks.done, '#00ff88'], ['TOTAL', totalTasks, '#c8f0e0']].map(([k, v, c]) => (
                  <div key={String(k)} style={{ background: '#0d1a14', border: `1px solid ${c}22`, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#7abf99', letterSpacing: '0.1em', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: String(c), textShadow: `0 0 6px ${c}66` }}>{loaded ? v : '…'}</div>
                  </div>
                ))}
              </div>
            </PixelBox>

            {/* Finance */}
            <PixelBox title="FINANCE" color="#ffd60a">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
                  <span style={{ fontSize: 11, color: '#7abf99' }}>INCOME</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#00ff88' }}>฿{loaded ? fmt(income) : '…'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)' }}>
                  <span style={{ fontSize: 11, color: '#7abf99' }}>EXPENSE</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ff6666' }}>฿{loaded ? fmt(expense) : '…'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: '#0d1a14', border: '1px solid #0d4a35' }}>
                  <span style={{ fontSize: 11, color: '#7abf99' }}>NET</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: income - expense >= 0 ? '#00f5d4' : '#ff4444' }}>
                    {income - expense >= 0 ? '+' : ''}฿{loaded ? fmt(income - expense) : '…'}
                  </span>
                </div>
              </div>
            </PixelBox>

            {/* Queue status */}
            <PixelBox title="QUEUES" color="#b44fff">
              {[['📷 PHOTO QUEUE', photoQ, '#ffd60a'], ['🛒 LISTING QUEUE', listingQ, '#b44fff']].map(([l, v, c]) => (
                <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#7abf99' }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: String(c) }}>{loaded ? v : '…'}</span>
                </div>
              ))}
              <Link href="/dashboard" style={{ display: 'block', textAlign: 'center', fontSize: 11, color: '#b44fff', textDecoration: 'none', border: '1px solid #b44fff33', padding: '4px', background: 'rgba(180,79,255,0.06)', letterSpacing: '0.1em' }}>
                → FULL DASHBOARD
              </Link>
            </PixelBox>
          </div>
        </div>

        {/* BOTTOM STATS */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8 }}>
          {[
            { icon: '🐛', label: 'OPEN ISSUES', val: `${openCount}`, c: openCount > 0 ? '#ff4444' : '#00ff88' },
            { icon: '⚙', label: 'IN PROGRESS', val: `${inProgCount}`, c: '#ffd60a' },
            { icon: '✅', label: 'RESOLVED', val: `${resolvedCount}`, c: '#00ff88' },
            { icon: '🤖', label: 'AI AGENTS', val: '4/4 ONLINE', c: '#00ff88' },
            { icon: '🏆', label: 'PIPELINE', val: 'SUCCESS', c: '#00ff88' },
          ].map(s => (
            <div key={s.label} style={{ background: '#080f0c', border: `1px solid ${s.c}22`, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 7, color: '#5a9a75', letterSpacing: '0.12em' }}>{s.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.c }}>{s.val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== ADD ISSUE MODAL ===== */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'Inter, "Noto Sans Thai", sans-serif' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#060d0b', border: '1px solid #ff444466', width: '100%', maxWidth: 460, position: 'relative', padding: 24, boxShadow: '0 0 40px rgba(255,68,68,0.15)' }}>
            {['tl','tr','bl','br'].map(c => (
              <div key={c} style={{ position: 'absolute', top: c.startsWith('t') ? 0 : 'auto', bottom: c.startsWith('b') ? 0 : 'auto', left: c.endsWith('l') ? 0 : 'auto', right: c.endsWith('r') ? 0 : 'auto', width: 8, height: 8, borderTop: c.startsWith('t') ? '2px solid #ff4444' : 'none', borderBottom: c.startsWith('b') ? '2px solid #ff4444' : 'none', borderLeft: c.endsWith('l') ? '2px solid #ff4444' : 'none', borderRight: c.endsWith('r') ? '2px solid #ff4444' : 'none' }} />
            ))}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, background: '#ff4444', boxShadow: '0 0 6px #ff4444', animation: 'px-blink 1s step-end infinite' }} />
                <span style={{ fontSize: 11, color: '#ff4444', letterSpacing: '0.15em', fontWeight: 700 }}>REPORT NEW ISSUE</span>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: '1px solid #1a3a2a', color: '#7abf99', cursor: 'pointer', fontSize: 12, padding: '2px 8px', fontFamily: 'Inter, "Noto Sans Thai", sans-serif' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#7abf99', letterSpacing: '0.18em', marginBottom: 6 }}>ISSUE TITLE *</div>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="ระบุปัญหาที่พบ..."
                  style={{ width: '100%', padding: '9px 12px', background: '#0d1a14', border: '1px solid #0d4a35', color: '#e8f5ef', fontSize: 12, fontFamily: 'Inter, "Noto Sans Thai", sans-serif', outline: 'none', boxSizing: 'border-box' as const }}
                  onFocus={e => e.target.style.borderColor = '#ff4444'}
                  onBlur={e => e.target.style.borderColor = '#0d4a35'} />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#7abf99', letterSpacing: '0.18em', marginBottom: 6 }}>DESCRIPTION (OPTIONAL)</div>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="รายละเอียดเพิ่มเติม..."
                  style={{ width: '100%', padding: '9px 12px', background: '#0d1a14', border: '1px solid #0d4a35', color: '#e8f5ef', fontSize: 12, fontFamily: 'Inter, "Noto Sans Thai", sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }}
                  onFocus={e => e.target.style.borderColor = '#ff4444'}
                  onBlur={e => e.target.style.borderColor = '#0d4a35'} />
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#7abf99', letterSpacing: '0.18em', marginBottom: 6 }}>SEVERITY</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['LOW','MEDIUM','HIGH','CRITICAL'] as const).map(s => (
                    <button key={s} onClick={() => setNewSev(s)} className="px-btn"
                      style={{ flex: 1, padding: '6px 4px', fontSize: 11, fontFamily: 'Inter, "Noto Sans Thai", sans-serif', cursor: 'pointer', background: newSev === s ? `${SEV_COLOR[s]}18` : 'transparent', border: `1px solid ${newSev === s ? SEV_COLOR[s] : '#0d2a1e'}`, color: newSev === s ? SEV_COLOR[s] : '#3a6a55', letterSpacing: '0.05em', transition: 'all 0.15s' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={addIssue} disabled={!newTitle.trim() || adding} className="px-btn"
                style={{ padding: '10px', background: newTitle.trim() ? 'rgba(255,68,68,0.12)' : 'transparent', border: `1px solid ${newTitle.trim() ? '#ff4444' : '#1a3a2a'}`, color: newTitle.trim() ? '#ff4444' : '#3a6a55', fontSize: 11, fontWeight: 700, cursor: newTitle.trim() ? 'pointer' : 'not-allowed', letterSpacing: '0.15em', fontFamily: 'Inter, "Noto Sans Thai", sans-serif', transition: 'all 0.15s' }}>
                {adding ? '[ LOGGING... ]' : '[ SUBMIT ISSUE ]'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ISSUE DETAIL MODAL ===== */}
      {showIssueDetail && (
        <div onClick={() => setShowIssueDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'Inter, "Noto Sans Thai", sans-serif' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#060d0b', border: `1px solid ${STATUS_COLOR[showIssueDetail.status]}44`, width: '100%', maxWidth: 480, position: 'relative', padding: 24, boxShadow: `0 0 40px ${STATUS_COLOR[showIssueDetail.status]}15` }}>
            {['tl','tr','bl','br'].map(c => (
              <div key={c} style={{ position: 'absolute', top: c.startsWith('t') ? 0 : 'auto', bottom: c.startsWith('b') ? 0 : 'auto', left: c.endsWith('l') ? 0 : 'auto', right: c.endsWith('r') ? 0 : 'auto', width: 8, height: 8, borderTop: c.startsWith('t') ? `2px solid ${STATUS_COLOR[showIssueDetail.status]}` : 'none', borderBottom: c.startsWith('b') ? `2px solid ${STATUS_COLOR[showIssueDetail.status]}` : 'none', borderLeft: c.endsWith('l') ? `2px solid ${STATUS_COLOR[showIssueDetail.status]}` : 'none', borderRight: c.endsWith('r') ? `2px solid ${STATUS_COLOR[showIssueDetail.status]}` : 'none' }} />
            ))}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 10, color: '#7abf99', letterSpacing: '0.15em' }}>ISSUE DETAIL</span>
              <button onClick={() => setShowIssueDetail(null)} style={{ background: 'transparent', border: '1px solid #1a3a2a', color: '#7abf99', cursor: 'pointer', fontSize: 12, padding: '2px 8px', fontFamily: 'Inter, "Noto Sans Thai", sans-serif' }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, background: SEV_COLOR[showIssueDetail.severity], boxShadow: `0 0 4px ${SEV_COLOR[showIssueDetail.severity]}` }} />
                <span style={{ fontSize: 10, color: SEV_COLOR[showIssueDetail.severity], letterSpacing: '0.12em' }}>SEVERITY: {showIssueDetail.severity}</span>
                <div style={{ width: 1, height: 10, background: '#0d2a1e' }} />
                <span style={{ fontSize: 10, color: STATUS_COLOR[showIssueDetail.status], letterSpacing: '0.1em' }}>STATUS: {showIssueDetail.status}</span>
              </div>
              <div style={{ fontSize: 14, color: '#e8f5ef', marginBottom: 8 }}>{showIssueDetail.title}</div>
              {showIssueDetail.description && <div style={{ fontSize: 11, color: '#7abf99', background: '#0d1a14', padding: '8px 10px', border: '1px solid #0d2a1e', lineHeight: 1.6 }}>{showIssueDetail.description}</div>}
              <div style={{ fontSize: 10, color: '#5a9a75', marginTop: 8 }}>REPORTED: {new Date(showIssueDetail.createdAt).toLocaleString('th-TH')}</div>
              {showIssueDetail.resolvedAt && <div style={{ fontSize: 10, color: '#00ff8866', marginTop: 2 }}>RESOLVED: {new Date(showIssueDetail.resolvedAt).toLocaleString('th-TH')}</div>}
            </div>

            <div style={{ fontSize: 11, color: '#7abf99', letterSpacing: '0.15em', marginBottom: 8 }}>UPDATE STATUS</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['OPEN','IN_PROGRESS','RESOLVED'] as const).map(s => (
                <button key={s} onClick={() => { updateStatus(showIssueDetail.id, s); setShowIssueDetail({ ...showIssueDetail, status: s }) }} className="px-btn"
                  style={{ flex: 1, padding: '7px', fontSize: 11, fontFamily: 'Inter, "Noto Sans Thai", sans-serif', cursor: 'pointer', background: showIssueDetail.status === s ? `${STATUS_COLOR[s]}18` : 'transparent', border: `1px solid ${showIssueDetail.status === s ? STATUS_COLOR[s] : '#0d2a1e'}`, color: showIssueDetail.status === s ? STATUS_COLOR[s] : '#3a6a55', letterSpacing: '0.06em', transition: 'all 0.15s' }}>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            <button onClick={() => deleteIssue(showIssueDetail.id)} className="px-btn"
              style={{ width: '100%', padding: '6px', background: 'transparent', border: '1px solid #1a3a2a', color: '#7abf99', fontSize: 11, cursor: 'pointer', letterSpacing: '0.12em', fontFamily: 'Inter, "Noto Sans Thai", sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = '#ff4444'); (e.currentTarget.style.color = '#ff4444') }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = '#1a3a2a'); (e.currentTarget.style.color = '#3a6a55') }}>
              🗑 DELETE ISSUE
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}

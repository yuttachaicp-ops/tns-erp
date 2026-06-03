'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import Link from 'next/link'

function tok() { return typeof window === 'undefined' ? '' : localStorage.getItem('tns-token') || '' }
function fmt(n: number) { return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

// ---- Pixel components ----
function PixelBox({ children, title, color = '#00f5d4', style = {} }: { children: React.ReactNode; title?: string; color?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#060d0b', border: `1px solid ${color}22`,
      position: 'relative', padding: title ? '28px 14px 14px' : '14px',
      boxShadow: `0 0 12px ${color}10`, ...style
    }}>
      {/* corner brackets */}
      {['tl','tr','bl','br'].map(c => (
        <div key={c} style={{
          position: 'absolute',
          top: c.startsWith('t') ? 0 : 'auto', bottom: c.startsWith('b') ? 0 : 'auto',
          left: c.endsWith('l') ? 0 : 'auto', right: c.endsWith('r') ? 0 : 'auto',
          width: 8, height: 8,
          borderTop: c.startsWith('t') ? `2px solid ${color}` : 'none',
          borderBottom: c.startsWith('b') ? `2px solid ${color}` : 'none',
          borderLeft: c.endsWith('l') ? `2px solid ${color}` : 'none',
          borderRight: c.endsWith('r') ? `2px solid ${color}` : 'none',
        }} />
      ))}
      {title && (
        <div style={{
          position: 'absolute', top: -1, left: 10,
          background: '#060d0b', padding: '0 6px',
          fontSize: '9px', color, fontFamily: '"Share Tech Mono", monospace',
          letterSpacing: '0.2em', fontWeight: 700,
        }}>{title}</div>
      )}
      {children}
    </div>
  )
}

function StatusDot({ on = true, color = '#00ff88' }: { on?: boolean; color?: string }) {
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%',
      background: on ? color : '#1a3a2a',
      boxShadow: on ? `0 0 6px ${color}` : 'none',
      flexShrink: 0,
      animation: on ? 'px-blink 2s ease-in-out infinite' : 'none',
    }} />
  )
}

function AgentCard({ name, role, status, task, avatar }: { name: string; role: string; status: 'WORKING' | 'IDLE' | 'DONE'; task: string; avatar: string }) {
  const colors = { WORKING: '#00f5d4', IDLE: '#ffd60a', DONE: '#00ff88' }
  const c = colors[status]
  return (
    <PixelBox color={c} style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, filter: 'drop-shadow(0 0 4px rgba(0,245,212,0.4))' }}>{avatar}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <StatusDot color={c} on={status !== 'IDLE'} />
            <span style={{ fontSize: 10, color: c, fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.1em' }}>[{status}]</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#c8f0e0', fontFamily: '"Share Tech Mono", monospace' }}>{name}</div>
          <div style={{ fontSize: 9, color: '#3a6a55', fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.1em', marginBottom: 6 }}>{role}</div>
          <div style={{ fontSize: 10, color: '#6aaa88', background: '#0a1612', padding: '4px 6px', borderLeft: `2px solid ${c}44` }}>{task}</div>
        </div>
      </div>
    </PixelBox>
  )
}

function StatBar({ label, value, max, color = '#00f5d4' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: '#3a6a55', fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ fontSize: 9, color, fontFamily: '"Share Tech Mono", monospace' }}>{fmt(value)}/{fmt(max)}</span>
      </div>
      <div style={{ height: 6, background: '#0a1612', border: '1px solid #0d2a1e', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.5s', boxShadow: `0 0 4px ${color}` }} />
      </div>
    </div>
  )
}

function PipelineStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <div style={{
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'rgba(0,255,136,0.15)' : active ? 'rgba(0,245,212,0.15)' : '#0a1612',
        border: `1px solid ${done ? '#00ff88' : active ? '#00f5d4' : '#0d2a1e'}`,
        fontSize: 14,
        boxShadow: done ? '0 0 8px rgba(0,255,136,0.3)' : active ? '0 0 8px rgba(0,245,212,0.4)' : 'none',
        animation: active ? 'px-pulse 1.5s ease-in-out infinite' : 'none',
      }}>
        {done ? '✓' : active ? '⚙' : '○'}
      </div>
      <span style={{ fontSize: 8, color: done ? '#00ff88' : active ? '#00f5d4' : '#1a4a30', fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  )
}

export default function PixelDashboard() {
  const [time, setTime] = useState('')
  const [photoQ, setPhotoQ] = useState(0)
  const [listingQ, setListingQ] = useState(0)
  const [stockClose, setStockClose] = useState(0)
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [tasks, setTasks] = useState({ todo: 0, inProgress: 0, done: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const h = { Authorization: `Bearer ${tok()}` }
    const month = new Date().toISOString().slice(0, 7)
    Promise.all([
      fetch('/api/photo-queue', { headers: h }).then(r => r.json()),
      fetch('/api/listing-queue', { headers: h }).then(r => r.json()),
      fetch('/api/stock-close', { headers: h }).then(r => r.json()),
      fetch(`/api/transactions?month=${month}`, { headers: h }).then(r => r.json()),
      fetch(`/api/daily-logs?month=${month}`, { headers: h }).then(r => r.json()),
    ]).then(([pq, lq, sc, tx, dl]) => {
      if (Array.isArray(pq?.data)) setPhotoQ(pq.data.filter((x: any) => x.status === 'PENDING' || x.status === 'IN_PROGRESS').length)
      else if (Array.isArray(pq)) setPhotoQ(pq.filter((x: any) => x.status === 'PENDING').length)
      if (Array.isArray(lq?.data)) setListingQ(lq.data.filter((x: any) => x.status === 'PENDING' || x.status === 'IN_PROGRESS').length)
      else if (Array.isArray(lq)) setListingQ(lq.filter((x: any) => x.status === 'PENDING').length)
      if (Array.isArray(sc?.data)) setStockClose(sc.data.length)
      else if (Array.isArray(sc)) setStockClose(sc.length)
      if (tx?.success) { setIncome(tx.data.income || 0); setExpense(tx.data.expense || 0) }
      if (dl?.success && Array.isArray(dl.data)) {
        const items = dl.data
        setTasks({ todo: items.filter((x: any) => x.status === 'TODO').length, inProgress: items.filter((x: any) => x.status === 'IN_PROGRESS').length, done: items.filter((x: any) => x.status === 'DONE').length })
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const totalTasks = tasks.todo + tasks.inProgress + tasks.done
  const thDate = new Date().toLocaleDateString('th-TH', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <AppShell>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        @keyframes px-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes px-pulse { 0%,100%{box-shadow:0 0 4px rgba(0,245,212,0.3)} 50%{box-shadow:0 0 14px rgba(0,245,212,0.7)} }
        @keyframes px-scan {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        .px-scanlines::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:1;
          background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px);
        }
      `}</style>

      <div className="px-scanlines" style={{ position: 'relative', minHeight: '100vh', background: '#060d0b', padding: 20, fontFamily: '"Share Tech Mono", monospace' }}>

        {/* ===== TOP BAR ===== */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#00f5d4', letterSpacing: '0.2em', textShadow: '0 0 16px rgba(0,245,212,0.7)' }}>TNS COMMAND CENTER</div>
            <div style={{ fontSize: 9, color: '#1a5a40', letterSpacing: '0.3em' }}>PIPELINE v2.0 — AI AGENT OFFICE</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 9, color: '#3a6a55', letterSpacing: '0.15em' }}>{thDate}</div>
            <div style={{ background: '#0a1612', border: '1px solid #0d4a35', padding: '5px 14px', color: '#00f5d4', fontSize: 16, letterSpacing: '0.2em', textShadow: '0 0 8px rgba(0,245,212,0.6)' }}>
              ⏱ {time || '--:--:--'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)', padding: '4px 10px' }}>
              <StatusDot />
              <span style={{ fontSize: 9, color: '#00ff88', letterSpacing: '0.15em' }}>ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>
        </div>

        {/* OVERNIGHT → MORNING bar */}
        <PixelBox title="PIPELINE STATUS" color="#ffd60a" style={{ marginBottom: 16, padding: '10px 14px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, color: '#3a6a55', letterSpacing: '0.1em' }}>OVERNIGHT:</span>
            <span style={{ fontSize: 10, color: '#00f5d4' }}>AI AGENTS WORK</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {['🤖','→','🤖','→','🤖','→','🤖'].map((x, i) => (
                <span key={i} style={{ fontSize: x === '→' ? 10 : 14, color: x === '→' ? '#1a5a40' : 'inherit', animation: x !== '→' ? `px-blink ${1 + i * 0.3}s ease-in-out infinite` : 'none' }}>{x}</span>
              ))}
            </div>
            <div style={{ width: 1, height: 16, background: '#0d4a35', margin: '0 4px' }} />
            <span style={{ fontSize: 9, color: '#3a6a55', letterSpacing: '0.1em' }}>MORNING:</span>
            <span style={{ fontSize: 10, color: '#ffd60a' }}>HUMAN REVIEWS & APPROVES ✓</span>
          </div>
        </PixelBox>

        {/* ===== MAIN GRID ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>

          {/* TEAM STATUS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 9, color: '#1a5a40', letterSpacing: '0.25em', borderBottom: '1px solid #0d2a1e', paddingBottom: 6 }}>[ TEAM STATUS ]</div>
            <AgentCard name="PLANNER" role="PLAN ROOM AGENT" status="WORKING" task="วางแผนงานและกำหนดเป้าหมาย" avatar="🧑‍💼" />
            <AgentCard name="CODER" role="CODE LAB AGENT" status="WORKING" task="พัฒนาระบบ ERP v2.0" avatar="👨‍💻" />
            <AgentCard name="TESTER" role="QA BAY AGENT" status="WORKING" task="ตรวจสอบระบบทุกฟีเจอร์" avatar="🧑‍🔬" />
            <AgentCard name="REVIEWER" role="REVIEW AGENT" status="DONE" task="VERDICT: RISK LOW ✓" avatar="👨‍💼" />
            <div style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <StatusDot color="#00ff88" />
              <span style={{ fontSize: 9, color: '#00ff88', letterSpacing: '0.1em' }}>ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          {/* PLAN ROOM + PIPELINE LOG */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PixelBox title="PLAN ROOM" color="#00f5d4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[['GOALS', tasks.todo], ['IN PROGRESS', tasks.inProgress], ['DONE', tasks.done], ['TOTAL', totalTasks]].map(([k, v]) => (
                  <div key={String(k)} style={{ background: '#0a1612', padding: '8px 10px', border: '1px solid #0d2a1e', textAlign: 'center' }}>
                    <div style={{ fontSize: 8, color: '#3a6a55', letterSpacing: '0.15em', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#00f5d4', textShadow: '0 0 8px rgba(0,245,212,0.5)' }}>{loaded ? v : '…'}</div>
                  </div>
                ))}
              </div>
              <StatBar label="TASK COMPLETION" value={tasks.done} max={totalTasks || 1} color="#00f5d4" />
            </PixelBox>

            <PixelBox title="PIPELINE LOG" color="#00ff88">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['PLAN', true], ['CODE', true], ['TEST', true], ['REVIEW', true]].map(([label, done]) => (
                  <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, fontSize: 9, color: done ? '#00ff88' : '#1a5a40', fontFamily: '"Share Tech Mono", monospace' }}>{label}</div>
                    <div style={{ flex: 1, height: 4, background: '#0a1612', overflow: 'hidden', border: '1px solid #0d2a1e' }}>
                      <div style={{ height: '100%', width: done ? '100%' : '0%', background: 'linear-gradient(90deg,#00ff88,#00f5d4)', boxShadow: done ? '0 0 6px #00ff88' : 'none' }} />
                    </div>
                    <span style={{ fontSize: 10, color: done ? '#00ff88' : '#1a5a40' }}>{done ? '✓' : '○'}</span>
                  </div>
                ))}
                <div style={{ marginTop: 6, textAlign: 'center', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', padding: '6px', fontSize: 10, color: '#00ff88', letterSpacing: '0.15em' }}>
                  ► APPROVED ◄
                </div>
              </div>
            </PixelBox>
          </div>

          {/* CODE LAB + QA BAY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PixelBox title="CODE LAB" color="#b44fff">
              <div style={{ fontSize: 9, color: '#3a6a55', marginBottom: 8, display: 'flex', gap: 8 }}>
                <span style={{ color: '#00f5d4' }}>⬡ BRANCH: main</span>
                <span style={{ color: '#b44fff' }}>● LIVE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Photo Queue', val: photoQ, max: 20, c: '#ffd60a' },
                  { label: 'Listing Queue', val: listingQ, max: 20, c: '#00f5d4' },
                  { label: 'Stock Close', val: stockClose, max: 10, c: '#ff4444' },
                ].map(x => <StatBar key={x.label} label={x.label.toUpperCase()} value={x.val} max={x.max || 1} color={x.c} />)}
              </div>
              <Link href="/dashboard" style={{ display: 'block', marginTop: 10, textAlign: 'center', fontSize: 9, color: '#b44fff', letterSpacing: '0.15em', textDecoration: 'none', border: '1px solid #b44fff33', padding: '4px', background: 'rgba(180,79,255,0.07)' }}>
                → VIEW FULL DASHBOARD
              </Link>
            </PixelBox>

            <PixelBox title="QA BAY" color="#00ff88">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: '#0a1612', padding: '8px', border: '1px solid #0d2a1e' }}>
                  <div style={{ fontSize: 8, color: '#3a6a55', marginBottom: 4, letterSpacing: '0.1em' }}>TEST SUITE</div>
                  {['Unit Tests ✓', 'Integration ✓', 'E2E Tests ✓'].map(t => (
                    <div key={t} style={{ fontSize: 9, color: '#00ff88', marginBottom: 2 }}>{t}</div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', padding: '10px', border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <div style={{ fontSize: 28, animation: 'px-blink 3s ease-in-out infinite' }}>✅</div>
                  <div style={{ fontSize: 8, color: '#00ff88', letterSpacing: '0.1em' }}>ALL PASS</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a1612', padding: '6px 10px', border: '1px solid #0d2a1e' }}>
                <span style={{ fontSize: 9, color: '#3a6a55' }}>🐛 BUG SCANNER</span>
                <span style={{ fontSize: 10, color: '#00ff88', fontWeight: 700 }}>0 ISSUES</span>
              </div>
            </PixelBox>
          </div>

          {/* FINANCE + HUMAN REVIEW */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PixelBox title="FINANCE MODULE" color="#ffd60a">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)', padding: '10px' }}>
                  <div style={{ fontSize: 8, color: '#3a6a55', letterSpacing: '0.1em', marginBottom: 3 }}>INCOME</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#00ff88', textShadow: '0 0 6px rgba(0,255,136,0.5)' }}>฿{loaded ? fmt(income) : '…'}</div>
                </div>
                <div style={{ background: 'rgba(255,68,68,0.07)', border: '1px solid rgba(255,68,68,0.2)', padding: '10px' }}>
                  <div style={{ fontSize: 8, color: '#3a6a55', letterSpacing: '0.1em', marginBottom: 3 }}>EXPENSE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ff6666', textShadow: '0 0 6px rgba(255,68,68,0.5)' }}>฿{loaded ? fmt(expense) : '…'}</div>
                </div>
              </div>
              <div style={{ background: '#0a1612', border: '1px solid #0d4a35', padding: '8px 10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: '#3a6a55', letterSpacing: '0.1em' }}>NET BALANCE</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: income - expense >= 0 ? '#00f5d4' : '#ff4444', textShadow: '0 0 6px rgba(0,245,212,0.5)' }}>
                  {income - expense >= 0 ? '+' : ''}฿{loaded ? fmt(income - expense) : '…'}
                </span>
              </div>
              <Link href="/income-expense" style={{ display: 'block', marginTop: 8, textAlign: 'center', fontSize: 9, color: '#ffd60a', letterSpacing: '0.15em', textDecoration: 'none', border: '1px solid #ffd60a33', padding: '4px', background: 'rgba(255,214,10,0.05)' }}>
                → VIEW TRANSACTIONS
              </Link>
            </PixelBox>

            <PixelBox title="HUMAN REVIEW" color="#ff4444">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 32 }}>🧑‍💻</div>
                <div>
                  <div style={{ fontSize: 9, color: '#3a6a55', marginBottom: 4, letterSpacing: '0.1em' }}>INBOX</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { label: 'PHOTO', val: photoQ, c: '#ffd60a' },
                      { label: 'LIST', val: listingQ, c: '#00f5d4' },
                      { label: 'STOCK', val: stockClose, c: '#ff4444' },
                    ].map(x => (
                      <div key={x.label} style={{ background: '#0a1612', border: `1px solid ${x.c}33`, padding: '3px 6px', textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: x.c }}>{loaded ? x.val : '…'}</div>
                        <div style={{ fontSize: 7, color: '#3a6a55', letterSpacing: '0.05em' }}>{x.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>✅</span>
                <div>
                  <div style={{ fontSize: 9, color: '#00ff88', letterSpacing: '0.1em' }}>VERDICT: APPROVED</div>
                  <div style={{ fontSize: 8, color: '#3a6a55' }}>ALL SYSTEMS GREEN</div>
                </div>
              </div>
            </PixelBox>

            {/* Bottom stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { label: 'AI AGENTS', val: '4/4', sub: 'ONLINE', c: '#00ff88' },
                { label: 'TASKS DONE', val: `${tasks.done}/${totalTasks}`, sub: 'COMPLETED', c: '#00f5d4' },
              ].map(s => (
                <PixelBox key={s.label} color={s.c} style={{ textAlign: 'center', padding: '10px 8px' }}>
                  <div style={{ fontSize: 8, color: '#3a6a55', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.c, textShadow: `0 0 8px ${s.c}88` }}>{loaded ? s.val : '…'}</div>
                  <div style={{ fontSize: 8, color: s.c + '88', letterSpacing: '0.1em' }}>{s.sub}</div>
                </PixelBox>
              ))}
            </div>
          </div>

        </div>

        {/* BOTTOM STATS BAR */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { icon: '⏱', label: 'RUNTIME', val: '24/7', c: '#3a6a55' },
            { icon: '🤖', label: 'AI AGENTS', val: '4/4 ONLINE', c: '#00ff88' },
            { icon: '📋', label: 'TASKS TODAY', val: `${tasks.inProgress} ACTIVE`, c: '#00f5d4' },
            { icon: '🛡', label: 'QUALITY GATE', val: 'PASSED', c: '#ffd60a' },
            { icon: '🏆', label: 'PIPELINE STATUS', val: 'SUCCESS', c: '#00ff88' },
          ].map(s => (
            <div key={s.label} style={{ background: '#080f0c', border: `1px solid ${s.c}22`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 7, color: '#1a5a40', letterSpacing: '0.15em' }}>{s.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.c, textShadow: `0 0 6px ${s.c}66` }}>{s.val}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  )
}

'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'

// ====== Config ======
const WORKFLOWS = [
  { id: 'FYb1mNDNGI5eVo3f', name: 'Workflow 1', color: '#6366f1' },
  { id: 'ccU2oVqVVsR9Cntj', name: 'Workflow 2', color: '#8b5cf6' },
  { id: 'P65PfBCwCopB2znt', name: 'Workflow 3', color: '#06b6d4' },
  { id: 'AA1v2xB3cW8OLQfn', name: 'Workflow 4', color: '#f59e0b' },
]

const STORAGE_URL = 'n8n-url'
const STORAGE_KEY = 'n8n-api-key'
const STORAGE_NAMES = 'n8n-workflow-names'

// ====== Types ======
interface Execution {
  id: string
  status: 'success' | 'error' | 'waiting' | 'running' | 'new' | string
  mode: string
  startedAt: string
  stoppedAt?: string
  finished: boolean
  workflowId: string
}

interface WorkflowState {
  executions: Execution[]
  loading: boolean
  error: string
}

// ====== Helpers ======
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  success: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   icon: '✅', label: 'สำเร็จ' },
  error:   { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   icon: '❌', label: 'ผิดพลาด' },
  running: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: '⚡', label: 'กำลังรัน' },
  waiting: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: '⏳', label: 'รออยู่' },
  new:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '🆕', label: 'ใหม่' },
}

const MODE_TH: Record<string, string> = {
  manual:    'รันมือ',
  trigger:   'Trigger',
  webhook:   'Webhook',
  schedule:  'ตั้งเวลา',
  retry:     'Retry',
  integrated:'รวม',
}

function duration(start: string, stop?: string): string {
  if (!stop) return '—'
  const ms = new Date(stop).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function formatDT(dateStr: string) {
  return new Date(dateStr).toLocaleString('th-TH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Bangkok',
  })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h} ชม.ที่แล้ว`
  if (m > 0) return `${m} นาทีที่แล้ว`
  return `${s} วิที่แล้ว`
}

// ====== Component ======
export default function WorkflowStatusPage() {
  const [n8nUrl, setN8nUrl]       = useState('http://localhost:5678')
  const [apiKey, setApiKey]       = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [wfNames, setWfNames]     = useState<Record<string, string>>({})
  const [states, setStates]       = useState<Record<string, WorkflowState>>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // โหลด settings จาก localStorage
  useEffect(() => {
    const savedUrl   = localStorage.getItem(STORAGE_URL)
    const savedKey   = localStorage.getItem(STORAGE_KEY)
    const savedNames = localStorage.getItem(STORAGE_NAMES)
    if (savedUrl)   setN8nUrl(savedUrl)
    if (savedKey)   setApiKey(savedKey)
    if (savedNames) setWfNames(JSON.parse(savedNames))
  }, [])

  function saveSettings() {
    localStorage.setItem(STORAGE_URL, n8nUrl)
    localStorage.setItem(STORAGE_KEY, apiKey)
    localStorage.setItem(STORAGE_NAMES, JSON.stringify(wfNames))
    setShowSettings(false)
    fetchAll()
  }

  const fetchWorkflow = useCallback(async (wfId: string) => {
    setStates(prev => ({ ...prev, [wfId]: { ...prev[wfId], loading: true, error: '' } }))
    try {
      const url    = localStorage.getItem(STORAGE_URL) || 'http://localhost:5678'
      const key    = localStorage.getItem(STORAGE_KEY) || ''
      const res    = await fetch(
        `${url}/api/v1/executions?workflowId=${wfId}&limit=10&includeData=false`,
        { headers: { 'X-N8N-API-KEY': key, 'Accept': 'application/json' } }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data   = await res.json()
      const execs: Execution[] = data.data || []
      setStates(prev => ({ ...prev, [wfId]: { executions: execs, loading: false, error: '' } }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ไม่สามารถเชื่อมต่อได้'
      setStates(prev => ({ ...prev, [wfId]: { executions: [], loading: false, error: msg } }))
    }
  }, [])

  const fetchAll = useCallback(() => {
    WORKFLOWS.forEach(wf => fetchWorkflow(wf.id))
    setLastUpdated(new Date())
  }, [fetchWorkflow])

  useEffect(() => {
    if (apiKey) fetchAll()
  }, [fetchAll, apiKey])

  useEffect(() => {
    if (!autoRefresh || !apiKey) return
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, apiKey, fetchAll])

  const getWfName = (wf: typeof WORKFLOWS[0]) => wfNames[wf.id] || wf.name

  // Stats across all workflows
  const allExecs = Object.values(states).flatMap(s => s.executions)
  const totalSuccess = allExecs.filter(e => e.status === 'success').length
  const totalError   = allExecs.filter(e => e.status === 'error').length
  const totalRunning = allExecs.filter(e => e.status === 'running').length

  return (
    <AppShell>
      <Header
        title="⚡ Workflow Status"
        subtitle={lastUpdated ? `อัพเดทล่าสุด: ${lastUpdated.toLocaleTimeString('th-TH')}` : 'n8n Workflow Monitor'}
      />
      <div style={{ padding: 24, flex: 1 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={fetchAll}
            style={{ padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            🔄 รีเฟรช
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
              style={{ accentColor: '#6366f1', width: 15, height: 15 }} />
            รีเฟรชอัตโนมัติทุก 30 วินาที
          </label>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => setShowSettings(!showSettings)}
              style={{ padding: '9px 18px', borderRadius: 10, background: showSettings ? 'rgba(99,102,241,0.2)' : '#1a1d2e', border: '1px solid #2d3154', color: '#818cf8', cursor: 'pointer', fontSize: 13 }}>
              ⚙️ ตั้งค่า n8n
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div style={{ background: '#1a1d2e', border: '1px solid #2d3154', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 16 }}>⚙️ ตั้งค่าการเชื่อมต่อ n8n</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>n8n URL</label>
                <input value={n8nUrl} onChange={e => setN8nUrl(e.target.value)}
                  placeholder="http://localhost:5678"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                  API Key <span style={{ color: '#4a5568', fontSize: 11 }}>(Settings → API in n8n)</span>
                </label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="n8n_api_..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: 13 }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>ตั้งชื่อ Workflow (ไม่บังคับ)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {WORKFLOWS.map(wf => (
                  <div key={wf.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: wf.color, flexShrink: 0 }} />
                    <input
                      value={wfNames[wf.id] || ''}
                      onChange={e => setWfNames(p => ({ ...p, [wf.id]: e.target.value }))}
                      placeholder={wf.name}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', fontSize: 12 }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveSettings}
                style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                💾 บันทึก
              </button>
              <button onClick={() => setShowSettings(false)}
                style={{ padding: '9px 20px', borderRadius: 8, background: 'rgba(148,163,184,0.1)', border: '1px solid #2d3154', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* No API Key warning */}
        {!apiKey && !showSettings && (
          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, color: '#fbbf24', fontSize: 14 }}>
            ⚠️ ยังไม่ได้ตั้งค่า API Key — กด <strong>ตั้งค่า n8n</strong> เพื่อใส่ URL และ API Key ก่อนครับ
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 6 }}>
              วิธีขอ API Key: เปิด n8n → Settings → n8n API → Create an API key
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {apiKey && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'สำเร็จ',      count: totalSuccess, color: '#4ade80', bg: 'rgba(34,197,94,0.07)' },
              { label: 'ผิดพลาด',     count: totalError,   color: '#f87171', bg: 'rgba(239,68,68,0.07)' },
              { label: 'กำลังรัน',    count: totalRunning, color: '#60a5fa', bg: 'rgba(96,165,250,0.07)' },
              { label: 'Execution ทั้งหมด', count: allExecs.length, color: '#818cf8', bg: 'rgba(99,102,241,0.07)' },
            ].map(c => (
              <div key={c.label} style={{ flex: 1, minWidth: 110, background: c.bg, border: `1px solid ${c.color}30`, borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.count}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Workflow Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {WORKFLOWS.map(wf => {
            const state = states[wf.id] || { executions: [], loading: false, error: '' }
            const name  = getWfName(wf)
            const successRate = state.executions.length > 0
              ? Math.round(state.executions.filter(e => e.status === 'success').length / state.executions.length * 100)
              : null

            return (
              <div key={wf.id} style={{ background: '#1a1d2e', borderRadius: 12, border: `1px solid ${wf.color}30`, overflow: 'hidden' }}>
                {/* Workflow Header */}
                <div style={{ padding: '14px 18px', background: `${wf.color}10`, borderBottom: '1px solid #2d3154', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: wf.color, boxShadow: `0 0 8px ${wf.color}` }} />
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{name}</span>
                    <code style={{ fontSize: 11, color: '#4a5568', background: '#0f1117', padding: '2px 8px', borderRadius: 6 }}>{wf.id}</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {successRate !== null && (
                      <span style={{ fontSize: 12, color: successRate >= 80 ? '#4ade80' : successRate >= 50 ? '#fbbf24' : '#f87171', fontWeight: 600 }}>
                        อัตราสำเร็จ {successRate}%
                      </span>
                    )}
                    <a href={`${n8nUrl}/workflow/${wf.id}/executions`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}>🔗 เปิด n8n</a>
                    <button onClick={() => fetchWorkflow(wf.id)}
                      style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer', fontSize: 11 }}>
                      🔄
                    </button>
                  </div>
                </div>

                {/* Executions */}
                {state.loading && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#4a5568', fontSize: 13 }}>⏳ กำลังโหลด...</div>
                )}
                {state.error && !state.loading && (
                  <div style={{ padding: '16px 18px', color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.05)' }}>
                    ❌ {state.error}
                    {state.error.includes('fetch') || state.error.includes('Failed') ? (
                      <span style={{ color: '#4a5568', marginLeft: 8 }}>— ตรวจสอบว่า n8n รันอยู่และ API Key ถูกต้องครับ</span>
                    ) : null}
                  </div>
                )}
                {!state.loading && !state.error && state.executions.length === 0 && apiKey && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#4a5568', fontSize: 13 }}>📭 ไม่พบข้อมูล Execution</div>
                )}
                {!state.loading && state.executions.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                      <thead>
                        <tr style={{ background: '#0f1117' }}>
                          {['#', 'สถานะ', 'เริ่มเมื่อ', 'ระยะเวลา', 'โหมด', 'Execution ID'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#4a5568', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {state.executions.map((exec, i) => {
                          const sc = STATUS_CONFIG[exec.status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: '•', label: exec.status }
                          return (
                            <tr key={exec.id} style={{ borderTop: '1px solid #2d3154', background: i === 0 ? `${wf.color}05` : 'transparent' }}>
                              <td style={{ padding: '10px 14px', color: '#4a5568', fontSize: 12 }}>{i + 1}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: sc.bg, color: sc.color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {sc.icon} {sc.label}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>
                                <div>{formatDT(exec.startedAt)}</div>
                                <div style={{ color: '#4a5568', fontSize: 11 }}>{timeAgo(exec.startedAt)}</div>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 }}>
                                {duration(exec.startedAt, exec.stoppedAt)}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 11 }}>
                                  {MODE_TH[exec.mode] || exec.mode}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <a href={`${n8nUrl}/workflow/${wf.id}/executions/${exec.id}`} target="_blank" rel="noopener noreferrer"
                                  style={{ fontFamily: 'monospace', fontSize: 11, color: '#6366f1', textDecoration: 'none' }}>
                                  #{exec.id}
                                </a>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', color: '#3a4060', fontSize: 12 }}>
          ดึงข้อมูลจาก n8n API · {autoRefresh ? 'รีเฟรชอัตโนมัติทุก 30 วินาที' : 'ปิดรีเฟรชอัตโนมัติ'}
        </div>
      </div>
    </AppShell>
  )
}

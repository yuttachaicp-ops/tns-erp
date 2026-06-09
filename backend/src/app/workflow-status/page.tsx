'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'

const WORKFLOWS = [
  { id: 'FYb1mNDNGI5eVo3f', name: 'Workflow 1' },
  { id: 'ccU2oVqVVsR9Cntj', name: 'Workflow 2' },
  { id: 'P65PfBCwCopB2znt', name: 'Workflow 3' },
  { id: 'AA1v2xB3cW8OLQfn', name: 'Workflow 4' },
]

const STORAGE_URL   = 'n8n-url'
const STORAGE_KEY   = 'n8n-api-key'
const STORAGE_NAMES = 'n8n-workflow-names'

type RunStatus = 'ok' | 'error' | 'running' | 'unknown'

interface WorkflowStatus {
  status: RunStatus
  lastRun: string | null
  loading: boolean
}

const STATUS_CONFIG: Record<RunStatus, { icon: string; label: string; color: string; bg: string; glow: string }> = {
  ok:      { icon: '✅', label: 'ปกติ',        color: '#4ade80', bg: 'rgba(34,197,94,0.08)',   glow: '0 0 16px rgba(34,197,94,0.25)' },
  error:   { icon: '❌', label: 'มีปัญหา',      color: '#f87171', bg: 'rgba(239,68,68,0.08)',   glow: '0 0 16px rgba(239,68,68,0.25)' },
  running: { icon: '⚡', label: 'กำลังรัน',    color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  glow: '0 0 16px rgba(96,165,250,0.25)' },
  unknown: { icon: '⚪', label: 'ไม่ทราบ',      color: '#64748b', bg: 'rgba(100,116,139,0.08)', glow: 'none' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d} วันที่แล้ว`
  if (h > 0) return `${h} ชม.ที่แล้ว`
  if (m > 0) return `${m} นาทีที่แล้ว`
  return 'เมื่อกี้'
}

export default function WorkflowStatusPage() {
  const [n8nUrl, setN8nUrl]   = useState('http://localhost:5679')
  const [apiKey, setApiKey]   = useState('')
  const [wfNames, setWfNames] = useState<Record<string, string>>({})
  const [showSettings, setShowSettings] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, WorkflowStatus>>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const url   = localStorage.getItem(STORAGE_URL)
    const key   = localStorage.getItem(STORAGE_KEY)
    const names = localStorage.getItem(STORAGE_NAMES)
    if (url)   setN8nUrl(url)
    if (key)   setApiKey(key)
    if (names) setWfNames(JSON.parse(names))
  }, [])

  const fetchStatus = useCallback(async (wfId: string) => {
    setStatuses(prev => ({ ...prev, [wfId]: { ...prev[wfId], status: prev[wfId]?.status || 'unknown', lastRun: prev[wfId]?.lastRun || null, loading: true } }))
    try {
      const url = localStorage.getItem(STORAGE_URL) || 'http://localhost:5679'
      const key = localStorage.getItem(STORAGE_KEY) || ''
      const res = await fetch(
        `${url}/api/v1/executions?workflowId=${wfId}&limit=1&includeData=false`,
        { headers: { 'X-N8N-API-KEY': key, 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' } }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const last = data.data?.[0]
      let s: RunStatus = 'unknown'
      if (last) {
        if (last.status === 'success')           s = 'ok'
        else if (last.status === 'error' || last.status === 'crashed') s = 'error'
        else if (last.status === 'running' || last.status === 'new')   s = 'running'
      }
      setStatuses(prev => ({ ...prev, [wfId]: { status: s, lastRun: last?.startedAt || null, loading: false } }))
    } catch {
      setStatuses(prev => ({ ...prev, [wfId]: { status: 'unknown', lastRun: prev[wfId]?.lastRun || null, loading: false } }))
    }
  }, [])

  const fetchAll = useCallback(() => {
    WORKFLOWS.forEach(wf => fetchStatus(wf.id))
    setLastUpdated(new Date())
  }, [fetchStatus])

  useEffect(() => { if (apiKey) fetchAll() }, [fetchAll, apiKey])
  useEffect(() => {
    if (!apiKey) return
    const t = setInterval(fetchAll, 30000)
    return () => clearInterval(t)
  }, [fetchAll, apiKey])

  function saveSettings() {
    localStorage.setItem(STORAGE_URL, n8nUrl)
    localStorage.setItem(STORAGE_KEY, apiKey)
    localStorage.setItem(STORAGE_NAMES, JSON.stringify(wfNames))
    setShowSettings(false)
    fetchAll()
  }

  const getName = (wf: typeof WORKFLOWS[0]) => wfNames[wf.id] || wf.name

  const allOk      = WORKFLOWS.every(wf => statuses[wf.id]?.status === 'ok')
  const hasError   = WORKFLOWS.some(wf => statuses[wf.id]?.status === 'error')
  const anyLoading = WORKFLOWS.some(wf => statuses[wf.id]?.loading)

  return (
    <AppShell>
      <Header
        title="⚡ Workflow Status"
        subtitle={lastUpdated ? `อัพเดทล่าสุด: ${lastUpdated.toLocaleTimeString('th-TH')}` : 'n8n Monitor'}
      />
      <div style={{ padding: 24, flex: 1 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
          <button onClick={fetchAll} disabled={anyLoading}
            style={{ padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: anyLoading ? 0.6 : 1 }}>
            {anyLoading ? '⏳ กำลังตรวจสอบ...' : '🔄 รีเฟรช'}
          </button>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => setShowSettings(!showSettings)}
              style={{ padding: '9px 18px', borderRadius: 10, background: '#1a1d2e', border: '1px solid #2d3154', color: '#818cf8', cursor: 'pointer', fontSize: 13 }}>
              ⚙️ ตั้งค่า
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div style={{ background: '#1a1d2e', border: '1px solid #2d3154', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 16 }}>⚙️ ตั้งค่าการเชื่อมต่อ n8n</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>n8n URL (proxy)</label>
                <input value={n8nUrl} onChange={e => setN8nUrl(e.target.value)}
                  placeholder="http://localhost:5679"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>API Key</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="n8n_api_..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', boxSizing: 'border-box', fontSize: 13 }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>ชื่อ Workflow (ไม่บังคับ)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {WORKFLOWS.map(wf => (
                  <input key={wf.id} value={wfNames[wf.id] || ''} onChange={e => setWfNames(p => ({ ...p, [wf.id]: e.target.value }))}
                    placeholder={wf.name}
                    style={{ padding: '8px 10px', borderRadius: 8, background: '#0f1117', border: '1px solid #2d3154', color: 'white', outline: 'none', fontSize: 12 }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveSettings} style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>💾 บันทึก</button>
              <button onClick={() => setShowSettings(false)} style={{ padding: '9px 20px', borderRadius: 8, background: 'rgba(148,163,184,0.1)', border: '1px solid #2d3154', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>ยกเลิก</button>
            </div>
          </div>
        )}

        {/* No API Key */}
        {!apiKey && !showSettings && (
          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, color: '#fbbf24', fontSize: 14 }}>
            ⚠️ ยังไม่ได้ตั้งค่า — กด <strong>⚙️ ตั้งค่า</strong> เพื่อใส่ URL และ API Key ครับ
          </div>
        )}

        {/* Overall Banner */}
        {apiKey && !anyLoading && (
          <div style={{
            borderRadius: 14, padding: '20px 24px', marginBottom: 28, textAlign: 'center',
            background: hasError ? 'rgba(239,68,68,0.08)' : allOk ? 'rgba(34,197,94,0.08)' : 'rgba(100,116,139,0.08)',
            border: `1px solid ${hasError ? 'rgba(239,68,68,0.3)' : allOk ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.3)'}`,
            boxShadow: hasError ? '0 0 24px rgba(239,68,68,0.1)' : allOk ? '0 0 24px rgba(34,197,94,0.1)' : 'none',
          }}>
            <div style={{ fontSize: 36 }}>{hasError ? '❌' : allOk ? '✅' : '⚪'}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: hasError ? '#f87171' : allOk ? '#4ade80' : '#64748b', marginTop: 8 }}>
              {hasError ? 'มีบาง Workflow ที่มีปัญหา' : allOk ? 'ระบบทำงานปกติทุกตัว' : 'ไม่สามารถตรวจสอบได้'}
            </div>
          </div>
        )}

        {/* Workflow Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {WORKFLOWS.map(wf => {
            const st = statuses[wf.id]
            const cfg = STATUS_CONFIG[st?.status || 'unknown']
            return (
              <div key={wf.id} style={{
                background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 16,
                padding: '24px 20px', textAlign: 'center',
                boxShadow: st?.loading ? 'none' : cfg.glow,
                transition: 'box-shadow 0.3s ease',
              }}>
                {st?.loading ? (
                  <div style={{ fontSize: 36, opacity: 0.4 }}>⏳</div>
                ) : (
                  <div style={{ fontSize: 40 }}>{cfg.icon}</div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginTop: 12 }}>
                  {getName(wf)}
                </div>
                <div style={{ fontSize: 13, color: cfg.color, fontWeight: 600, marginTop: 4 }}>
                  {st?.loading ? 'กำลังตรวจสอบ...' : cfg.label}
                </div>
                {st?.lastRun && !st.loading && (
                  <div style={{ fontSize: 11, color: '#4a5568', marginTop: 8 }}>
                    รันล่าสุด: {timeAgo(st.lastRun)}
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#3a4060', marginTop: 4, fontFamily: 'monospace' }}>
                  {wf.id.slice(0, 8)}...
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', color: '#3a4060', fontSize: 12 }}>
          รีเฟรชอัตโนมัติทุก 30 วินาที
        </div>
      </div>
    </AppShell>
  )
}

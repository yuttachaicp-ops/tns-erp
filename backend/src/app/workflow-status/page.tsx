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
  errorMsg: string | null
  loading: boolean
}

// แปล error message เป็นภาษาไทย
function translateError(msg: string): string {
  if (!msg) return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
  const m = msg.toLowerCase()
  if (m.includes('econnrefused'))           return 'ไม่สามารถเชื่อมต่อได้ (Connection Refused)'
  if (m.includes('etimedout') || m.includes('timeout'))  return 'หมดเวลาเชื่อมต่อ (Timeout)'
  if (m.includes('enotfound') || m.includes('getaddrinfo')) return 'ไม่พบ Host / DNS Error'
  if (m.includes('econnreset'))             return 'การเชื่อมต่อถูกตัด (Connection Reset)'
  if (m.includes('status code 401') || m.includes('unauthorized')) return 'ไม่ได้รับอนุญาต — ตรวจสอบ API Key / Token'
  if (m.includes('status code 403') || m.includes('forbidden'))    return 'ถูกบล็อกการเข้าถึง (403 Forbidden)'
  if (m.includes('status code 404'))        return 'ไม่พบ Endpoint ที่ระบุ (404 Not Found)'
  if (m.includes('status code 429'))        return 'เรียกถี่เกินไป กรุณารอสักครู่ (Rate Limit)'
  if (m.includes('status code 500'))        return 'Server ปลายทางเกิดข้อผิดพลาด (500)'
  if (m.includes('status code 502'))        return 'Bad Gateway — Server ปลายทางไม่ตอบสนอง'
  if (m.includes('status code 503'))        return 'Service ปลายทางไม่พร้อมให้บริการ (503)'
  if (m.includes('no data') || m.includes('empty'))   return 'ไม่พบข้อมูล / ข้อมูลว่างเปล่า'
  if (m.includes('cannot read') || m.includes('undefined') || m.includes('null')) return 'ข้อมูลที่ได้รับไม่ถูกรูปแบบ'
  if (m.includes('is not a function'))      return 'ฟังก์ชันที่เรียกใช้ไม่ถูกต้อง'
  if (m.includes('invalid') && m.includes('json')) return 'รูปแบบข้อมูล JSON ไม่ถูกต้อง'
  if (m.includes('authentication') || m.includes('login')) return 'การยืนยันตัวตนล้มเหลว'
  if (m.includes('network') || m.includes('fetch'))    return 'เกิดปัญหาเครือข่าย'
  if (m.includes('quota') || m.includes('limit exceeded')) return 'เกินโควต้าที่กำหนด'
  if (m.includes('ssl') || m.includes('certificate'))  return 'ปัญหา SSL Certificate'
  // ถ้าแปลไม่ได้ ตัดให้สั้นและส่งกลับ
  return msg.length > 80 ? msg.slice(0, 80) + '...' : msg
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
    setStatuses(prev => ({ ...prev, [wfId]: { ...prev[wfId], status: prev[wfId]?.status || 'unknown', lastRun: prev[wfId]?.lastRun || null, errorMsg: prev[wfId]?.errorMsg || null, loading: true } }))
    try {
      const url = localStorage.getItem(STORAGE_URL) || 'http://localhost:5679'
      const key = localStorage.getItem(STORAGE_KEY) || ''
      const headers = { 'X-N8N-API-KEY': key, 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' }

      // ดึง execution ล่าสุด 1 รายการ
      const res = await fetch(`${url}/api/v1/executions?workflowId=${wfId}&limit=1&includeData=false`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const last = data.data?.[0]

      let s: RunStatus = 'unknown'
      let errorMsg: string | null = null

      if (last) {
        if (last.status === 'success') {
          s = 'ok'
        } else if (last.status === 'error' || last.status === 'crashed') {
          s = 'error'
          // ดึง execution detail เพื่อหา error message
          try {
            const detailRes = await fetch(`${url}/api/v1/executions/${last.id}`, { headers })
            if (detailRes.ok) {
              const detail = await detailRes.json()
              // หา error message จาก resultData
              const errObj = detail?.data?.resultData?.error
              const rawMsg = errObj?.message || errObj?.description || detail?.data?.resultData?.lastNodeExecuted
                ? (detail?.data?.resultData?.runData?.[detail?.data?.resultData?.lastNodeExecuted]?.[0]?.error?.message || '')
                : ''
              if (rawMsg) errorMsg = translateError(rawMsg)
              else {
                // หาจาก node ที่ error
                const runData = detail?.data?.resultData?.runData || {}
                for (const nodeName of Object.keys(runData)) {
                  const nodeRun = runData[nodeName]?.[0]
                  if (nodeRun?.error?.message) {
                    errorMsg = `[${nodeName}] ${translateError(nodeRun.error.message)}`
                    break
                  }
                }
              }
            }
          } catch { /* ถ้าดึง detail ไม่ได้ก็ไม่เป็นไร */ }
          if (!errorMsg) errorMsg = 'เกิดข้อผิดพลาด — ดูรายละเอียดใน n8n'
        } else if (last.status === 'running' || last.status === 'new') {
          s = 'running'
        }
      }

      setStatuses(prev => ({ ...prev, [wfId]: { status: s, lastRun: last?.startedAt || null, errorMsg, loading: false } }))
    } catch {
      setStatuses(prev => ({ ...prev, [wfId]: { status: 'unknown', lastRun: prev[wfId]?.lastRun || null, errorMsg: null, loading: false } }))
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
          }}>
            <div style={{ fontSize: 36 }}>{hasError ? '❌' : allOk ? '✅' : '⚪'}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: hasError ? '#f87171' : allOk ? '#4ade80' : '#64748b', marginTop: 8 }}>
              {hasError ? 'มีบาง Workflow ที่มีปัญหา' : allOk ? 'ระบบทำงานปกติทุกตัว' : 'ไม่สามารถตรวจสอบได้'}
            </div>
          </div>
        )}

        {/* Workflow Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          {WORKFLOWS.map(wf => {
            const st  = statuses[wf.id]
            const cfg = STATUS_CONFIG[st?.status || 'unknown']
            return (
              <div key={wf.id} style={{
                background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 16,
                padding: '24px 20px', textAlign: 'center',
                boxShadow: st?.loading ? 'none' : cfg.glow,
                transition: 'box-shadow 0.3s ease',
              }}>
                <div style={{ fontSize: 40 }}>{st?.loading ? '⏳' : cfg.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginTop: 12 }}>{getName(wf)}</div>
                <div style={{ fontSize: 13, color: cfg.color, fontWeight: 600, marginTop: 4 }}>
                  {st?.loading ? 'กำลังตรวจสอบ...' : cfg.label}
                </div>
                {st?.lastRun && !st.loading && (
                  <div style={{ fontSize: 11, color: '#4a5568', marginTop: 8 }}>รันล่าสุด: {timeAgo(st.lastRun)}</div>
                )}
                <div style={{ fontSize: 10, color: '#3a4060', marginTop: 4, fontFamily: 'monospace' }}>{wf.id.slice(0, 8)}...</div>
              </div>
            )
          })}
        </div>

        {/* Error Table — แสดงเฉพาะตอนมี error */}
        {apiKey && hasError && (
          <div style={{ background: '#1a1d2e', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', fontSize: 13, fontWeight: 700, color: '#f87171' }}>
              ❌ รายการที่เกิด Error
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0f1117' }}>
                  {['Workflow', 'สาเหตุ', 'รันล่าสุด', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#4a5568', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WORKFLOWS.filter(wf => statuses[wf.id]?.status === 'error').map((wf, i) => {
                  const st = statuses[wf.id]
                  return (
                    <tr key={wf.id} style={{ borderTop: '1px solid #2d3154', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'white' }}>{getName(wf)}</div>
                        <div style={{ fontSize: 10, color: '#3a4060', fontFamily: 'monospace', marginTop: 2 }}>{wf.id}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#fca5a5', lineHeight: 1.6 }}>
                        {st?.errorMsg || 'เกิดข้อผิดพลาด — ดูรายละเอียดใน n8n'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {st?.lastRun ? timeAgo(st.lastRun) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <a href={`${n8nUrl.replace(':5679', ':5678')}/workflow/${wf.id}/executions`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>🔗 เปิดใน n8n</a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', color: '#3a4060', fontSize: 12 }}>
          รีเฟรชอัตโนมัติทุก 30 วินาที
        </div>
      </div>
    </AppShell>
  )
}

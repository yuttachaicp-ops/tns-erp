'use client'
import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'

interface Component {
  id: string
  name: string
  status: string
  updated_at: string
}

interface Incident {
  id: string
  name: string
  status: string
  impact: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  incident_updates: { body: string; created_at: string; status: string }[]
  shortlink: string
}

interface StatusData {
  summary: {
    status: { indicator: string; description: string }
    components: Component[]
    incidents: Incident[]
    page: { updated_at: string }
  }
  incidents: { incidents: Incident[] }
}

const COMPONENT_STATUS: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  operational:          { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   dot: '#4ade80', label: 'ปกติ' },
  degraded_performance: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', dot: '#fbbf24', label: 'ประสิทธิภาพลดลง' },
  partial_outage:       { color: '#fb923c', bg: 'rgba(249,115,22,0.1)', dot: '#fb923c', label: 'บางส่วนขัดข้อง' },
  major_outage:         { color: '#f87171', bg: 'rgba(239,68,68,0.1)',  dot: '#f87171', label: 'ขัดข้องหนัก' },
  under_maintenance:    { color: '#818cf8', bg: 'rgba(99,102,241,0.1)', dot: '#818cf8', label: 'กำลังบำรุงรักษา' },
}

const INDICATOR_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  none:     { color: '#4ade80', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   icon: '✅', label: 'ระบบทำงานปกติทั้งหมด' },
  minor:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)',  icon: '⚠️', label: 'มีปัญหาเล็กน้อย' },
  major:    { color: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)',  icon: '🔶', label: 'มีปัญหาสำคัญ' },
  critical: { color: '#f87171', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',   icon: '🔴', label: 'ระบบขัดข้องร้ายแรง' },
}

const IMPACT_COLOR: Record<string, string> = {
  none:     '#4ade80',
  minor:    '#fbbf24',
  major:    '#fb923c',
  critical: '#f87171',
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

function formatDateTH(dateStr: string) {
  return new Date(dateStr).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
  })
}

export default function ClaudeStatusPage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('tns-token')
      const res = await fetch('/api/claude-status', { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.error) { setError(d.error); return }
      setData(d)
      setLastUpdated(new Date())
      setError('')
    } catch {
      setError('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // refresh ทุก 1 นาที
    return () => clearInterval(interval)
  }, [fetchStatus])

  const indicator = data?.summary?.status?.indicator || 'none'
  const indConf = INDICATOR_CONFIG[indicator] || INDICATOR_CONFIG.none
  const components = data?.summary?.components || []
  const activeIncidents = data?.summary?.incidents || []
  const recentIncidents = data?.incidents?.incidents || []

  return (
    <AppShell>
      <Header
        title="🤖 Claude API Status"
        subtitle={lastUpdated ? `อัพเดทล่าสุด: ${lastUpdated.toLocaleTimeString('th-TH')} · รีเฟรชอัตโนมัติทุก 1 นาที` : 'กำลังโหลด...'}
      />
      <div style={{ padding: 24, flex: 1 }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#4a5568', fontSize: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            กำลังโหลดสถานะ Claude...
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '16px 20px', color: '#f87171', marginBottom: 20 }}>
            ❌ {error} —{' '}
            <button onClick={fetchStatus} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', textDecoration: 'underline', fontSize: 14 }}>ลองใหม่</button>
          </div>
        )}

        {data && (
          <>
            {/* Overall Status Banner */}
            <div style={{
              background: indConf.bg,
              border: `1px solid ${indConf.border}`,
              borderRadius: 16,
              padding: '24px 28px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 40 }}>{indConf.icon}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: indConf.color }}>{indConf.label}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    {data.summary.status.description}
                  </div>
                </div>
              </div>
              <a href="https://status.claude.com" target="_blank" rel="noopener noreferrer"
                style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap' }}>
                🔗 ดูเว็บต้นทาง
              </a>
            </div>

            {/* Active Incidents Warning */}
            {activeIncidents.length > 0 && (
              <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
                <div style={{ color: '#fb923c', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>🚨 Incident ที่กำลังเกิดขึ้น ({activeIncidents.length})</div>
                {activeIncidents.map((inc: Incident) => (
                  <div key={inc.id} style={{ color: '#fed7aa', fontSize: 13, marginBottom: 4 }}>
                    • {inc.name} <span style={{ color: '#fb923c' }}>({inc.status})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Components Grid */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                สถานะระบบ
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {components.map(comp => {
                  const s = COMPONENT_STATUS[comp.status] || COMPONENT_STATUS.operational
                  return (
                    <div key={comp.id} style={{
                      background: '#1a1d2e',
                      border: `1px solid ${s.color}30`,
                      borderRadius: 12,
                      padding: '16px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}>
                      <div>
                        <div style={{ color: 'white', fontWeight: 500, fontSize: 14 }}>{comp.name}</div>
                        <div style={{ color: '#4a5568', fontSize: 11, marginTop: 3 }}>
                          อัพเดท {timeAgo(comp.updated_at)}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: s.bg, padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap',
                      }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0,
                          boxShadow: comp.status === 'operational' ? `0 0 6px ${s.dot}` : 'none' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Incidents */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Incident ล่าสุด
              </div>

              {recentIncidents.length === 0 ? (
                <div style={{ background: '#1a1d2e', borderRadius: 12, border: '1px solid #2d3154', padding: '32px', textAlign: 'center', color: '#4a5568' }}>
                  🎉 ไม่มี Incident ที่บันทึกไว้
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentIncidents.map((inc: Incident) => {
                    const isExpanded = expandedIncident === inc.id
                    const impactColor = IMPACT_COLOR[inc.impact] || '#94a3b8'
                    const isResolved = inc.status === 'resolved'
                    return (
                      <div key={inc.id} style={{
                        background: '#1a1d2e',
                        border: `1px solid ${isResolved ? '#2d3154' : `${impactColor}40`}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}>
                        {/* Incident Header */}
                        <div
                          onClick={() => setExpandedIncident(isExpanded ? null : inc.id)}
                          style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ color: isResolved ? '#94a3b8' : impactColor, fontSize: 14, fontWeight: 600 }}>
                                {inc.name}
                              </span>
                              <span style={{
                                padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                                background: isResolved ? 'rgba(148,163,184,0.1)' : `${impactColor}20`,
                                color: isResolved ? '#94a3b8' : impactColor,
                                textTransform: 'capitalize', whiteSpace: 'nowrap',
                              }}>
                                {isResolved ? '✅ แก้ไขแล้ว' : `🔴 ${inc.status}`}
                              </span>
                            </div>
                            <div style={{ color: '#4a5568', fontSize: 12, marginTop: 3 }}>
                              {formatDateTH(inc.created_at)}
                              {inc.resolved_at && ` · แก้ไขแล้วใน ${formatDateTH(inc.resolved_at)}`}
                            </div>
                          </div>
                          <div style={{ color: '#4a5568', fontSize: 14, flexShrink: 0 }}>
                            {isExpanded ? '▲' : '▼'}
                          </div>
                        </div>

                        {/* Incident Updates (expanded) */}
                        {isExpanded && inc.incident_updates?.length > 0 && (
                          <div style={{ borderTop: '1px solid #2d3154', padding: '12px 18px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {inc.incident_updates.map((upd, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12 }}>
                                  <div style={{ flexShrink: 0, paddingTop: 2 }}>
                                    <div style={{
                                      width: 8, height: 8, borderRadius: '50%', marginTop: 4,
                                      background: i === 0 ? '#4ade80' : '#3a4060',
                                    }} />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'capitalize' }}>
                                        {upd.status}
                                      </span>
                                      <span style={{ fontSize: 11, color: '#4a5568' }}>
                                        {formatDateTH(upd.created_at)}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{upd.body}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 24, textAlign: 'center', color: '#3a4060', fontSize: 12 }}>
              ข้อมูลจาก{' '}
              <a href="https://status.claude.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
                status.claude.com
              </a>
              {' '}· รีเฟรชอัตโนมัติทุก 60 วินาที
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

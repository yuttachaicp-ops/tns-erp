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

// ===== Translation helpers =====

const STATUS_TH: Record<string, string> = {
  investigating: 'กำลังตรวจสอบ',
  identified:    'ระบุสาเหตุได้แล้ว',
  monitoring:    'กำลังติดตามผล',
  resolved:      'แก้ไขเรียบร้อยแล้ว',
  update:        'อัพเดท',
  postmortem:    'สรุปหลังเหตุการณ์',
}

// แปลวลีที่พบบ่อยใน body ข้อความของ Claude Status
const PHRASE_MAP: [RegExp, string][] = [
  [/we are currently investigating this issue\.?/gi,       'กำลังตรวจสอบปัญหาที่เกิดขึ้นอยู่'],
  [/we are investigating (elevated )?errors? on/gi,        'กำลังตรวจสอบข้อผิดพลาดที่เพิ่มขึ้นใน'],
  [/we will provide an update as soon as possible\.?/gi,   'จะอัพเดทข้อมูลโดยเร็วที่สุด'],
  [/the issue has been identified and a fix is being implemented\.?/gi, 'ระบุสาเหตุได้แล้ว และกำลังดำเนินการแก้ไข'],
  [/a fix has been implemented and we are monitoring the results\.?/gi, 'ดำเนินการแก้ไขแล้ว และกำลังติดตามผล'],
  [/this (issue|incident) has been resolved\.?/gi,         'ปัญหานี้ได้รับการแก้ไขเรียบร้อยแล้ว'],
  [/the incident( is now)? resolved\.?/gi,                 'เหตุการณ์ได้รับการแก้ไขเรียบร้อยแล้ว'],
  [/we are continuing to (work on|investigate|monitor)/gi, 'กำลังดำเนินการต่อเพื่อ'],
  [/we have identified the (cause|issue)/gi,               'ระบุสาเหตุได้แล้ว'],
  [/our (team|engineers) (is|are) (working|investigating)/gi, 'ทีมวิศวกรกำลังดำเนินการแก้ไข'],
  [/elevated error(s)? rate(s)?/gi,                        'อัตราข้อผิดพลาดสูงขึ้น'],
  [/elevated error(s)?/gi,                                 'ข้อผิดพลาดที่เพิ่มขึ้น'],
  [/degraded (performance|service)/gi,                     'ประสิทธิภาพลดลง'],
  [/success rate(s)? (have|has) returned to (expected levels|normal)/gi, 'อัตราความสำเร็จกลับสู่ระดับปกติแล้ว'],
  [/success rate(s)?/gi,                                   'อัตราความสำเร็จ'],
  [/requests? to (the model|claude)/gi,                    'คำขอที่ส่งไปยัง Claude'],
  [/users? (may|will) (see|experience)/gi,                 'ผู้ใช้งานอาจพบ'],
  [/users? saw/gi,                                         'ผู้ใช้งานพบ'],
  [/from \d{1,2}:\d{2}.*?utc through \d{1,2}:\d{2}.*?utc/gi, (m: string) => `ช่วงเวลา: ${m}`],
  [/we have resolved an issue/gi,                          'แก้ไขปัญหาเรียบร้อยแล้ว'],
  [/resulting in/gi,                                       'ซึ่งส่งผลให้'],
  [/affecting/gi,                                          'ที่กระทบกับ'],
  [/impact(ed)?/gi,                                        'ผลกระทบ'],
  [/as a result of this issue/gi,                          'อันเนื่องมาจากปัญหานี้'],
  [/working to (resolve|fix|mitigate)/gi,                  'กำลังดำเนินการแก้ไข'],
  [/all (models|systems) have (now )?fully recovered\.?/gi,'ทุกระบบกลับมาทำงานปกติแล้ว'],
  [/recovery time(s)? per model/gi,                        'เวลาที่ระบบกลับมาปกติแต่ละโมเดล'],
  [/has been resolved\.?/gi,                               'ได้รับการแก้ไขแล้ว'],
  [/are working to resolve these issues/gi,                'กำลังดำเนินการแก้ไขปัญหาเหล่านี้'],
  [/no further issues/gi,                                  'ไม่มีปัญหาเพิ่มเติม'],
  [/closely/gi,                                            'อย่างใกล้ชิด'],
  [/we are continuing to monitor/gi,                       'ยังคงติดตามสถานการณ์อยู่'],
  [/the impact started at/gi,                              'ผลกระทบเริ่มต้นเมื่อ'],
  [/and ended at/gi,                                       'และสิ้นสุดเมื่อ'],
]

function translateBody(text: string): string {
  let result = text
  for (const [pattern, replacement] of PHRASE_MAP) {
    if (typeof replacement === 'string') {
      result = result.replace(pattern, replacement)
    } else {
      result = result.replace(pattern, replacement as (m: string) => string)
    }
  }
  return result
}

function translateStatusLabel(status: string): string {
  return STATUS_TH[status.toLowerCase()] || status
}

// ===== UI Config =====

const COMPONENT_STATUS: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  operational:          { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   dot: '#4ade80', label: 'ปกติ' },
  degraded_performance: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', dot: '#fbbf24', label: 'ประสิทธิภาพลดลง' },
  partial_outage:       { color: '#fb923c', bg: 'rgba(249,115,22,0.1)', dot: '#fb923c', label: 'บางส่วนขัดข้อง' },
  major_outage:         { color: '#f87171', bg: 'rgba(239,68,68,0.1)',  dot: '#f87171', label: 'ขัดข้องร้ายแรง' },
  under_maintenance:    { color: '#818cf8', bg: 'rgba(99,102,241,0.1)', dot: '#818cf8', label: 'กำลังบำรุงรักษา' },
}

const INDICATOR_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  none:     { color: '#4ade80', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',  icon: '✅', label: 'ระบบทำงานปกติทั้งหมด' },
  minor:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', icon: '⚠️', label: 'มีปัญหาเล็กน้อยบางจุด' },
  major:    { color: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', icon: '🔶', label: 'มีปัญหาสำคัญ' },
  critical: { color: '#f87171', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  icon: '🔴', label: 'ระบบขัดข้องร้ายแรง' },
}

const IMPACT_COLOR: Record<string, string> = {
  none:     '#4ade80',
  minor:    '#fbbf24',
  major:    '#fb923c',
  critical: '#f87171',
}

const IMPACT_TH: Record<string, string> = {
  none:     'ไม่มีผลกระทบ',
  minor:    'ผลกระทบน้อย',
  major:    'ผลกระทบมาก',
  critical: 'วิกฤต',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d} วันที่แล้ว`
  if (h > 0) return `${h} ชม. ที่แล้ว`
  if (m > 0) return `${m} นาทีที่แล้ว`
  return 'เมื่อกี้'
}

function formatDateTH(dateStr: string) {
  return new Date(dateStr).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
  })
}

// แปลชื่อ component เป็นภาษาไทย
const COMPONENT_NAME_TH: Record<string, string> = {
  'claude.ai':                           'claude.ai (เว็บหลัก)',
  'Claude Console (platform.claude.com)':'Claude Console',
  'Claude API (api.anthropic.com)':      'Claude API',
  'Claude Code':                         'Claude Code',
  'Claude Cowork':                       'Claude Cowork',
  'Claude for Government':               'Claude สำหรับภาครัฐ',
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
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const indicator  = data?.summary?.status?.indicator || 'none'
  const indConf    = INDICATOR_CONFIG[indicator] || INDICATOR_CONFIG.none
  const components = data?.summary?.components || []
  const activeIncidents  = data?.summary?.incidents || []
  const recentIncidents  = data?.incidents?.incidents || []

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
              background: indConf.bg, border: `1px solid ${indConf.border}`,
              borderRadius: 16, padding: '24px 28px', marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 42 }}>{indConf.icon}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: indConf.color }}>{indConf.label}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    ข้อมูล ณ {lastUpdated ? formatDateTH(lastUpdated.toISOString()) : '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={fetchStatus}
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer', fontSize: 13 }}>
                  🔄 รีเฟรช
                </button>
                <a href="https://status.claude.com" target="_blank" rel="noopener noreferrer"
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(148,163,184,0.1)', border: '1px solid #2d3154', color: '#94a3b8', textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap' }}>
                  🔗 ต้นทาง
                </a>
              </div>
            </div>

            {/* Active Incidents Warning */}
            {activeIncidents.length > 0 && (
              <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
                <div style={{ color: '#fb923c', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
                  🚨 กำลังเกิด Incident ({activeIncidents.length} รายการ)
                </div>
                {activeIncidents.map((inc: Incident) => (
                  <div key={inc.id} style={{ color: '#fed7aa', fontSize: 13, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#fb923c', flexShrink: 0 }}>•</span>
                    <span>
                      <strong>{inc.name}</strong>
                      <span style={{ color: '#fb923c', marginLeft: 8, fontSize: 12 }}>
                        [{translateStatusLabel(inc.status)}]
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Components Grid */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                🖥️ สถานะระบบแต่ละส่วน
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {components.map(comp => {
                  const s = COMPONENT_STATUS[comp.status] || COMPONENT_STATUS.operational
                  const nameTH = COMPONENT_NAME_TH[comp.name] || comp.name
                  return (
                    <div key={comp.id} style={{
                      background: '#1a1d2e', border: `1px solid ${s.color}30`,
                      borderRadius: 12, padding: '16px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}>
                      <div>
                        <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{nameTH}</div>
                        <div style={{ color: '#3a4060', fontSize: 11, marginTop: 3 }}>
                          อัพเดท {timeAgo(comp.updated_at)}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: s.bg, padding: '5px 12px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%', background: s.dot,
                          boxShadow: comp.status === 'operational' ? `0 0 6px ${s.dot}` : 'none',
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Incidents */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                📋 รายการ Incident ล่าสุด
              </div>

              {recentIncidents.length === 0 ? (
                <div style={{ background: '#1a1d2e', borderRadius: 12, border: '1px solid #2d3154', padding: 32, textAlign: 'center', color: '#4a5568' }}>
                  🎉 ไม่มีเหตุการณ์ที่บันทึกไว้
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentIncidents.map((inc: Incident) => {
                    const isExpanded = expandedIncident === inc.id
                    const impactColor  = IMPACT_COLOR[inc.impact]  || '#94a3b8'
                    const impactTH     = IMPACT_TH[inc.impact]     || inc.impact
                    const isResolved   = inc.status === 'resolved'
                    return (
                      <div key={inc.id} style={{
                        background: '#1a1d2e',
                        border: `1px solid ${isResolved ? '#2d3154' : `${impactColor}40`}`,
                        borderRadius: 12, overflow: 'hidden',
                      }}>
                        {/* Header */}
                        <div
                          onClick={() => setExpandedIncident(isExpanded ? null : inc.id)}
                          style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <span style={{ color: isResolved ? '#94a3b8' : impactColor, fontSize: 14, fontWeight: 600 }}>
                                {inc.name}
                              </span>
                              <span style={{
                                padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                background: isResolved ? 'rgba(148,163,184,0.1)' : `${impactColor}20`,
                                color: isResolved ? '#94a3b8' : impactColor, whiteSpace: 'nowrap',
                              }}>
                                {isResolved ? '✅ แก้ไขแล้ว' : `🔴 ${translateStatusLabel(inc.status)}`}
                              </span>
                              <span style={{
                                padding: '2px 8px', borderRadius: 999, fontSize: 11,
                                background: 'rgba(99,102,241,0.1)', color: '#818cf8', whiteSpace: 'nowrap',
                              }}>
                                ผลกระทบ: {impactTH}
                              </span>
                            </div>
                            <div style={{ color: '#4a5568', fontSize: 12 }}>
                              🕐 เกิดขึ้น: {formatDateTH(inc.created_at)}
                              {inc.resolved_at && (
                                <span style={{ color: '#4ade80', marginLeft: 10 }}>
                                  · ✅ แก้ไขเมื่อ: {formatDateTH(inc.resolved_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ color: '#4a5568', fontSize: 13, flexShrink: 0, paddingTop: 2 }}>
                            {isExpanded ? '▲ ซ่อน' : '▼ ดูรายละเอียด'}
                          </div>
                        </div>

                        {/* Expanded Updates */}
                        {isExpanded && inc.incident_updates?.length > 0 && (
                          <div style={{ borderTop: '1px solid #2d3154', padding: '14px 18px 18px', background: '#141720' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                              ไทม์ไลน์การแก้ไข
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              {inc.incident_updates.map((upd, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <div style={{
                                      width: 10, height: 10, borderRadius: '50%', marginTop: 3, flexShrink: 0,
                                      background: i === 0 ? '#4ade80' : '#2d3154',
                                      border: i === 0 ? '2px solid #4ade8080' : '2px solid #3a4060',
                                    }} />
                                    {i < inc.incident_updates.length - 1 && (
                                      <div style={{ width: 1, flex: 1, background: '#2d3154', minHeight: 16, marginTop: 4 }} />
                                    )}
                                  </div>
                                  <div style={{ flex: 1, paddingBottom: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                                      <span style={{
                                        padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                        background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                                      }}>
                                        {translateStatusLabel(upd.status)}
                                      </span>
                                      <span style={{ fontSize: 11, color: '#4a5568' }}>
                                        {formatDateTH(upd.created_at)}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8, borderLeft: `3px solid ${i === 0 ? '#4ade80' : '#2d3154'}` }}>
                                      {translateBody(upd.body)}
                                    </div>
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

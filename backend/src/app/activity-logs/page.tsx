'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'

interface LogItem { id: string; action: string; module: string; detail: string; createdAt: string; user: { name: string; email: string } }

const MODULE_LABELS: Record<string,string> = { AUTH:'🔐 Auth', PHOTO_QUEUE:'📷 Photo Queue', LISTING_QUEUE:'🛒 Listing Queue', DAILY_LOGS:'📝 Daily Logs', USERS:'👥 Users' }
const ACTION_COLORS: Record<string,string> = { LOGIN:'#4ade80', CREATE:'#818cf8', UPDATE:'#fbbf24', DELETE:'#f87171' }

export default function ActivityLogsPage() {
  const [items, setItems] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [module, setModule] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('tns-token')
    const q = module ? `?module=${module}` : ''
    fetch(`/api/activity-logs${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setItems(d.data.items) })
      .finally(() => setLoading(false))
  }, [module])

  return (
    <AppShell>
      <Header title="📋 Activity Logs" subtitle="ประวัติการใช้งานระบบ" />
      <div style={{padding:'24px',flex:1}}>
        <div style={{marginBottom:'16px'}}>
          <select value={module} onChange={e => setModule(e.target.value)}
            style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}>
            <option value="">ทุก Module</option>
            <option value="AUTH">Auth</option>
            <option value="PHOTO_QUEUE">Photo Queue</option>
            <option value="LISTING_QUEUE">Listing Queue</option>
            <option value="DAILY_LOGS">Daily Logs</option>
            <option value="USERS">Users</option>
          </select>
        </div>
        <div style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
            <thead><tr style={{background:'#0f1117'}}>
              {['เวลา','ผู้ใช้','Action','Module','รายละเอียด'].map(h => (
                <th key={h} style={{padding:'12px 16px',textAlign:'left',color:'#6366f1',fontWeight:'600',fontSize:'12px',textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>⏳ กำลังโหลด...</td></tr>
              : items.length === 0 ? <tr><td colSpan={5} style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>📭 ไม่มีข้อมูล</td></tr>
              : items.map(log => (
                <tr key={log.id} style={{borderTop:'1px solid #2d3154'}}>
                  <td style={{padding:'12px 16px',color:'#94a3b8',fontSize:'12px',whiteSpace:'nowrap'}}>{new Date(log.createdAt).toLocaleString('th-TH')}</td>
                  <td style={{padding:'12px 16px',color:'white',fontWeight:'500'}}>{log.user?.name}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{padding:'3px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:'700',background:`${ACTION_COLORS[log.action]}18`,color:ACTION_COLORS[log.action]||'#94a3b8',letterSpacing:'1px'}}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{padding:'12px 16px',color:'#94a3b8',fontSize:'13px'}}>{MODULE_LABELS[log.module] || log.module}</td>
                  <td style={{padding:'12px 16px',color:'#e2e8f0',fontSize:'13px'}}>{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}

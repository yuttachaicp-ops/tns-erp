'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'

interface DashboardData {
  summary: {
    photoQueueTotal: number; photoQueuePending: number
    listingQueueTotal: number; listingQueuePending: number
    todayLogs: number; pendingLogs: number
  }
  recentActivities: Array<{ id: string; action: string; module: string; detail: string; createdAt: string; user: { name: string } }>
}

interface PlatformPricing {
  id: string; platform: string; multiplier: number; note: string | null
}

const PLATFORM_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  SHOPEE: { label: 'Shopee', icon: '🧡', color: '#fb923c', bg: 'rgba(251,146,60,0.08)' },
  LAZADA: { label: 'Lazada', icon: '💜', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
}

function KPICard({ icon, label, value, sub, color }: { icon: string; label: string; value: number; sub: string; color: string }) {
  return (
    <div style={{background:'#1a1d2e',borderRadius:'14px',border:'1px solid #2d3154',padding:'20px',display:'flex',flexDirection:'column',gap:'8px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-20px',right:'-20px',width:'80px',height:'80px',borderRadius:'50%',background:`${color}15`}}></div>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <span style={{fontSize:'24px'}}>{icon}</span>
        <span style={{fontSize:'13px',color:'#94a3b8'}}>{label}</span>
      </div>
      <div style={{fontSize:'36px',fontWeight:'800',color:'white'}}>{value.toLocaleString()}</div>
      <div style={{fontSize:'12px',color,fontWeight:'600'}}>{sub}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [pricing, setPricing] = useState<PlatformPricing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tns-token')
    Promise.all([
      fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/platform-pricing', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([dash, price]) => {
      if (dash.success)   setData(dash.data)
      if (price.success)  setPricing(price.data)
    }).finally(() => setLoading(false))
  }, [])

  const s = data?.summary

  return (
    <AppShell>
      <Header title="📊 Dashboard" subtitle="ภาพรวมการดำเนินงานประจำวัน" />
      <div style={{padding:'24px',flex:1}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'60px',color:'#4a5568'}}>⏳ กำลังโหลข้อมูล...</div>
        ) : (
          <>
            {/* KPI Grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'16px',marginBottom:'24px'}}>
              <KPICard icon="📷" label="สินค้ารอถ่ายรูป"    value={s?.photoQueuePending||0}   sub={`ทั้งหมด ${s?.photoQueueTotal||0} รายการ`}   color="#fbbf24" />
              <KPICard icon="🛒" label="สินค้ายังไม่ลงขาย"  value={s?.listingQueuePending||0} sub={`ทั้งหมด ${s?.listingQueueTotal||0} รายการ`} color="#f87171" />
              <KPICard icon="📝" label="งานวันนี้"           value={s?.todayLogs||0}           sub="บันทึกวันนี้"                                  color="#4ade80" />
              <KPICard icon="⏰" label="งานค้าง"             value={s?.pendingLogs||0}         sub="รอดำเนินการ"                                   color="#818cf8" />
            </div>

            {/* Platform Pricing */}
            {pricing.length > 0 && (
              <div style={{marginBottom:'24px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <h3 style={{margin:0,fontSize:'15px',fontWeight:'700',color:'white'}}>💰 ตัวคูณราคาแพลตฟอร์ม</h3>
                  <Link href="/platform-pricing" style={{fontSize:12,color:'#6366f1',textDecoration:'none'}}>แก้ไข →</Link>
                </div>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  {pricing.map(p => {
                    const meta = PLATFORM_META[p.platform] || { label: p.platform, icon: '🛒', color: '#818cf8', bg: 'rgba(99,102,241,0.08)' }
                    return (
                      <div key={p.id} style={{background: meta.bg, border:`1px solid ${meta.color}30`, borderRadius:12, padding:'14px 20px', display:'flex', alignItems:'center', gap:14, minWidth:180}}>
                        <span style={{fontSize:22}}>{meta.icon}</span>
                        <div>
                          <div style={{fontSize:13,color:'#94a3b8'}}>{meta.label}</div>
                          <div style={{fontSize:22,fontWeight:800,color:meta.color}}>×{p.multiplier}</div>
                          {p.note && <div style={{fontSize:11,color:'#4a5568',marginTop:2}}>{p.note}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div style={{background:'#1a1d2e',borderRadius:'14px',border:'1px solid #2d3154',padding:'20px'}}>
              <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'700',color:'white'}}>🕐 กิจกรรมล่าสุด</h3>
              {data?.recentActivities.length === 0 ? (
                <p style={{color:'#4a5568',textAlign:'center',padding:'20px'}}>ยังไม่มีกิจกรรม</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {data?.recentActivities.map(a => (
                    <div key={a.id} style={{display:'flex',gap:'12px',padding:'10px 12px',borderRadius:'8px',background:'rgba(99,102,241,0.05)',border:'1px solid #2d3154'}}>
                      <div style={{flex:1}}>
                        <span style={{color:'#818cf8',fontWeight:'600',fontSize:'13px'}}>{a.user?.name}</span>
                        <span style={{color:'#94a3b8',fontSize:'13px'}}> — {a.detail}</span>
                      </div>
                      <div style={{color:'#4a5568',fontSize:'11px',whiteSpace:'nowrap'}}>
                        {new Date(a.createdAt).toLocaleString('th-TH')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

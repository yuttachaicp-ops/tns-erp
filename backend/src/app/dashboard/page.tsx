'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'

interface UrgentOrder {
  id: string; orderNumber: string; platform: string; shop: string; orderStatus: string
  orderDate: string | null; status: string; buyerName: string | null; trackingNumber: string | null
  items: Array<{ productName: string; quantity: number; isOutOfStock: boolean }>
}

interface DashboardData {
  summary: {
    photoQueueTotal: number; photoQueuePending: number
    listingQueueTotal: number; listingQueuePending: number
    todayLogs: number; pendingLogs: number
    delayedOrdersPending: number
  }
  recentActivities: Array<{ id: string; action: string; module: string; detail: string; createdAt: string; user: { name: string } }>
  urgentOrders: UrgentOrder[]
}

interface PlatformPricing {
  id: string; platform: string; multiplier: number; note: string | null
}

function KPICard({ icon, label, value, sub, color }: { icon: string; label: string; value: number; sub: string; color: string }) {
  return (
    <div style={{background:'#1a1d2e',borderRadius:'14px',border:'1px solid #2d3154',padding:'20px',display:'flex',flexDirection:'column',gap:'8px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-20px',right:'-20px',width:'80px',height:'80px',borderRadius:'50%',background:`${color}15`}}></div>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <span style={{fontSize:'20px'}}>{icon}</span>
        <span style={{fontSize:'13px',color:'#94a3b8'}}>{label}</span>
      </div>
      <div style={{fontSize:'36px',fontWeight:'800',color:'white'}}>{value.toLocaleString()}</div>
      <div style={{fontSize:'12px',color,fontWeight:'600'}}>{sub}</div>
    </div>
  )
}

function getCancelDeadline(orderDate: string | null): Date | null {
  if (!orderDate) return null
  const d = new Date(orderDate)
  if (isNaN(d.getTime())) return null
  d.setDate(d.getDate() + 4)
  return d
}

function getCancelDiff(orderDate: string | null): number | null {
  const deadline = getCancelDeadline(orderDate)
  if (!deadline) return null
  const now = new Date()
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const deadDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
  return Math.floor((deadDay.getTime() - today.getTime()) / 86400000)
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
      if (dash.success)  setData(dash.data)
      if (price.success) setPricing(price.data)
    }).finally(() => setLoading(false))
  }, [])

  const s = data?.summary
  const allOrders     = data?.urgentOrders ?? []
  const lastDayOrders = allOrders.filter(o => getCancelDiff(o.orderDate) === 0)
  const overdueCount  = allOrders.filter(o => { const d = getCancelDiff(o.orderDate); return d !== null && d < 0 }).length
  const urgentCount   = lastDayOrders.length

  return (
    <AppShell>
      <Header title="Dashboard" subtitle="ภาพรวมการดำเนินงานประจำวัน" />
      <div style={{padding:'24px',flex:1}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'60px',color:'#4a5568'}}>กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            {/* KPI Grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'16px',marginBottom:'24px'}}>
              <KPICard icon="[cam]"  label="สินค้ารอถ่ายรูป"    value={s?.photoQueuePending||0}   sub={`ทั้งหมด ${s?.photoQueueTotal||0} รายการ`}   color="#fbbf24" />
              <KPICard icon="[cart]" label="สินค้ายังไม่ลงขาย"  value={s?.listingQueuePending||0} sub={`ทั้งหมด ${s?.listingQueueTotal||0} รายการ`}  color="#f87171" />
              <KPICard icon="[log]"  label="งานวันนี้"           value={s?.todayLogs||0}           sub="บันทึกวันนี้"                                   color="#4ade80" />
              <KPICard icon="[clk]"  label="งานค้าง"             value={s?.pendingLogs||0}         sub="รอดำเนินการ"                                    color="#818cf8" />
              <KPICard icon="[box]"  label="ออร์เดอร์ค้างส่ง"   value={s?.delayedOrdersPending||0} sub={`เกินกำหนด ${overdueCount} | วันสุดท้าย ${urgentCount}`} color="#f87171" />
            </div>

            {/* Platform Pricing */}
            {pricing.length > 0 && (
              <div style={{marginBottom:'24px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <h3 style={{margin:0,fontSize:'15px',fontWeight:'700',color:'white'}}>ตัวคูณราคาแพลตฟอร์ม</h3>
                  <Link href="/platform-pricing" style={{fontSize:12,color:'#6366f1',textDecoration:'none'}}>แก้ไข</Link>
                </div>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  {pricing.map(p => {
                    const isShopee = p.platform === 'SHOPEE'
                    const color = isShopee ? '#fb923c' : '#a78bfa'
                    const bg    = isShopee ? 'rgba(251,146,60,0.08)' : 'rgba(167,139,250,0.08)'
                    return (
                      <div key={p.id} style={{background: bg, border:`1px solid ${color}30`, borderRadius:12, padding:'14px 20px', display:'flex', alignItems:'center', gap:14, minWidth:180}}>
                        <div style={{fontSize:13,fontWeight:800,color}}>{p.platform}</div>
                        <div>
                          <div style={{fontSize:22,fontWeight:800,color}}>x{p.multiplier}</div>
                          {p.note && <div style={{fontSize:11,color:'#4a5568',marginTop:2}}>{p.note}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Last-Day Orders — filtered in browser to match Bangkok timezone */}
            {lastDayOrders.length > 0 && (
              <div style={{marginBottom:'24px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <h3 style={{margin:0,fontSize:'15px',fontWeight:'700',color:'#ef4444'}}>
                    วันสุดท้ายก่อนยกเลิกอัตโนมัติ ({lastDayOrders.length} ออร์เดอร์)
                  </h3>
                  <Link href="/delayed-orders" style={{fontSize:12,color:'#6366f1',textDecoration:'none'}}>ดูทั้งหมด</Link>
                </div>
                <div style={{background:'#1a1d2e',border:'2px solid rgba(239,68,68,0.4)',borderRadius:12,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:'110px 1fr 150px 120px',padding:'8px 16px',background:'rgba(239,68,68,0.08)',fontSize:11,color:'#f87171',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                    <div>ยกเลิกวันนี้</div>
                    <div>เลขออร์เดอร์ / ผู้ซื้อ</div>
                    <div>สินค้า</div>
                    <div>สถานะ</div>
                  </div>
                  {lastDayOrders.map(o => {
                    const deadline = getCancelDeadline(o.orderDate)
                    return (
                      <div key={o.id} style={{display:'grid',gridTemplateColumns:'110px 1fr 150px 120px',padding:'10px 16px',borderTop:'1px solid rgba(239,68,68,0.2)',alignItems:'center'}}>
                        <div style={{fontSize:12,color:'#ef4444',fontWeight:700}}>
                          {deadline ? deadline.toLocaleDateString('th-TH',{day:'numeric',month:'short'}) : '-'}
                          {o.orderDate && (
                            <div style={{fontSize:10,color:'#4a5568',marginTop:1}}>
                              {'สั่ง '}{new Date(o.orderDate).toLocaleDateString('th-TH',{day:'numeric',month:'short'})}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                            <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:4,
                              background: o.platform==='SHOPEE' ? 'rgba(251,146,60,0.15)' : 'rgba(167,139,250,0.15)',
                              color:      o.platform==='SHOPEE' ? '#fb923c' : '#a78bfa',
                            }}>
                              {o.platform==='SHOPEE' ? 'Shopee' : 'Lazada'}
                            </span>
                            <span style={{fontSize:11,color:'white',fontFamily:'monospace'}}>{o.orderNumber}</span>
                          </div>
                          <div style={{fontSize:11,color:'#64748b'}}>{o.buyerName || '-'}</div>
                        </div>
                        <div style={{fontSize:11,color:'#94a3b8'}}>
                          {o.items.slice(0,2).map((it, i) => (
                            <div key={i} style={{color: it.isOutOfStock ? '#f87171' : '#94a3b8'}}>
                              {it.isOutOfStock ? '[!] ' : ''}{it.productName.slice(0,26)}{it.productName.length > 26 ? '..' : ''} x{it.quantity}
                            </div>
                          ))}
                          {o.items.length > 2 && <div style={{color:'#4a5568'}}>+{o.items.length-2} รายการ</div>}
                        </div>
                        <div style={{fontSize:11}}>
                          {o.status === 'PACKED'        && <span style={{color:'#60a5fa'}}>แพ็คแล้ว</span>}
                          {o.status === 'READY_TO_SHIP' && <span style={{color:'#34d399'}}>เตรียมส่ง</span>}
                          {o.status === 'PENDING'       && <span style={{color:'#fbbf24'}}>รอดำเนินการ</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div style={{background:'#1a1d2e',borderRadius:'14px',border:'1px solid #2d3154',padding:'20px'}}>
              <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'700',color:'white'}}>กิจกรรมล่าสุด</h3>
              {(data?.recentActivities.length ?? 0) === 0 ? (
                <p style={{color:'#4a5568',textAlign:'center',padding:'20px'}}>ยังไม่มีกิจกรรม</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {data?.recentActivities.map(a => (
                    <div key={a.id} style={{display:'flex',gap:'12px',padding:'10px 12px',borderRadius:'8px',background:'rgba(99,102,241,0.05)',border:'1px solid #2d3154'}}>
                      <div style={{flex:1}}>
                        <span style={{color:'#818cf8',fontWeight:'600',fontSize:'13px'}}>{a.user?.name}</span>
                        <span style={{color:'#94a3b8',fontSize:'13px'}}>{' — '}{a.detail}</span>
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

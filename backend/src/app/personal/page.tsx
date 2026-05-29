'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'

const fmt = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2 })

export default function Page() {
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [bTot, setBTot] = useState(0)
  const [bPaid, setBPaid] = useState(0)
  const [mMonthly, setMMonthly] = useState(0)
  const [mRemaining, setMRemaining] = useState(0)
  const [mCount, setMCount] = useState(0)
  const [cMonthly, setCMonthly] = useState(0)
  const [cRemaining, setCRemaining] = useState(0)
  const [cCount, setCCount] = useState(0)
  const [sTotal, setSTotal] = useState(0)
  const [sSaved, setSSaved] = useState(0)
  const [sCount, setSCount] = useState(0)
  const month = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    const tok = localStorage.getItem('tns-token')
    const h = { Authorization: `Bearer ${tok}` }
    fetch(`/api/transactions?month=${month}`, { headers: h }).then(r => r.json()).then(d => {
      if (d.success) { setIncome(d.data.income); setExpense(d.data.expense) }
    })
    fetch(`/api/bills?month=${month}`, { headers: h }).then(r => r.json()).then(d => {
      if (d.success) { setBTot(d.data.totalAmount); setBPaid(d.data.paidAmount) }
    })
    fetch('/api/mortgage', { headers: h }).then(r => r.json()).then((data: any[]) => {
      if (Array.isArray(data)) {
        setMCount(data.filter(m => m.paidInstallments < m.totalInstallments).length)
        setMMonthly(data.reduce((s, m) => s + m.monthlyPayment, 0))
        setMRemaining(data.reduce((s, m) => s + (m.totalInstallments - m.paidInstallments) * m.monthlyPayment, 0))
      }
    })
    fetch('/api/car-loans', { headers: h }).then(r => r.json()).then((data: any[]) => {
      if (Array.isArray(data)) {
        setCCount(data.filter(l => l.paidInstallments < l.totalInstallments).length)
        setCMonthly(data.reduce((s, l) => s + l.monthlyPayment, 0))
        setCRemaining(data.reduce((s, l) => s + (l.totalInstallments - l.paidInstallments) * l.monthlyPayment, 0))
      }
    })
    fetch('/api/savings-goals', { headers: h }).then(r => r.json()).then((data: any[]) => {
      if (Array.isArray(data)) {
        setSCount(data.filter(g => g.savedAmount < g.targetAmount).length)
        setSTotal(data.reduce((s, g) => s + g.targetAmount, 0))
        setSSaved(data.reduce((s, g) => s + g.savedAmount, 0))
      }
    })
  }, [month])

  const bal = income - expense
  const thM = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
  const totalMonthlyLoan = mMonthly + cMonthly

  return (
    <AppShell>
      <Header title="🏠 ส่วนตัว" subtitle={`ภาพรวมเดือน${thM}`} />
      <div style={{ padding: '24px', flex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* ภาระผ่อนต่อเดือนรวม */}
          {totalMonthlyLoan > 0 && (
            <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>ภาระผ่อนต่อเดือนทั้งหมด (บ้าน + รถ)</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#f87171' }}>฿{fmt(totalMonthlyLoan)}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                บ้าน ฿{fmt(mMonthly)} + รถ ฿{fmt(cMonthly)}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px' }}>

            {/* รายรับ-รายจ่าย */}
            <Link href="/income-expense" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#1a1d2e', borderRadius: '16px', border: '1px solid #2d3154', padding: '20px', cursor: 'pointer', height: '100%', boxSizing: 'border-box' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>💰</span>
                  <span style={{ fontWeight: '700', color: 'white', fontSize: '16px' }}>รายรับ-รายจ่าย</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>รายรับ</div>
                    <div style={{ fontWeight: '700', color: '#4ade80', fontSize: '15px' }}>฿{fmt(income)}</div>
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>รายจ่าย</div>
                    <div style={{ fontWeight: '700', color: '#f87171', fontSize: '15px' }}>฿{fmt(expense)}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>คงเหลือ</span>
                  <span style={{ fontWeight: '700', color: bal >= 0 ? '#818cf8' : '#f87171', fontSize: '16px' }}>฿{fmt(bal)}</span>
                </div>
              </div>
            </Link>

            {/* ผ่อนบ้าน */}
            <Link href="/personal/mortgage" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#1a1d2e', borderRadius: '16px', border: '1px solid #2d3154', padding: '20px', cursor: 'pointer', height: '100%', boxSizing: 'border-box' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>🏡</span>
                  <span style={{ fontWeight: '700', color: 'white', fontSize: '16px' }}>ผ่อนบ้าน</span>
                  {mCount > 0 && <span style={{ marginLeft: 'auto', background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '12px', fontWeight: '600', padding: '2px 10px', borderRadius: 20 }}>{mCount} หลัง</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>ผ่อน/เดือน</div>
                    <div style={{ fontWeight: '700', color: '#818cf8', fontSize: '15px' }}>฿{fmt(mMonthly)}</div>
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>คงเหลือรวม</div>
                    <div style={{ fontWeight: '700', color: '#f87171', fontSize: '15px' }}>฿{fmt(mRemaining)}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{mCount > 0 ? `กำลังผ่อนอยู่ ${mCount} หลัง` : 'ยังไม่มีข้อมูล'}</span>
                  <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>ดูรายละเอียด →</span>
                </div>
              </div>
            </Link>

            {/* ผ่อนรถ */}
            <Link href="/personal/car-loans" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#1a1d2e', borderRadius: '16px', border: '1px solid #2d3154', padding: '20px', cursor: 'pointer', height: '100%', boxSizing: 'border-box' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>🚗</span>
                  <span style={{ fontWeight: '700', color: 'white', fontSize: '16px' }}>ผ่อนรถ</span>
                  {cCount > 0 && <span style={{ marginLeft: 'auto', background: 'rgba(34,211,238,0.2)', color: '#22d3ee', fontSize: '12px', fontWeight: '600', padding: '2px 10px', borderRadius: 20 }}>{cCount} คัน</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(34,211,238,0.1)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>ผ่อน/เดือน</div>
                    <div style={{ fontWeight: '700', color: '#22d3ee', fontSize: '15px' }}>฿{fmt(cMonthly)}</div>
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>คงเหลือรวม</div>
                    <div style={{ fontWeight: '700', color: '#f87171', fontSize: '15px' }}>฿{fmt(cRemaining)}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(34,211,238,0.05)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{cCount > 0 ? `กำลังผ่อนอยู่ ${cCount} คัน` : 'ยังไม่มีข้อมูล'}</span>
                  <span style={{ fontSize: '12px', color: '#22d3ee', fontWeight: 600 }}>ดูรายละเอียด →</span>
                </div>
              </div>
            </Link>

            {/* เป้าหมายการออม */}
            <Link href="/personal/savings-goals" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#1a1d2e', borderRadius: '16px', border: '1px solid #2d3154', padding: '20px', cursor: 'pointer', height: '100%', boxSizing: 'border-box' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>🎯</span>
                  <span style={{ fontWeight: '700', color: 'white', fontSize: '16px' }}>เป้าหมายการออม</span>
                  {sCount > 0 && <span style={{ marginLeft: 'auto', background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '12px', fontWeight: '600', padding: '2px 10px', borderRadius: 20 }}>{sCount} เป้าหมาย</span>}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>ออมแล้ว ฿{fmt(sSaved)}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#fbbf24' }}>{sTotal > 0 ? ((sSaved / sTotal) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '999px', background: '#2d3154', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', width: sTotal > 0 ? `${Math.min(100, (sSaved / sTotal) * 100)}%` : '0%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>เป้าหมายรวม ฿{fmt(sTotal)}</span>
                  <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600 }}>ดูรายละเอียด →</span>
                </div>
              </div>
            </Link>

            {/* บิลรายเดือน */}
            <Link href="/bills" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#1a1d2e', borderRadius: '16px', border: '1px solid #2d3154', padding: '20px', cursor: 'pointer', height: '100%', boxSizing: 'border-box' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>🧾</span>
                  <span style={{ fontWeight: '700', color: 'white', fontSize: '16px' }}>บิลรายเดือน</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>จ่ายแล้ว</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#4ade80' }}>฿{fmt(bPaid)}</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '999px', background: '#2d3154', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#4ade80,#22c55e)', width: bTot > 0 ? `${Math.min(100, (bPaid / bTot) * 100)}%` : '0%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>ค้างจ่าย</span>
                  <span style={{ fontWeight: '700', color: bTot - bPaid > 0 ? '#f87171' : '#4ade80', fontSize: '16px' }}>฿{fmt(bTot - bPaid)}</span>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </AppShell>
  )
}

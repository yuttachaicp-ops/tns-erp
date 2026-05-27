'use client'
import{useEffect,useState}from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
const fmt=(n:number)=>n.toLocaleString('th-TH',{minimumFractionDigits:2})
export default function Page(){
  const[income,setIncome]=useState(0),[expense,setExpense]=useState(0)
  const[bTot,setBTot]=useState(0),[bPaid,setBPaid]=useState(0)
  const month=new Date().toISOString().slice(0,7)
  useEffect(()=>{
    const tok=localStorage.getItem('tns-token')
    const h={Authorization:`Bearer ${tok}`}
    fetch(`/api/transactions?month=${month}`,{headers:h}).then(r=>r.json()).then(d=>{if(d.success){setIncome(d.data.income);setExpense(d.data.expense)}})
    fetch(`/api/bills?month=${month}`,{headers:h}).then(r=>r.json()).then(d=>{if(d.success){setBTot(d.data.totalAmount);setBPaid(d.data.paidAmount)}})
  },[month])
  const bal=income-expense
  const thM=new Date().toLocaleDateString('th-TH',{month:'long',year:'numeric'})
  return(<AppShell>
    <Header title="🏠 ส่วนตัว" subtitle={`ภาพรวมเดือน${thM}`}/>
    <div style={{padding:'24px',flex:1}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'20px'}}>
        <Link href="/income-expense" style={{textDecoration:'none'}}>
          <div style={{background:'#1a1d2e',borderRadius:'16px',border:'1px solid #2d3154',padding:'20px',cursor:'pointer'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
              <span style={{fontSize:'24px'}}>💰</span><span style={{fontWeight:'700',color:'white',fontSize:'16px'}}>รายรับ-รายจ่าย</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
              <div style={{background:'rgba(34,197,94,0.1)',borderRadius:'8px',padding:'10px'}}>
                <div style={{fontSize:'11px',color:'#94a3b8',marginBottom:'2px'}}>รายรับ</div>
                <div style={{fontWeight:'700',color:'#4ade80',fontSize:'15px'}}>฿{fmt(income)}</div>
              </div>
              <div style={{background:'rgba(239,68,68,0.1)',borderRadius:'8px',padding:'10px'}}>
                <div style={{fontSize:'11px',color:'#94a3b8',marginBottom:'2px'}}>รายจ่าย</div>
                <div style={{fontWeight:'700',color:'#f87171',fontSize:'15px'}}>฿{fmt(expense)}</div>
              </div>
            </div>
            <div style={{background:'rgba(99,102,241,0.1)',borderRadius:'8px',padding:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'12px',color:'#94a3b8'}}>คงเหลือ</span>
              <span style={{fontWeight:'700',color:bal>=0?'#818cf8':'#f87171',fontSize:'16px'}}>฿{fmt(bal)}</span>
            </div>
          </div>
        </Link>
        <Link href="/bills" style={{textDecoration:'none'}}>
          <div style={{background:'#1a1d2e',borderRadius:'16px',border:'1px solid #2d3154',padding:'20px',cursor:'pointer'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
              <span style={{fontSize:'24px'}}>🧾</span><span style={{fontWeight:'700',color:'white',fontSize:'16px'}}>บิลรายเดือน</span>
            </div>
            <div style={{marginBottom:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                <span style={{fontSize:'12px',color:'#94a3b8'}}>จ่ายแล้ว</span>
                <span style={{fontSize:'12px',fontWeight:'600',color:'#4ade80'}}>฿{fmt(bPaid)}</span>
              </div>
              <div style={{height:'6px',borderRadius:'999px',background:'#2d3154',overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:'999px',background:'linear-gradient(90deg,#4ade80,#22c55e)',width:bTot>0?`${Math.min(100,(bPaid/bTot)*100)}%`:'0%'}}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'12px',color:'#64748b'}}>ค้างจ่าย</span>
              <span style={{fontWeight:'700',color:bTot-bPaid>0?'#f87171':'#4ade80',fontSize:'16px'}}>฿{fmt(bTot-bPaid)}</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  </AppShell>)
}
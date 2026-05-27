'use client'
import{useEffect,useState,useCallback}from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
const IC=['เงินเดือน','โบนัส','รายได้จากธุรกิจ','ค่าเช่า','งานเสริมหลังเลิกงาน','อื่นๆ']
const EC=['อาหาร','ค่าเดินทาง','ค่าสาธารณูปโภค','ช้อปปิ้ง','บันเทิง','สุขภาพ','ค่าขนมแมวน้อย','ค่ารักษาแมวน้อย','อื่นๆ']
interface T{id:string;type:string;amount:number;category:string;description?:string;date:string}
const E0:Partial<T>={type:'EXPENSE',amount:0,category:'อาหาร',description:'',date:''}
const fmt=(n:number)=>n.toLocaleString('th-TH',{minimumFractionDigits:2})
export default function Page(){
  const[items,setItems]=useState<T[]>([])
  const[income,setIncome]=useState(0),[expense,setExpense]=useState(0)
  const[month,setMonth]=useState(()=>new Date().toISOString().slice(0,7))
  const[tf,setTf]=useState(''),[modal,setModal]=useState(false)
  const[ed,setEd]=useState<Partial<T>>(E0),[isEdit,setIsEdit]=useState(false)
  const fetch2=useCallback(async()=>{
    const tok=localStorage.getItem('tns-token')
    const q=new URLSearchParams({month});if(tf)q.set('type',tf)
    const r=await fetch(`/api/transactions?${q}`,{headers:{Authorization:`Bearer ${tok}`}})
    const d=await r.json();if(d.success){setItems(d.data.items);setIncome(d.data.income);setExpense(d.data.expense)}
  },[month,tf])
  useEffect(()=>{fetch2()},[fetch2])
  async function save(){
    const tok=localStorage.getItem('tns-token')
    const url=isEdit?`/api/transactions/${ed.id}`:'/api/transactions'
    await fetch(url,{method:isEdit?'PUT':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({...ed,amount:Number(ed.amount)})})
    setModal(false);setEd(E0);fetch2()
  }
  async function del(id:string){
    if(!confirm('ยืนยันการลบ?'))return
    await fetch(`/api/transactions/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${localStorage.getItem('tns-token') as string}`}})
    fetch2()
  }
  const cats=ed.type==='INCOME'?IC:EC
  const bal=income-expense
  return(<AppShell>
    <Header title="💰 รายรับ-รายจ่าย" subtitle={`เดือน ${month}`}/>
    <div style={{padding:'24px',flex:1}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'24px'}}>
        {[{l:'รายรับ',v:income,c:'#4ade80',b:'rgba(34,197,94,0.1)',i:'💚'},{l:'รายจ่าย',v:expense,c:'#f87171',b:'rgba(239,68,68,0.1)',i:'❤️'},{l:'คงเหลือ',v:bal,c:bal>=0?'#818cf8':'#f87171',b:'rgba(99,102,241,0.1)',i:'💜'}].map(x=>(
          <div key={x.l} style={{background:x.b,borderRadius:'12px',padding:'16px',border:`1px solid ${x.c}22`}}>
            <div style={{fontSize:'12px',color:'#94a3b8',marginBottom:'4px'}}>{x.i} {x.l}</div>
            <div style={{fontSize:'22px',fontWeight:'700',color:x.c}}>฿{fmt(x.v)}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}/>
        <select value={tf} onChange={e=>setTf(e.target.value)} style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}>
          <option value="">ทั้งหมด</option><option value="INCOME">รายรับ</option><option value="EXPENSE">รายจ่าย</option>
        </select>
        <button onClick={()=>{setEd({...E0,date:new Date().toISOString().split('T')[0]});setIsEdit(false);setModal(true)}} style={{marginLeft:'auto',padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',cursor:'pointer',fontWeight:'600'}}>+ เพิ่มรายการ</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {items.length===0?<div style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>📭 ไม่มีข้อมูล</div>
        :items.map(item=>(
          <div key={item.id} style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'22px'}}>{item.type==='INCOME'?'💚':'❤️'}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                <span style={{fontWeight:'600',color:'white',fontSize:'14px'}}>{item.category}</span>
                <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'999px',background:item.type==='INCOME'?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)',color:item.type==='INCOME'?'#4ade80':'#f87171'}}>{item.type==='INCOME'?'รายรับ':'รายจ่าย'}</span>
              </div>
              {item.description&&<div style={{fontSize:'12px',color:'#64748b',marginTop:'2px'}}>{item.description}</div>}
              <div style={{fontSize:'12px',color:'#4a5568',marginTop:'2px'}}>📅 {new Date(item.date).toLocaleDateString('th-TH')}</div>
            </div>
            <div style={{fontSize:'16px',fontWeight:'700',color:item.type==='INCOME'?'#4ade80':'#f87171',minWidth:'100px',textAlign:'right'}}>{item.type==='INCOME'?'+':'-'}฿{fmt(item.amount)}</div>
            <div style={{display:'flex',gap:'4px'}}>
              <button onClick={()=>{setEd(item);setIsEdit(true);setModal(true)}} style={{padding:'6px 8px',borderRadius:'6px',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#818cf8',cursor:'pointer'}}>✏️</button>
              <button onClick={()=>del(item.id)} style={{padding:'6px 8px',borderRadius:'6px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',cursor:'pointer'}}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Modal open={modal} onClose={()=>setModal(false)} title={isEdit?'✏️ แก้ไขรายการ':'➕ เพิ่มรายการ'}>
      <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>ประเภท</label>
            <select value={ed.type||'EXPENSE'} onChange={e=>setEd({...ed,type:e.target.value,category:''})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
              <option value="INCOME">💚 รายรับ</option><option value="EXPENSE">❤️ รายจ่าย</option>
            </select></div>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>หมวดหมู่</label>
            <select value={ed.category||''} onChange={e=>setEd({...ed,category:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
              {cats.map(c=><option key={c} value={c}>{c}</option>)}
            </select></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>จำนวนเงิน (บาท)</label>
            <input type="number" min="0" step="0.01" value={ed.amount||''} onChange={e=>setEd({...ed,amount:parseFloat(e.target.value)||0})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>วันที่</label>
            <input type="date" value={(ed.date||'').split('T')[0]} onChange={e=>setEd({...ed,date:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
        </div>
        <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>หมายเหตุ</label>
          <input type="text" value={ed.description||''} onChange={e=>setEd({...ed,description:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <button onClick={()=>setModal(false)} style={{flex:1,padding:'10px',borderRadius:'8px',background:'rgba(148,163,184,0.1)',border:'1px solid #2d3154',color:'#94a3b8',cursor:'pointer'}}>ยกเลิก</button>
          <button onClick={save} style={{flex:1,padding:'10px',borderRadius:'8px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',cursor:'pointer',fontWeight:'600'}}>{isEdit?'💾 บันทึก':'➕ เพิ่ม'}</button>
        </div>
      </div>
    </Modal>
  </AppShell>)
}
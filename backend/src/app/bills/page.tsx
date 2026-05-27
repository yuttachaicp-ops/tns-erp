'use client'
import{useEffect,useState,useCallback}from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
const CATS=['ค่าไฟ','ค่าน้ำ','ค่าอินเตอร์เน็ต','ค่าโทรศัพท์','ค่าเช่า','ประกัน','ผ่อนชำระ','อื่นๆ']
interface B{id:string;name:string;amount:number;dueDay:number;category:string;note?:string;isPaid:boolean}
const E0:Partial<B>={name:'',amount:0,dueDay:1,category:'อื่นๆ',note:''}
const fmt=(n:number)=>n.toLocaleString('th-TH',{minimumFractionDigits:2})
export default function Page(){
  const[items,setItems]=useState<B[]>([])
  const[month,setMonth]=useState(()=>new Date().toISOString().slice(0,7))
  const[tot,setTot]=useState(0),[paid,setPaid]=useState(0)
  const[modal,setModal]=useState(false),[ed,setEd]=useState<Partial<B>>(E0),[isEdit,setIsEdit]=useState(false)
  const fetch2=useCallback(async()=>{
    const tok=localStorage.getItem('tns-token')
    const r=await fetch(`/api/bills?month=${month}`,{headers:{Authorization:`Bearer ${tok}`}})
    const d=await r.json();if(d.success){setItems(d.data.items);setTot(d.data.totalAmount);setPaid(d.data.paidAmount)}
  },[month])
  useEffect(()=>{fetch2()},[fetch2])
  async function toggle(b:B){
    const tok=localStorage.getItem('tns-token')
    await fetch('/api/bill-payments',{method:b.isPaid?'DELETE':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({billId:b.id,month})})
    fetch2()
  }
  async function save(){
    const tok=localStorage.getItem('tns-token')
    const url=isEdit?`/api/bills/${ed.id}`:'/api/bills'
    await fetch(url,{method:isEdit?'PUT':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({...ed,amount:Number(ed.amount),dueDay:Number(ed.dueDay)})})
    setModal(false);setEd(E0);fetch2()
  }
  async function del(id:string){
    if(!confirm('ยืนยันการลบ?'))return
    await fetch(`/api/bills/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${localStorage.getItem('tns-token') as string}`}})
    fetch2()
  }
  return(<AppShell>
    <Header title="🧾 บิลรายเดือน" subtitle={`เดือน ${month}`}/>
    <div style={{padding:'24px',flex:1}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'24px'}}>
        {[{l:'บิลทั้งหมด',v:tot,c:'#94a3b8',i:'📋'},{l:'จ่ายแล้ว',v:paid,c:'#4ade80',i:'✅'},{l:'ค้างจ่าย',v:tot-paid,c:'#f87171',i:'⏳'}].map(x=>(
          <div key={x.l} style={{background:'#1a1d2e',borderRadius:'12px',padding:'16px',border:'1px solid #2d3154'}}>
            <div style={{fontSize:'12px',color:'#94a3b8',marginBottom:'4px'}}>{x.i} {x.l}</div>
            <div style={{fontSize:'20px',fontWeight:'700',color:x.c}}>฿{fmt(x.v)}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:'12px',marginBottom:'20px'}}>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}/>
        <button onClick={()=>{setEd(E0);setIsEdit(false);setModal(true)}} style={{marginLeft:'auto',padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',cursor:'pointer',fontWeight:'600'}}>+ เพิ่มบิล</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {items.length===0?<div style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>📭 ยังไม่มีบิล</div>
        :items.map(b=>(
          <div key={b.id} style={{background:'#1a1d2e',borderRadius:'12px',border:`1px solid ${b.isPaid?'rgba(34,197,94,0.3)':'#2d3154'}`,padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
            <button onClick={()=>toggle(b)} style={{width:'32px',height:'32px',borderRadius:'50%',border:`2px solid ${b.isPaid?'#4ade80':'#4a5568'}`,background:b.isPaid?'rgba(34,197,94,0.2)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>{b.isPaid?'✅':'○'}</button>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                <span style={{fontWeight:'600',color:b.isPaid?'#64748b':'white',textDecoration:b.isPaid?'line-through':'none'}}>{b.name}</span>
                <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'999px',background:'rgba(148,163,184,0.1)',color:'#94a3b8'}}>{b.category}</span>
                <span style={{fontSize:'11px',color:'#4a5568'}}>ครบวันที่ {b.dueDay}</span>
              </div>
              {b.note&&<div style={{fontSize:'12px',color:'#64748b',marginTop:'2px'}}>{b.note}</div>}
            </div>
            <div style={{fontSize:'16px',fontWeight:'700',color:b.isPaid?'#4ade80':'#f87171',minWidth:'90px',textAlign:'right'}}>฿{fmt(b.amount)}</div>
            <div style={{display:'flex',gap:'4px'}}>
              <button onClick={()=>{setEd({...b});setIsEdit(true);setModal(true)}} style={{padding:'6px 8px',borderRadius:'6px',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#818cf8',cursor:'pointer'}}>✏️</button>
              <button onClick={()=>del(b.id)} style={{padding:'6px 8px',borderRadius:'6px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',cursor:'pointer'}}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Modal open={modal} onClose={()=>setModal(false)} title={isEdit?'✏️ แก้ไขบิล':'➕ เพิ่มบิล'}>
      <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
        <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>ชื่อบิล *</label>
          <input type="text" value={ed.name||''} onChange={e=>setEd({...ed,name:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>จำนวนเงิน (บาท)</label>
            <input type="number" min="0" step="0.01" value={ed.amount||''} onChange={e=>setEd({...ed,amount:parseFloat(e.target.value)||0})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>ครบกำหนดวันที่</label>
            <input type="number" min="1" max="31" value={ed.dueDay||1} onChange={e=>setEd({...ed,dueDay:parseInt(e.target.value)||1})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
        </div>
        <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>หมวดหมู่</label>
          <select value={ed.category||'อื่นๆ'} onChange={e=>setEd({...ed,category:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
            {CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </select></div>
        <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>หมายเหตุ</label>
          <input type="text" value={ed.note||''} onChange={e=>setEd({...ed,note:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <button onClick={()=>setModal(false)} style={{flex:1,padding:'10px',borderRadius:'8px',background:'rgba(148,163,184,0.1)',border:'1px solid #2d3154',color:'#94a3b8',cursor:'pointer'}}>ยกเลิก</button>
          <button onClick={save} style={{flex:1,padding:'10px',borderRadius:'8px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',cursor:'pointer',fontWeight:'600'}}>{isEdit?'💾 บันทึก':'➕ เพิ่ม'}</button>
        </div>
      </div>
    </Modal>
  </AppShell>)
}
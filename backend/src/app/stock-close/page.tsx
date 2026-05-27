'use client'
import{useEffect,useState,useCallback}from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
const REASONS=['หมดสต็อก','ยกเลิกสินค้า','รอสต็อกใหม่','ปิดชั่วคราว','สินค้าชำรุด','อื่นๆ']
const PLATFORMS=['ALL','SHOPEE','LAZADA','TIKTOK_SHOP','WEBSITE']
const PLATFORM_LABEL:Record<string,string>={ALL:'ทุกแพลตฟอร์ม',SHOPEE:'Shopee',LAZADA:'Lazada',TIKTOK_SHOP:'TikTok Shop',WEBSITE:'Website'}
const STATUS_MAP:Record<string,{label:string;color:string;bg:string}>={
  PENDING:{label:'รอดำเนินการ',color:'#f59e0b',bg:'rgba(245,158,11,0.15)'},
  PROCESSING:{label:'กำลังดำเนินการ',color:'#60a5fa',bg:'rgba(96,165,250,0.15)'},
  DONE:{label:'ดำเนินการแล้ว',color:'#4ade80',bg:'rgba(34,197,94,0.15)'},
}
interface Item{id:string;productName:string;sku?:string;category?:string;platform:string;quantity:number;reason:string;status:string;notifiedDate:string;note?:string}
const E0:Partial<Item>={productName:'',sku:'',category:'',platform:'ALL',quantity:0,reason:'หมดสต็อก',status:'PENDING',note:''}
export default function Page(){
  const[items,setItems]=useState<Item[]>([])
  const[total,setTotal]=useState(0)
  const[sf,setSf]=useState(''),[sp,setSp]=useState(''),[sr,setSr]=useState('')
  const[modal,setModal]=useState(false),[ed,setEd]=useState<Partial<Item>>(E0),[isEdit,setIsEdit]=useState(false)
  const fetch2=useCallback(async()=>{
    const tok=localStorage.getItem('tns-token')
    const q=new URLSearchParams();if(sf)q.set('status',sf);if(sp)q.set('platform',sp);if(sr)q.set('reason',sr)
    const r=await fetch(`/api/stock-close?${q}`,{headers:{Authorization:`Bearer ${tok}`}})
    const d=await r.json();if(d.success){setItems(d.data.items);setTotal(d.data.total)}
  },[sf,sp,sr])
  useEffect(()=>{fetch2()},[fetch2])
  async function save(){
    const tok=localStorage.getItem('tns-token')
    const url=isEdit?`/api/stock-close/${ed.id}`:'/api/stock-close'
    await fetch(url,{method:isEdit?'PUT':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({...ed,quantity:Number(ed.quantity)})})
    setModal(false);setEd(E0);fetch2()
  }
  async function del(id:string){
    if(!confirm('ยืนยันการลบ?'))return
    await fetch(`/api/stock-close/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${localStorage.getItem('tns-token') as string}`}})
    fetch2()
  }
  async function updateStatus(id:string,status:string){
    const tok=localStorage.getItem('tns-token')
    await fetch(`/api/stock-close/${id}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({status})})
    fetch2()
  }
  return(<AppShell>
    <Header title="🚫 แจ้งปิดสต็อก" subtitle={`ทั้งหมด ${total} รายการ`}/>
    <div style={{padding:'24px',flex:1}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
        <select value={sf} onChange={e=>setSf(e.target.value)} style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}>
          <option value="">ทุกสถานะ</option>
          <option value="PENDING">รอดำเนินการ</option>
          <option value="PROCESSING">กำลังดำเนินการ</option>
          <option value="DONE">ดำเนินการแล้ว</option>
        </select>
        <select value={sr} onChange={e=>setSr(e.target.value)} style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}>
          <option value="">เหตุผลทั้งหมด</option>
          {REASONS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select value={sp} onChange={e=>setSp(e.target.value)} style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}>
          <option value="">ทุกแพลตฟอร์ม</option>
          {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
        </select>
        <button onClick={()=>{setEd({...E0,notifiedDate:new Date().toISOString().split('T')[0]});setIsEdit(false);setModal(true)}} style={{marginLeft:'auto',padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',cursor:'pointer',fontWeight:'600'}}>+ เพิ่มรายการ</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {items.length===0?<div style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>📭 ไม่มีรายการ</div>
        :items.map(item=>{
          const st=STATUS_MAP[item.status]||STATUS_MAP.PENDING
          return(
            <div key={item.id} style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:'12px'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBottom:'6px'}}>
                  <span style={{fontWeight:'700',color:'white',fontSize:'14px'}}>{item.productName}</span>
                  {item.sku&&<span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'999px',background:'rgba(148,163,184,0.1)',color:'#94a3b8'}}>{item.sku}</span>}
                  <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'999px',background:st.bg,color:st.color}}>{st.label}</span>
                  <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'999px',background:'rgba(99,102,241,0.1)',color:'#818cf8'}}>{PLATFORM_LABEL[item.platform]||item.platform}</span>
                </div>
                <div style={{display:'flex',gap:'16px',fontSize:'12px',color:'#64748b',flexWrap:'wrap'}}>
                  {item.category&&<span>📦 {item.category}</span>}
                  <span>🔢 จำนวน {item.quantity}</span>
                  <span>⚠️ {item.reason}</span>
                  <span>📅 {new Date(item.notifiedDate).toLocaleDateString('th-TH')}</span>
                </div>
                {item.note&&<div style={{fontSize:'12px',color:'#4a5568',marginTop:'4px'}}>💬 {item.note}</div>}
              </div>
              <div style={{display:'flex',gap:'4px',flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end'}}>
                {item.status==='PENDING'&&<button onClick={()=>updateStatus(item.id,'PROCESSING')} title="เริ่มดำเนินการ" style={{padding:'6px 8px',borderRadius:'6px',background:'rgba(96,165,250,0.1)',border:'1px solid rgba(96,165,250,0.2)',color:'#60a5fa',cursor:'pointer',fontSize:'12px'}}>🔄</button>}
                {item.status==='PROCESSING'&&<button onClick={()=>updateStatus(item.id,'DONE')} title="เสร็จแล้ว" style={{padding:'6px 8px',borderRadius:'6px',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',color:'#4ade80',cursor:'pointer',fontSize:'12px'}}>✅</button>}
                <button onClick={()=>{setEd(item);setIsEdit(true);setModal(true)}} style={{padding:'6px 8px',borderRadius:'6px',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#818cf8',cursor:'pointer'}}>✏️</button>
                <button onClick={()=>del(item.id)} style={{padding:'6px 8px',borderRadius:'6px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',cursor:'pointer'}}>🗑️</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
    <Modal open={modal} onClose={()=>setModal(false)} title={isEdit?'✏️ แก้ไขรายการ':'➕ เพิ่มรายการปิดสต็อก'}>
      <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
        <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>ชื่อสินค้า *</label>
          <input type="text" value={ed.productName||''} onChange={e=>setEd({...ed,productName:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>SKU / รหัสสินค้า</label>
            <input type="text" value={ed.sku||''} onChange={e=>setEd({...ed,sku:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>หมวดหมู่</label>
            <input type="text" value={ed.category||''} onChange={e=>setEd({...ed,category:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>แพลตฟอร์ม</label>
            <select value={ed.platform||'ALL'} onChange={e=>setEd({...ed,platform:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
              {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
            </select></div>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>จำนวน</label>
            <input type="number" min="0" value={ed.quantity||0} onChange={e=>setEd({...ed,quantity:parseInt(e.target.value)||0})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>เหตุผล</label>
            <select value={ed.reason||'หมดสต็อก'} onChange={e=>setEd({...ed,reason:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
              {REASONS.map(r=><option key={r} value={r}>{r}</option>)}
            </select></div>
          <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>สถานะ</label>
            <select value={ed.status||'PENDING'} onChange={e=>setEd({...ed,status:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="PROCESSING">กำลังดำเนินการ</option>
              <option value="DONE">ดำเนินการแล้ว</option>
            </select></div>
        </div>
        <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>วันที่แจ้ง</label>
          <input type="date" value={(ed.notifiedDate||'').split('T')[0]} onChange={e=>setEd({...ed,notifiedDate:e.target.value})} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}}/></div>
        <div><label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>หมายเหตุ</label>
          <textarea value={ed.note||''} onChange={e=>setEd({...ed,note:e.target.value})} rows={2} style={{width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none',resize:'vertical'}}/></div>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <button onClick={()=>setModal(false)} style={{flex:1,padding:'10px',borderRadius:'8px',background:'rgba(148,163,184,0.1)',border:'1px solid #2d3154',color:'#94a3b8',cursor:'pointer'}}>ยกเลิก</button>
          <button onClick={save} style={{flex:1,padding:'10px',borderRadius:'8px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',cursor:'pointer',fontWeight:'600'}}>{isEdit?'💾 บันทึก':'➕ เพิ่ม'}</button>
        </div>
      </div>
    </Modal>
  </AppShell>)
}
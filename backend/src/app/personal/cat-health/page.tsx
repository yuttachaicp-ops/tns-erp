'use client'
import{useEffect,useState,useCallback,CSSProperties}from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'

const FOOD=['กินเอง','ป้อน','ไม่กิน']
const WATER=['ดื่มมาก','ดื่มน้อย','ไม่ดื่ม']
const BEHAV=['ปกติ','ซึม','เล่น','ร้องมาก','ซ่อนตัว','ก้าวร้าว']
const TABS=[{id:'profile',label:'🐱 ข้อมูลแมว'},{id:'daily',label:'📋 บันทึกรายวัน'},{id:'vet',label:'🏥 บันทึกพบหมอ'}]

interface Prof{name:string;age:string;gender:string;breed:string;weight:string;diagnosis:string;clinic:string;doctor:string}
interface DLog{id:string;logDate:string;medicine:string;foodIntake:string;waterIntake:string;excretion:string;behavior:string;temperature:string;weight:string;symptoms:string;note:string}
interface VVis{id:string;visitDate:string;results:string;bloodValues:string;additionalDiag:string;medicationChange:string;cost:string;note:string}

const EP:Prof={name:'',age:'',gender:'',breed:'',weight:'',diagnosis:'',clinic:'',doctor:''}
const ED:Partial<DLog>={logDate:new Date().toISOString().split('T')[0],medicine:'',foodIntake:'กินเอง',waterIntake:'ดื่มน้อย',excretion:'',behavior:'ปกติ',temperature:'',weight:'',symptoms:'',note:''}
const EV:Partial<VVis>={visitDate:new Date().toISOString().split('T')[0],results:'',bloodValues:'',additionalDiag:'',medicationChange:'',cost:'',note:''}
const IS:CSSProperties={width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none'}
const TA:CSSProperties={width:'100%',padding:'10px 12px',borderRadius:'8px',background:'#0f1117',border:'1px solid #2d3154',color:'white',outline:'none',resize:'vertical'}

function tok(){return localStorage.getItem('tns-token')}
function fmt(n:number){return n.toLocaleString('th-TH',{minimumFractionDigits:2})}
function Lbl({t}:{t:string}){return<label style={{display:'block',fontSize:'13px',color:'#94a3b8',marginBottom:'6px'}}>{t}</label>}
function Inp({v,fn,ph,tp}:{v:string;fn:(x:string)=>void;ph?:string;tp?:string}){
  return<input type={tp||'text'} value={v} onChange={e=>fn(e.target.value)} placeholder={ph||''} style={IS}/>
}
function Sel({v,fn,opts}:{v:string;fn:(x:string)=>void;opts:string[]}){
  return<select value={v} onChange={e=>fn(e.target.value)} style={IS}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
}

export default function CatHealthPage(){
  const[tab,setTab]=useState('profile')
  const[prof,setProf]=useState<Prof>(EP)
  const[editP,setEditP]=useState(false)
  const[logs,setLogs]=useState<DLog[]>([])
  const[month,setMonth]=useState(()=>new Date().toISOString().slice(0,7))
  const[dMod,setDMod]=useState(false)
  const[dEd,setDEd]=useState<Partial<DLog>>(ED)
  const[dIsE,setDIsE]=useState(false)
  const[vets,setVets]=useState<VVis[]>([])
  const[vMod,setVMod]=useState(false)
  const[vEd,setVEd]=useState<Partial<VVis>>(EV)
  const[vIsE,setVIsE]=useState(false)

  useEffect(()=>{
    fetch('/api/cat-health/profile',{headers:{Authorization:`Bearer ${tok()}`}}).then(r=>r.json()).then(d=>{
      if(d.success&&d.data){const x=d.data;setProf({name:x.name||'',age:x.age||'',gender:x.gender||'',breed:x.breed||'',weight:x.weight?.toString()||'',diagnosis:x.diagnosis||'',clinic:x.clinic||'',doctor:x.doctor||''})}
    })
  },[])

  const fetchLogs=useCallback(async()=>{
    const r=await fetch(`/api/cat-health/daily-logs?month=${month}`,{headers:{Authorization:`Bearer ${tok()}`}})
    const d=await r.json();if(d.success)setLogs(d.data)
  },[month])

  const fetchVets=useCallback(async()=>{
    const r=await fetch('/api/cat-health/vet-visits',{headers:{Authorization:`Bearer ${tok()}`}})
    const d=await r.json();if(d.success)setVets(d.data)
  },[])

  useEffect(()=>{if(tab==='daily')fetchLogs()},[tab,fetchLogs])
  useEffect(()=>{if(tab==='vet')fetchVets()},[tab,fetchVets])

  async function saveProf(){
    await fetch('/api/cat-health/profile',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok()}`},body:JSON.stringify(prof)})
    setEditP(false)
  }
  async function saveLog(){
    const url=dIsE?`/api/cat-health/daily-logs/${dEd.id}`:'/api/cat-health/daily-logs'
    await fetch(url,{method:dIsE?'PUT':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok()}`},body:JSON.stringify(dEd)})
    setDMod(false);setDEd(ED);fetchLogs()
  }
  async function delLog(id:string){
    if(!confirm('ยืนยันการลบ?'))return
    await fetch(`/api/cat-health/daily-logs/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${tok()}`}});fetchLogs()
  }
  async function saveVet(){
    const url=vIsE?`/api/cat-health/vet-visits/${vEd.id}`:'/api/cat-health/vet-visits'
    await fetch(url,{method:vIsE?'PUT':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok()}`},body:JSON.stringify(vEd)})
    setVMod(false);setVEd(EV);fetchVets()
  }
  async function delVet(id:string){
    if(!confirm('ยืนยันการลบ?'))return
    await fetch(`/api/cat-health/vet-visits/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${tok()}`}});fetchVets()
  }

  const profFields:[string,string][]=[
    ['อายุ',prof.age],['น้ำหนัก',prof.weight?prof.weight+' kg':''],
    ['โรคที่วินิจฉัย',prof.diagnosis],['คลินิก',prof.clinic],['สัตวแพทย์',prof.doctor]
  ]

  function tabSt(id:string):CSSProperties{
    return{padding:'10px 20px',borderRadius:'8px 8px 0 0',border:'none',cursor:'pointer',fontWeight:600,fontSize:'14px',
      background:tab===id?'#1a1d2e':'transparent',color:tab===id?'#818cf8':'#64748b',
      borderBottom:tab===id?'2px solid #6366f1':'2px solid transparent'}
  }

  return(
    <AppShell>
      <Header title="สุขภาพแมวน้อย" subtitle={prof.name||'บันทึกการรักษา'}/>
      <div style={{padding:'24px',flex:1}}>
        <div style={{display:'flex',gap:'4px',marginBottom:'24px',borderBottom:'1px solid #2d3154'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={tabSt(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab==='profile'&&(
          <div style={{maxWidth:'600px'}}>
            <div style={{background:'#1a1d2e',borderRadius:'16px',border:'1px solid #2d3154',padding:'24px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px'}}>🐱</div>
                  <div>
                    <div style={{fontWeight:700,color:'white',fontSize:'18px'}}>{prof.name||'ยังไม่ได้ตั้งชื่อ'}</div>
                    <div style={{fontSize:'13px',color:'#64748b'}}>{prof.breed||'ไม่ระบุสายพันธุ์'} - {prof.gender||'ไม่ระบุเพศ'}</div>
                  </div>
                </div>
                <button onClick={()=>setEditP(true)} style={{padding:'8px 16px',borderRadius:'8px',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#818cf8',cursor:'pointer',fontWeight:600}}>แก้ไข</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {profFields.map(([l,v])=>(
                  <div key={l} style={{background:'#0f1117',borderRadius:'8px',padding:'12px'}}>
                    <div style={{fontSize:'11px',color:'#64748b',marginBottom:'4px'}}>{l}</div>
                    <div style={{fontSize:'14px',color:v?'white':'#4a5568'}}>{v||'ไม่ได้ระบุ'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='daily'&&(
          <div>
            <div style={{display:'flex',gap:'12px',marginBottom:'20px',alignItems:'center'}}>
              <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{padding:'10px 14px',borderRadius:'10px',background:'#1a1d2e',border:'1px solid #2d3154',color:'white',outline:'none'}}/>
              <button onClick={()=>{setDEd({...ED,logDate:new Date().toISOString().split('T')[0]});setDIsE(false);setDMod(true)}}
                style={{marginLeft:'auto',padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                + บันทึกวันนี้
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {logs.length===0?(
                <div style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>ยังไม่มีบันทึก</div>
              ):logs.map(log=>(
                <div key={log.id} style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',padding:'14px 16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                    <div style={{fontWeight:700,color:'white',fontSize:'14px'}}>
                      {new Date(log.logDate).toLocaleDateString('th-TH',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}
                    </div>
                    <div style={{display:'flex',gap:'4px'}}>
                      <button onClick={()=>{setDEd({...log});setDIsE(true);setDMod(true)}} style={{padding:'4px 8px',borderRadius:'6px',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#818cf8',cursor:'pointer'}}>แก้ไข</button>
                      <button onClick={()=>delLog(log.id)} style={{padding:'4px 8px',borderRadius:'6px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',cursor:'pointer'}}>ลบ</button>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'6px',fontSize:'12px'}}>
                    {log.medicine&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'5px 8px'}}><span style={{color:'#64748b'}}>ยา: </span>{log.medicine}</div>}
                    {log.foodIntake&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'5px 8px'}}><span style={{color:'#64748b'}}>กินข้าว: </span>{log.foodIntake}</div>}
                    {log.waterIntake&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'5px 8px'}}><span style={{color:'#64748b'}}>น้ำ: </span>{log.waterIntake}</div>}
                    {log.behavior&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'5px 8px'}}><span style={{color:'#64748b'}}>พฤติกรรม: </span>{log.behavior}</div>}
                    {log.excretion&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'5px 8px'}}><span style={{color:'#64748b'}}>ขับถ่าย: </span>{log.excretion}</div>}
                    {log.temperature&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'5px 8px'}}><span style={{color:'#64748b'}}>อุณหภูมิ: </span>{log.temperature}C</div>}
                    {log.weight&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'5px 8px'}}><span style={{color:'#64748b'}}>น้ำหนัก: </span>{log.weight} kg</div>}
                    {log.symptoms&&<div style={{background:'rgba(239,68,68,0.05)',borderRadius:'6px',padding:'5px 8px',border:'1px solid rgba(239,68,68,0.15)'}}><span style={{color:'#f87171'}}>อาการ: </span>{log.symptoms}</div>}
                  </div>
                  {log.note&&<div style={{marginTop:'6px',fontSize:'12px',color:'#64748b'}}>{log.note}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='vet'&&(
          <div>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'20px'}}>
              <button onClick={()=>{setVEd({...EV,visitDate:new Date().toISOString().split('T')[0]});setVIsE(false);setVMod(true)}}
                style={{padding:'10px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                + บันทึกพบหมอ
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {vets.length===0?(
                <div style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>ยังไม่มีบันทึก</div>
              ):vets.map(v=>(
                <div key={v.id} style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',padding:'16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div>
                      <div style={{fontWeight:700,color:'white',fontSize:'15px'}}>
                        {new Date(v.visitDate).toLocaleDateString('th-TH',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}
                      </div>
                      {v.cost&&<div style={{fontSize:'13px',color:'#f59e0b',marginTop:'2px'}}>ค่าใช้จ่าย: {fmt(parseFloat(v.cost))} บาท</div>}
                    </div>
                    <div style={{display:'flex',gap:'4px'}}>
                      <button onClick={()=>{setVEd({...v});setVIsE(true);setVMod(true)}} style={{padding:'4px 8px',borderRadius:'6px',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#818cf8',cursor:'pointer'}}>แก้ไข</button>
                      <button onClick={()=>delVet(v.id)} style={{padding:'4px 8px',borderRadius:'6px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',cursor:'pointer'}}>ลบ</button>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'5px',fontSize:'13px'}}>
                    {v.results&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'7px 10px'}}><span style={{color:'#64748b'}}>ผลตรวจ: </span>{v.results}</div>}
                    {v.bloodValues&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'7px 10px'}}><span style={{color:'#64748b'}}>ค่าเลือด: </span>{v.bloodValues}</div>}
                    {v.additionalDiag&&<div style={{background:'#0f1117',borderRadius:'6px',padding:'7px 10px'}}><span style={{color:'#64748b'}}>วินิจฉัย: </span>{v.additionalDiag}</div>}
                    {v.medicationChange&&<div style={{background:'rgba(99,102,241,0.05)',borderRadius:'6px',padding:'7px 10px',border:'1px solid rgba(99,102,241,0.1)'}}><span style={{color:'#818cf8'}}>ยา/แผนรักษา: </span>{v.medicationChange}</div>}
                  </div>
                  {v.note&&<div style={{marginTop:'8px',fontSize:'12px',color:'#64748b'}}>{v.note}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={editP} onClose={()=>setEditP(false)} title="แก้ไขข้อมูลแมว">
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div><Lbl t="ชื่อแมว"/><Inp v={prof.name} fn={x=>setProf({...prof,name:x})} ph="ชื่อน้อง"/></div>
            <div><Lbl t="อายุ"/><Inp v={prof.age} fn={x=>setProf({...prof,age:x})} ph="เช่น 2 ปี 3 เดือน"/></div>
            <div><Lbl t="เพศ"/><Sel v={prof.gender} fn={x=>setProf({...prof,gender:x})} opts={['','ผู้','เมีย']}/></div>
            <div><Lbl t="สายพันธุ์"/><Inp v={prof.breed} fn={x=>setProf({...prof,breed:x})} ph="เช่น Scottish Fold"/></div>
            <div><Lbl t="น้ำหนัก (kg)"/><Inp v={prof.weight} fn={x=>setProf({...prof,weight:x})} ph="3.5" tp="number"/></div>
            <div><Lbl t="โรคที่วินิจฉัย"/><Inp v={prof.diagnosis} fn={x=>setProf({...prof,diagnosis:x})} ph="เช่น FIP, CKD"/></div>
            <div><Lbl t="ชื่อคลินิก"/><Inp v={prof.clinic} fn={x=>setProf({...prof,clinic:x})} ph="ชื่อคลินิก"/></div>
            <div><Lbl t="ชื่อสัตวแพทย์"/><Inp v={prof.doctor} fn={x=>setProf({...prof,doctor:x})} ph="ชื่อหมอ"/></div>
          </div>
          <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
            <button onClick={()=>setEditP(false)} style={{flex:1,padding:'10px',borderRadius:'8px',background:'rgba(148,163,184,0.1)',border:'1px solid #2d3154',color:'#94a3b8',cursor:'pointer'}}>ยกเลิก</button>
            <button onClick={saveProf} style={{flex:1,padding:'10px',borderRadius:'8px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',cursor:'pointer',fontWeight:600}}>บันทึก</button>
          </div>
        </div>
      </Modal>

      <Modal open={dMod} onClose={()=>setDMod(false)} title={dIsE?'แก้ไขบันทึกรายวัน':'บันทึกประจำวัน'}>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div><Lbl t="วันที่"/><Inp v={dEd.logDate||''} fn={x=>setDEd({...dEd,logDate:x})} tp="date"/></div>
          <div><Lbl t="ยาที่ให้ (ชื่อ/ขนาด/เวลา)"/><Inp v={dEd.medicine||''} fn={x=>setDEd({...dEd,medicine:x})} ph="เช่น Prednisolone 5mg เช้า-เย็น"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
            <div><Lbl t="กินข้าว"/><Sel v={dEd.foodIntake||'กินเอง'} fn={x=>setDEd({...dEd,foodIntake:x})} opts={FOOD}/></div>
            <div><Lbl t="ดื่มน้ำ"/><Sel v={dEd.waterIntake||'ดื่มน้อย'} fn={x=>setDEd({...dEd,waterIntake:x})} opts={WATER}/></div>
            <div><Lbl t="พฤติกรรม"/><Sel v={dEd.behavior||'ปกติ'} fn={x=>setDEd({...dEd,behavior:x})} opts={BEHAV}/></div>
          </div>
          <div><Lbl t="การขับถ่าย"/><Inp v={dEd.excretion||''} fn={x=>setDEd({...dEd,excretion:x})} ph="เช่น ปัสสาวะสีเหลือง อุจจาระปกติ"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            <div><Lbl t="อุณหภูมิ (C)"/><Inp v={dEd.temperature||''} fn={x=>setDEd({...dEd,temperature:x})} ph="38.5" tp="number"/></div>
            <div><Lbl t="น้ำหนัก (kg)"/><Inp v={dEd.weight||''} fn={x=>setDEd({...dEd,weight:x})} ph="3.5" tp="number"/></div>
          </div>
          <div><Lbl t="อาการผิดปกติ"/><Inp v={dEd.symptoms||''} fn={x=>setDEd({...dEd,symptoms:x})} ph="เช่น อาเจียน ไม่กระตือรือร้น"/></div>
          <div><Lbl t="หมายเหตุ"/><Inp v={dEd.note||''} fn={x=>setDEd({...dEd,note:x})} ph="บันทึกเพิ่มเติม"/></div>
          <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
            <button onClick={()=>setDMod(false)} style={{flex:1,padding:'10px',borderRadius:'8px',background:'rgba(148,163,184,0.1)',border:'1px solid #2d3154',color:'#94a3b8',cursor:'pointer'}}>ยกเลิก</button>
            <button onClick={saveLog} style={{flex:1,padding:'10px',borderRadius:'8px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',cursor:'pointer',fontWeight:600}}>{dIsE?'บันทึก':'เพิ่ม'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={vMod} onClose={()=>setVMod(false)} title={vIsE?'แก้ไขบันทึกพบหมอ':'บันทึกพบหมอ'}>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div><Lbl t="วันที่พบหมอ"/><Inp v={vEd.visitDate||''} fn={x=>setVEd({...vEd,visitDate:x})} tp="date"/></div>
          <div><Lbl t="ผลตรวจ"/><textarea value={vEd.results||''} onChange={e=>setVEd({...vEd,results:e.target.value})} rows={2} placeholder="ผลการตรวจร่างกาย" style={TA}/></div>
          <div><Lbl t="ค่าเลือด"/><Inp v={vEd.bloodValues||''} fn={x=>setVEd({...vEd,bloodValues:x})} ph="เช่น BUN 30, Creatinine 2.1"/></div>
          <div><Lbl t="การวินิจฉัยเพิ่มเติม"/><Inp v={vEd.additionalDiag||''} fn={x=>setVEd({...vEd,additionalDiag:x})} ph=""/></div>
          <div><Lbl t="ยา/แผนการรักษาที่เปลี่ยน"/><textarea value={vEd.medicationChange||''} onChange={e=>setVEd({...vEd,medicationChange:e.target.value})} rows={2} placeholder="รายการยา/วิธีรักษา" style={TA}/></div>
          <div><Lbl t="ค่าใช้จ่าย (บาท)"/><Inp v={vEd.cost||''} fn={x=>setVEd({...vEd,cost:x})} ph="0" tp="number"/></div>
          <div><Lbl t="หมายเหตุ"/><Inp v={vEd.note||''} fn={x=>setVEd({...vEd,note:x})} ph="บันทึกเพิ่มเติม"/></div>
          <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
            <button onClick={()=>setVMod(false)} style={{flex:1,padding:'10px',borderRadius:'8px',background:'rgba(148,163,184,0.1)',border:'1px solid #2d3154',color:'#94a3b8',cursor:'pointer'}}>ยกเลิก</button>
            <button onClick={saveVet} style={{flex:1,padding:'10px',borderRadius:'8px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',cursor:'pointer',fontWeight:600}}>{vIsE?'บันทึก':'เพิ่ม'}</button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
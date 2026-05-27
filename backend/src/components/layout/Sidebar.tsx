'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
const WORK_MENU = [
  { href:'/dashboard', icon:'📊', label:'Dashboard' },
  { href:'/photo-queue', icon:'📷', label:'สินค้าถ่ายรูป' },
  { href:'/listing-queue', icon:'🛒', label:'สินค้ายังไม่ได้ลงขาย' },
  { href:'/daily-logs', icon:'📝', label:'บันทึกงานประจำวัน' },
  { href:'/stock-close', icon:'🚫', label:'แจ้งปิดสต็อก' },

]
const SETTING_MENU = [
  { href:'/users', icon:'👥', label:'ผู้ใช้งาน' },
  { href:'/activity-logs', icon:'📋', label:'Activity Logs' },
]
const PERSONAL_MENU = [
  { href:'/personal', icon:'🏠', label:'Dashboard' },
  { href:'/income-expense', icon:'💰', label:'รายรับ-รายจ่าย' },
  { href:'/personal/cat-health',icon:'🐾',label:'สุขภาพแมวน้อย'},{href:'/bills', icon:'🧾', label:'บิลรายเดือน' },
]
function MenuLink({ href, icon, label, active, onClick }: { href:string; icon:string; label:string; active:boolean; onClick?:()=>void }) {
  return (
    <Link href={href} onClick={onClick} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',marginBottom:'2px',background:active?'rgba(99,102,241,0.2)':'transparent',color:active?'#818cf8':'#94a3b8',textDecoration:'none',fontSize:'14px',fontWeight:active?'600':'400',borderLeft:active?'2px solid #6366f1':'2px solid transparent'}}>
      <span style={{fontSize:'15px'}}>{icon}</span><span>{label}</span>
    </Link>
  )
}
function Section({ title, icon, items, pathname, onLinkClick, defaultOpen=true }: { title:string; icon:string; items:typeof WORK_MENU; pathname:string; onLinkClick?:()=>void; defaultOpen?:boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{marginBottom:'4px'}}>
      <button onClick={()=>setOpen(!open)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:'8px',background:'transparent',border:'none',color:'#64748b',fontSize:'12px',fontWeight:'700',cursor:'pointer',letterSpacing:'0.05em',textTransform:'uppercase'}}>
        <span style={{display:'flex',alignItems:'center',gap:'6px'}}>{icon} {title}</span>
        <span style={{transition:'transform 0.2s',transform:open?'rotate(180deg)':'rotate(0deg)',fontSize:'10px'}}>▼</span>
      </button>
      {open && (
        <div style={{paddingLeft:'4px'}}>
          {items.map(item=>(
            <MenuLink key={item.href} {...item} active={pathname.startsWith(item.href)} onClick={onLinkClick} />
          ))}
        </div>
      )}
    </div>
  )
}
export default function Sidebar({ user, open, isMobile, onClose }: { user:{ name:string; role:string; email:string }; open:boolean; isMobile:boolean; onClose:()=>void }) {
  const pathname = usePathname()
  const router = useRouter()
  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' })
    localStorage.removeItem('tns-token'); localStorage.removeItem('tns-user')
    router.push('/login')
  }
  return (
    <aside style={{width:'240px',height:'100vh',background:'#1a1d2e',borderRight:'1px solid #2d3154',display:'flex',flexDirection:'column',position:'fixed',left:0,top:0,zIndex:isMobile?200:100,transform:isMobile&&!open?'translateX(-100%)':'translateX(0)',transition:'transform 0.25s ease',overflowY:'auto'}}>
      <div style={{padding:'20px 16px',borderBottom:'1px solid #2d3154',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'white',fontSize:'16px'}}>T</div>
          <div>
            <div style={{fontWeight:'700',color:'white',fontSize:'15px'}}>TNS ERP</div>
            <div style={{fontSize:'11px',color:'#6366f1'}}>Daily Operations</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'#94a3b8',fontSize:'20px',cursor:'pointer',padding:'4px'}}>✕</button>
        )}
      </div>
      <nav style={{padding:'8px',flex:1,overflowY:'auto'}}>
        <Section title="สำหรับงาน" icon="💼" items={WORK_MENU} pathname={pathname} onLinkClick={isMobile?onClose:undefined} />
        <div style={{height:'1px',background:'#2d3154',margin:'8px 4px'}} />
        <Section title="ส่วนตัว" icon="👤" items={PERSONAL_MENU} pathname={pathname} onLinkClick={isMobile?onClose:undefined} />
        <div style={{height:'1px',background:'#2d3154',margin:'8px 4px'}} />
        <Section title="ตั้งค่า" icon="⚙️" items={SETTING_MENU} pathname={pathname} onLinkClick={isMobile?onClose:undefined} defaultOpen={false} />
      </nav>
      <div style={{padding:'12px 16px',borderTop:'1px solid #2d3154'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'13px',fontWeight:'600'}}>{user.name.charAt(0).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'13px',fontWeight:'600',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
            <div style={{fontSize:'11px',color:user.role==='ADMIN'?'#f59e0b':'#6366f1'}}>{user.role==='ADMIN'?'👑 Admin':'👤 Staff'}</div>
          </div>
        </div>
        <button onClick={logout} style={{width:'100%',padding:'8px',borderRadius:'8px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',fontSize:'13px',cursor:'pointer'}}>🚪 ออกจากระบบ</button>
      </div>
    </aside>
  )
}
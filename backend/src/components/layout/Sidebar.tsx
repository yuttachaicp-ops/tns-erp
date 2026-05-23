'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const MENU = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/photo-queue', icon: '📷', label: 'สินค้ารอถ่ายรูป' },
  { href: '/listing-queue', icon: '🛒', label: 'สินค้ายังไม่ได้ลงขาย' },
  { href: '/daily-logs', icon: '📝', label: 'บันทึกงานประจำวัน' },
  { href: '/users', icon: '👥', label: 'ผู้ใช้งาน' },
  { href: '/activity-logs', icon: '📋', label: 'Activity Logs' },
]

export default function Sidebar({ user }: { user: { name: string; role: string; email: string } }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('tns-token')
    localStorage.removeItem('tns-user')
    router.push('/login')
  }

  return (
    <aside style={{width:'240px',minHeight:'100vh',background:'#1a1d2e',borderRight:'1px solid #2d3154',display:'flex',flexDirection:'column',position:'fixed',left:0,top:0,zIndex:100}}>
      {/* Logo */}
      <div style={{padding:'20px 16px',borderBottom:'1px solid #2d3154'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',color:'white',fontSize:'16px'}}>T</div>
          <div>
            <div style={{fontWeight:'700',color:'white',fontSize:'15px'}}>TNS ERP</div>
            <div style={{fontSize:'11px',color:'#6366f1'}}>Daily Operations</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{padding:'8px',flex:1}}>
        {MENU.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              style={{
                display:'flex', alignItems:'center', gap:'10px',
                padding:'10px 12px', borderRadius:'10px', marginBottom:'2px',
                background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: active ? '#818cf8' : '#94a3b8',
                textDecoration:'none', fontSize:'14px', fontWeight: active ? '600' : '400',
                transition:'all 0.15s', borderLeft: active ? '2px solid #6366f1' : '2px solid transparent',
              }}>
              <span style={{fontSize:'16px'}}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div style={{padding:'12px 16px',borderTop:'1px solid #2d3154'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'13px',fontWeight:'600'}}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'13px',fontWeight:'600',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
            <div style={{fontSize:'11px',color:user.role==='ADMIN'?'#f59e0b':'#6366f1'}}>{user.role === 'ADMIN' ? '👑 Admin' : '👤 Staff'}</div>
          </div>
        </div>
        <button onClick={logout}
          style={{width:'100%',padding:'8px',borderRadius:'8px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',fontSize:'13px',cursor:'pointer',transition:'all 0.15s'}}>
          🚪 ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}

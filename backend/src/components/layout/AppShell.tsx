'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import { AppShellContext } from '@/lib/appshell-context'
interface User { name: string; role: string; email: string }
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('tns-user')
    const token = localStorage.getItem('tns-token')
    if (!stored || !token) { router.push('/login'); return }
    setUser(JSON.parse(stored)); setLoading(false)
  }, [pathname, router])
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  useEffect(() => { setSidebarOpen(false) }, [pathname])
  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f1117'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'48px',height:'48px',borderRadius:'12px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:'24px',fontWeight:'bold',color:'white'}}>T</div>
        <p style={{color:'#6366f1',fontSize:'14px'}}>กำลังโหลด TNS ERP...</p>
      </div>
    </div>
  )
  if (!user) return null
  return (
    <AppShellContext.Provider value={{ isMobile, onMenuToggle: () => setSidebarOpen(v => !v) }}>
      <div style={{display:'flex',minHeight:'100vh',background:'#0f1117'}}>
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:150}} />
        )}
        <Sidebar user={user} open={!isMobile || sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />
        <main style={{marginLeft:isMobile?0:'240px',flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
          {children}
        </main>
      </div>
    </AppShellContext.Provider>
  )
}

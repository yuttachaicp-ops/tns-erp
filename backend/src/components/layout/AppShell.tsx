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
  const [bootStep, setBootStep] = useState(0)

  const bootLines = [
    'INITIALIZING TNS ERP v2.0...',
    'LOADING AGENT MODULES...',
    'CONNECTING TO DATABASE...',
    'ALL SYSTEMS OPERATIONAL',
  ]

  useEffect(() => {
    const stored = localStorage.getItem('tns-user')
    const token = localStorage.getItem('tns-token')
    if (!stored || !token) { router.push('/login'); return }
    let step = 0
    const t = setInterval(() => {
      step++
      setBootStep(step)
      if (step >= bootLines.length) { clearInterval(t); setUser(JSON.parse(stored)); setLoading(false) }
    }, 300)
    return () => clearInterval(t)
  }, [pathname, router])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060d0b', fontFamily: '"Share Tech Mono", monospace' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, width: '90%' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#00f5d4', letterSpacing: '0.2em', textShadow: '0 0 20px rgba(0,245,212,0.8)', marginBottom: 4 }}>TNS ERP</div>
          <div style={{ fontSize: '11px', color: '#3a6a55', letterSpacing: '0.3em' }}>COMMAND CENTER v2.0</div>
        </div>
        {/* Boot lines */}
        <div style={{ background: '#0a1612', border: '1px solid #0d4a35', padding: '20px', textAlign: 'left', marginBottom: 20, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -1, left: 12, background: '#060d0b', padding: '0 6px', fontSize: '10px', color: '#0d4a35', letterSpacing: '0.2em' }}>BOOT LOG</div>
          {bootLines.slice(0, bootStep + 1).map((line, i) => (
            <div key={i} style={{ fontSize: '12px', color: i < bootStep ? '#3a6a55' : '#00f5d4', marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: i < bootStep ? '#00ff88' : '#ffd60a' }}>{i < bootStep ? '[OK]' : '[..]'}</span>
              {line}
              {i === bootStep && <span style={{ animation: 'blink 0.8s step-end infinite' }}>_</span>}
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: '#0a1612', border: '1px solid #0d4a35', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#00f5d4,#00ff88)', width: `${Math.min(100, (bootStep / bootLines.length) * 100)}%`, transition: 'width 0.3s', boxShadow: '0 0 8px rgba(0,245,212,0.8)' }} />
        </div>
      </div>
    </div>
  )

  if (!user) return null

  return (
    <AppShellContext.Provider value={{ isMobile, onMenuToggle: () => setSidebarOpen(v => !v) }}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#060d0b' }}>
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 150 }} />
        )}
        <Sidebar user={user} open={!isMobile || sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />
        <main style={{ marginLeft: isMobile ? 0 : '240px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </AppShellContext.Provider>
  )
}

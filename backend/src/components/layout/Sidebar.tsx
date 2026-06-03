'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const WORK_MENU = [
  { href: '/dashboard', icon: '📊', label: 'DASHBOARD' },
  { href: '/photo-queue', icon: '📷', label: 'PHOTO QUEUE' },
  { href: '/listing-queue', icon: '🛒', label: 'LISTING QUEUE' },
  { href: '/daily-logs', icon: '📝', label: 'DAILY LOGS' },
  { href: '/stock-close', icon: '🚫', label: 'STOCK CLOSE' },
]
const PERSONAL_MENU = [
  { href: '/personal', icon: '🏠', label: 'OVERVIEW' },
  { href: '/income-expense', icon: '💰', label: 'INCOME/EXPENSE' },
  { href: '/personal/mortgage', icon: '🏡', label: 'MORTGAGE' },
  { href: '/personal/car-loans', icon: '🚗', label: 'CAR LOANS' },
  { href: '/personal/savings-goals', icon: '🎯', label: 'SAVINGS GOALS' },
  { href: '/personal/cat-health', icon: '🐾', label: 'CAT HEALTH' },
  { href: '/bills', icon: '🧾', label: 'BILLS' },
]
const SETTING_MENU = [
  { href: '/users', icon: '👥', label: 'USERS' },
  { href: '/activity-logs', icon: '📋', label: 'ACTIVITY LOGS' },
]

function MenuLink({ href, icon, label, active, onClick }: { href: string; icon: string; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px',
      marginBottom: '1px', textDecoration: 'none',
      background: active ? 'rgba(0,245,212,0.1)' : 'transparent',
      color: active ? '#00f5d4' : '#3a6a55',
      borderLeft: active ? '2px solid #00f5d4' : '2px solid transparent',
      fontSize: '11px', fontFamily: '"Share Tech Mono", monospace',
      letterSpacing: '0.05em', transition: 'all 0.15s',
      textShadow: active ? '0 0 8px rgba(0,245,212,0.5)' : 'none',
    }}>
      <span style={{ fontSize: '13px', flexShrink: 0 }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, background: '#00f5d4', boxShadow: '0 0 4px #00f5d4', flexShrink: 0 }} />}
    </Link>
  )
}

function Section({ title, code, items, pathname, onLinkClick, defaultOpen = true }: { title: string; code: string; items: typeof WORK_MENU; pathname: string; onLinkClick?: () => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: '8px' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', background: 'transparent', border: 'none',
        color: '#1a5a40', fontSize: '9px', fontWeight: '700', cursor: 'pointer',
        letterSpacing: '0.2em', fontFamily: '"Share Tech Mono", monospace', textTransform: 'uppercase',
      }}>
        <span>[ {code} ] {title}</span>
        <span style={{ color: open ? '#00f5d4' : '#1a5a40', fontSize: '10px' }}>{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div style={{ borderLeft: '1px solid #0d2a1e', marginLeft: '10px', paddingLeft: '4px' }}>
          {items.map(item => (
            <MenuLink key={item.href} {...item} active={pathname === item.href || (item.href !== '/personal' && pathname.startsWith(item.href))} onClick={onLinkClick} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ user, open, isMobile, onClose }: { user: { name: string; role: string; email: string }; open: boolean; isMobile: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('tns-token'); localStorage.removeItem('tns-user')
    router.push('/login')
  }

  return (
    <aside style={{
      width: '240px', height: '100vh',
      background: '#080f0c',
      borderRight: '1px solid #0d4a35',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, zIndex: isMobile ? 200 : 100,
      transform: isMobile && !open ? 'translateX(-100%)' : 'translateX(0)',
      transition: 'transform 0.2s ease',
      overflowY: 'auto',
      boxShadow: '1px 0 0 rgba(0,245,212,0.05)',
    }}>

      {/* Header */}
      <div style={{ padding: '16px 12px', borderBottom: '1px solid #0d4a35', position: 'relative' }}>
        {/* Corner decorations */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 6, height: 6, borderTop: '1px solid #00f5d4', borderLeft: '1px solid #00f5d4' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: 6, borderTop: '1px solid #00f5d4', borderRight: '1px solid #00f5d4' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: '"Share Tech Mono", monospace', fontWeight: '700', color: '#00f5d4', fontSize: '16px', letterSpacing: '0.2em', textShadow: '0 0 12px rgba(0,245,212,0.7)' }}>TNS ERP</div>
            <div style={{ fontSize: '9px', color: '#1a5a40', letterSpacing: '0.3em', fontFamily: '"Share Tech Mono", monospace' }}>COMMAND CENTER v2.0</div>
          </div>
          {isMobile && (
            <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #0d4a35', color: '#00f5d4', fontSize: '14px', cursor: 'pointer', padding: '2px 6px' }}>✕</button>
          )}
        </div>

        {/* Status bar */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: '#060d0b', border: '1px solid #0d4a35', padding: '5px 8px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88', animation: 'status-blink 2s infinite' }} />
          <span style={{ fontSize: '9px', color: '#00ff88', fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.15em' }}>ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Agent Info */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #0d2a1e' }}>
        <div style={{ fontSize: '9px', color: '#1a5a40', fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.2em', marginBottom: 6 }}>[ AGENT STATUS ]</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#060d0b', border: '1px solid #0d4a35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#c8f0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Share Tech Mono", monospace' }}>{user.name}</div>
            <div style={{ fontSize: '9px', color: user.role === 'ADMIN' ? '#ffd60a' : '#3a6a55', letterSpacing: '0.1em', fontFamily: '"Share Tech Mono", monospace' }}>
              {user.role === 'ADMIN' ? '◆ ADMIN' : '◇ STAFF'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px 4px', flex: 1, overflowY: 'auto' }}>
        <Section title="OPERATIONS" code="01" items={WORK_MENU} pathname={pathname} onLinkClick={isMobile ? onClose : undefined} />
        <div style={{ height: '1px', background: '#0d2a1e', margin: '6px 8px' }} />
        <Section title="PERSONAL" code="02" items={PERSONAL_MENU} pathname={pathname} onLinkClick={isMobile ? onClose : undefined} />
        <div style={{ height: '1px', background: '#0d2a1e', margin: '6px 8px' }} />
        <Section title="SYSTEM" code="03" items={SETTING_MENU} pathname={pathname} onLinkClick={isMobile ? onClose : undefined} defaultOpen={false} />
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #0d4a35' }}>
        <button onClick={logout} style={{
          width: '100%', padding: '8px', background: 'transparent',
          border: '1px solid #1a3a2a', color: '#3a6a55',
          cursor: 'pointer', fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
          letterSpacing: '0.1em', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#ff4444'; (e.target as HTMLButtonElement).style.color = '#ff4444' }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = '#1a3a2a'; (e.target as HTMLButtonElement).style.color = '#3a6a55' }}
        >
          ⏻ LOGOUT
        </button>
      </div>
    </aside>
  )
}

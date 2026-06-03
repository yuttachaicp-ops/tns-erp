'use client'
import { useAppShell } from '@/lib/appshell-context'
import { useState, useEffect } from 'react'

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { isMobile, onMenuToggle } = useAppShell()
  const [time, setTime] = useState('')
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
      setBlink(v => !v)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header style={{
      height: '60px',
      background: '#080f0c',
      borderBottom: '1px solid #0d4a35',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: '12px',
      boxShadow: '0 1px 0 rgba(0,245,212,0.15), 0 2px 20px rgba(0,0,0,0.5)',
    }}>
      {/* Corner decoration left */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 8, height: 8, borderTop: '2px solid #00f5d4', borderLeft: '2px solid #00f5d4' }} />
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: 8, height: 8, borderBottom: '2px solid #00f5d4', borderLeft: '2px solid #00f5d4' }} />

      {isMobile && (
        <button onClick={onMenuToggle} style={{ background: 'transparent', border: '1px solid #0d4a35', color: '#00f5d4', fontSize: '16px', cursor: 'pointer', padding: '4px 8px', borderRadius: '2px', lineHeight: 1, flexShrink: 0, fontFamily: 'monospace' }}>≡</button>
      )}

      {/* Status dot */}
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88', flexShrink: 0, animation: 'status-blink 2s ease-in-out infinite' }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h1 style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: '700', color: '#00f5d4', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: '0 0 10px rgba(0,245,212,0.6)', fontFamily: '"Share Tech Mono", monospace' }}>{title}</h1>
          {subtitle && <span style={{ fontSize: '11px', color: '#3a8a65', fontFamily: '"Share Tech Mono", monospace' }}>// {subtitle}</span>}
        </div>
      </div>

      {/* Clock */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: '#3a6a55', fontFamily: '"Share Tech Mono", monospace' }}>
            {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </div>
          <div style={{ background: '#060d0b', border: '1px solid #0d4a35', padding: '4px 12px', borderRadius: '2px', fontFamily: '"Share Tech Mono", monospace', fontSize: '14px', color: '#00f5d4', letterSpacing: '0.15em', textShadow: '0 0 8px rgba(0,245,212,0.7)' }}>
            ⏱ {time}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', padding: '3px 10px', borderRadius: '2px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 4px #00ff88' }} />
            <span style={{ fontSize: '10px', color: '#00ff88', fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.1em' }}>ONLINE</span>
          </div>
        </div>
      )}

      {/* Corner decoration right */}
      <div style={{ position: 'absolute', right: 0, top: 0, width: 8, height: 8, borderTop: '2px solid #00f5d4', borderRight: '2px solid #00f5d4' }} />
      <div style={{ position: 'absolute', right: 0, bottom: 0, width: 8, height: 8, borderBottom: '2px solid #00f5d4', borderRight: '2px solid #00f5d4' }} />
    </header>
  )
}

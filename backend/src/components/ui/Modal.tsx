'use client'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  const widths = { sm: '400px', md: '560px', lg: '720px' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a1612',
        border: '1px solid #0d4a35',
        borderRadius: '2px',
        width: '100%',
        maxWidth: widths[size],
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 0 40px rgba(0,245,212,0.15), 0 25px 50px rgba(0,0,0,0.8)',
        position: 'relative',
      }}>
        {/* Corner decorations */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 8, height: 8, borderTop: '2px solid #00f5d4', borderLeft: '2px solid #00f5d4' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, width: 8, height: 8, borderTop: '2px solid #00f5d4', borderRight: '2px solid #00f5d4' }} />
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: 8, height: 8, borderBottom: '2px solid #00f5d4', borderLeft: '2px solid #00f5d4' }} />
        <div style={{ position: 'absolute', right: 0, bottom: 0, width: 8, height: 8, borderBottom: '2px solid #00f5d4', borderRight: '2px solid #00f5d4' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #0d4a35', background: '#080f0c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, background: '#00f5d4', boxShadow: '0 0 6px #00f5d4' }} />
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#00f5d4', fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.1em', textTransform: 'uppercase', textShadow: '0 0 8px rgba(0,245,212,0.5)' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #1a3a2a', color: '#3a6a55', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '3px 8px', fontFamily: 'monospace', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#ff4444'; (e.target as HTMLButtonElement).style.color = '#ff4444' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = '#1a3a2a'; (e.target as HTMLButtonElement).style.color = '#3a6a55' }}>
            ✕
          </button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  )
}

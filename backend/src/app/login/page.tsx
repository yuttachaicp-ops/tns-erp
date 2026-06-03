'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const d = await r.json()
      if (d.success) {
        localStorage.setItem('tns-token', d.data.token)
        localStorage.setItem('tns-user', JSON.stringify(d.data.user))
        router.push('/dashboard')
      } else {
        setError(d.error || 'EMAIL หรือ PASSWORD ไม่ถูกต้อง')
      }
    } catch {
      setError('SYSTEM ERROR: CANNOT CONNECT TO SERVER')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060d0b', padding: '16px', fontFamily: '"Share Tech Mono", "Noto Sans Thai", monospace', position: 'relative', overflow: 'hidden' }}>

      {/* Background grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,245,212,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,212,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Corner decorations */}
      <div style={{ position: 'fixed', left: 20, top: 20, width: 30, height: 30, borderTop: '2px solid #0d4a35', borderLeft: '2px solid #0d4a35' }} />
      <div style={{ position: 'fixed', right: 20, top: 20, width: 30, height: 30, borderTop: '2px solid #0d4a35', borderRight: '2px solid #0d4a35' }} />
      <div style={{ position: 'fixed', left: 20, bottom: 20, width: 30, height: 30, borderBottom: '2px solid #0d4a35', borderLeft: '2px solid #0d4a35' }} />
      <div style={{ position: 'fixed', right: 20, bottom: 20, width: 30, height: 30, borderBottom: '2px solid #0d4a35', borderRight: '2px solid #0d4a35' }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: '#0a1612', border: '1px solid #0d4a35', marginBottom: 16, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 6, height: 6, borderTop: '1px solid #00f5d4', borderLeft: '1px solid #00f5d4' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, width: 6, height: 6, borderTop: '1px solid #00f5d4', borderRight: '1px solid #00f5d4' }} />
            <div style={{ position: 'absolute', left: 0, bottom: 0, width: 6, height: 6, borderBottom: '1px solid #00f5d4', borderLeft: '1px solid #00f5d4' }} />
            <div style={{ position: 'absolute', right: 0, bottom: 0, width: 6, height: 6, borderBottom: '1px solid #00f5d4', borderRight: '1px solid #00f5d4' }} />
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#00f5d4', textShadow: '0 0 16px rgba(0,245,212,0.9)' }}>T</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#00f5d4', letterSpacing: '0.25em', textShadow: '0 0 16px rgba(0,245,212,0.7)', marginBottom: 4 }}>TNS ERP</div>
          <div style={{ fontSize: '9px', color: '#1a5a40', letterSpacing: '0.4em' }}>COMMAND CENTER v2.0</div>
        </div>

        {/* Login Panel */}
        <div style={{ background: '#0a1612', border: '1px solid #0d4a35', padding: '28px', position: 'relative', boxShadow: '0 0 30px rgba(0,245,212,0.08)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 8, height: 8, borderTop: '2px solid #00f5d4', borderLeft: '2px solid #00f5d4' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, width: 8, height: 8, borderTop: '2px solid #00f5d4', borderRight: '2px solid #00f5d4' }} />
          <div style={{ position: 'absolute', left: 0, bottom: 0, width: 8, height: 8, borderBottom: '2px solid #00f5d4', borderLeft: '2px solid #00f5d4' }} />
          <div style={{ position: 'absolute', right: 0, bottom: 0, width: 8, height: 8, borderBottom: '2px solid #00f5d4', borderRight: '2px solid #00f5d4' }} />

          <div style={{ fontSize: '9px', color: '#1a5a40', letterSpacing: '0.2em', marginBottom: 20 }}>[ AGENT AUTHENTICATION ]</div>

          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#3a6a55', letterSpacing: '0.2em', marginBottom: 6 }}>AGENT ID (EMAIL)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="agent@tns.co.th"
                style={{ width: '100%', padding: '10px 12px', background: '#060d0b', border: '1px solid #0d4a35', color: '#c8f0e0', fontSize: '12px', fontFamily: '"Share Tech Mono", monospace', outline: 'none', boxSizing: 'border-box' as const }}
                onFocus={e => (e.target.style.borderColor = '#00f5d4')}
                onBlur={e => (e.target.style.borderColor = '#0d4a35')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#3a6a55', letterSpacing: '0.2em', marginBottom: 6 }}>ACCESS CODE (PASSWORD)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                style={{ width: '100%', padding: '10px 12px', background: '#060d0b', border: '1px solid #0d4a35', color: '#c8f0e0', fontSize: '12px', fontFamily: '"Share Tech Mono", monospace', outline: 'none', boxSizing: 'border-box' as const }}
                onFocus={e => (e.target.style.borderColor = '#00f5d4')}
                onBlur={e => (e.target.style.borderColor = '#0d4a35')} />
            </div>

            {error && (
              <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', padding: '8px 12px', fontSize: '11px', color: '#ff4444', fontFamily: '"Share Tech Mono", monospace' }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '12px', background: loading ? '#0a1612' : 'rgba(0,245,212,0.1)',
              border: `1px solid ${loading ? '#0d4a35' : '#00f5d4'}`,
              color: loading ? '#3a6a55' : '#00f5d4',
              fontSize: '11px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.2em', fontFamily: '"Share Tech Mono", monospace',
              textShadow: loading ? 'none' : '0 0 8px rgba(0,245,212,0.5)',
              transition: 'all 0.15s',
            }}>
              {loading ? '[ AUTHENTICATING... ]' : '[ ENTER SYSTEM ]'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: '9px', color: '#0d2a1e', letterSpacing: '0.15em' }}>
          TNS ERP SYSTEM © 2024 — AUTHORIZED PERSONNEL ONLY
        </div>
      </div>
    </div>
  )
}

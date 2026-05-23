'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ'); return }
      localStorage.setItem('tns-token', data.data.token)
      localStorage.setItem('tns-user', JSON.stringify(data.data.user))
      router.push('/dashboard')
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#0f1117 0%,#1a1d2e 50%,#0f1117 100%)'}}>
      <div className="w-full max-w-md p-8 rounded-2xl" style={{background:'#1a1d2e',border:'1px solid #2d3154',boxShadow:'0 25px 50px rgba(0,0,0,0.5)'}}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">TNS ERP</h1>
          <p className="text-sm mt-1" style={{color:'#8892b0'}}>Daily Operations System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{background:'#2d1b1b',border:'1px solid #7f1d1d',color:'#fca5a5'}}>
              ⚠️ {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{color:'#94a3b8'}}>อีเมล</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@tns.co.th"
              className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-all"
              style={{background:'#0f1117',border:'1px solid #2d3154'}}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{color:'#94a3b8'}}>รหัสผ่าน</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-all"
              style={{background:'#0f1117',border:'1px solid #2d3154'}}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all mt-2"
            style={{background: loading ? '#4338ca88' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', cursor: loading ? 'not-allowed' : 'pointer'}}
          >
            {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🚀 เข้าสู่ระบบ'}
          </button>
        </form>
        <p className="text-center text-xs mt-6" style={{color:'#4a5568'}}>
          TNS ERP v1.0 © 2024 — Powered by TNS
        </p>
      </div>
    </div>
  )
}

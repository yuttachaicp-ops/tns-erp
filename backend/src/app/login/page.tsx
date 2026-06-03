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
        setError(d.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f1117',padding:'16px'}}>
      <div style={{width:'100%',maxWidth:'400px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'28px',fontWeight:'bold',color:'white'}}>T</div>
          <h1 style={{fontSize:'24px',fontWeight:'800',color:'white',margin:'0 0 4px'}}>TNS ERP</h1>
          <p style={{color:'#64748b',fontSize:'14px',margin:0}}>Daily Operations System</p>
        </div>
        <div style={{background:'#1a1d2e',borderRadius:'16px',border:'1px solid #2d3154',padding:'32px'}}>
          <form onSubmit={login} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div>
              <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#94a3b8',marginBottom:'6px'}}>อีเมล</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com"
                style={{width:'100%',padding:'10px 14px',borderRadius:'8px',border:'1px solid #2d3154',background:'#0f1117',color:'white',fontSize:'14px',outline:'none',boxSizing:'border-box' as const}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#94a3b8',marginBottom:'6px'}}>รหัสผ่าน</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
                style={{width:'100%',padding:'10px 14px',borderRadius:'8px',border:'1px solid #2d3154',background:'#0f1117',color:'white',fontSize:'14px',outline:'none',boxSizing:'border-box' as const}} />
            </div>
            {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'8px',padding:'10px 14px',color:'#f87171',fontSize:'13px'}}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{padding:'12px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'10px',color:'white',fontSize:'15px',fontWeight:'700',cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

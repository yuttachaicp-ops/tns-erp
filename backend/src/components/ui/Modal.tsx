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
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div onClick={e => e.stopPropagation()} style={{background:'#1a1d2e',border:'1px solid #2d3154',borderRadius:'16px',width:'100%',maxWidth:widths[size],maxHeight:'90vh',overflow:'auto',boxShadow:'0 25px 50px rgba(0,0,0,0.5)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid #2d3154'}}>
          <h3 style={{margin:0,fontSize:'16px',fontWeight:'700',color:'white'}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:'20px',lineHeight:1,padding:'2px 6px',borderRadius:'6px'}}>×</button>
        </div>
        <div style={{padding:'24px'}}>{children}</div>
      </div>
    </div>
  )
}

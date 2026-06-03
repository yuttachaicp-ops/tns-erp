'use client'
import { useAppShell } from '@/lib/appshell-context'
export default function Header({ title, subtitle }: { title:string; subtitle?:string }) {
  const { isMobile, onMenuToggle } = useAppShell()
  return (
    <header style={{height:'60px',background:'#1a1d2e',borderBottom:'1px solid #2d3154',display:'flex',alignItems:'center',padding:'0 16px',position:'sticky',top:0,zIndex:50,gap:'12px'}}>
      {isMobile && (
        <button onClick={onMenuToggle} style={{background:'transparent',border:'none',color:'white',fontSize:'22px',cursor:'pointer',padding:'4px 8px',borderRadius:'6px',lineHeight:1,flexShrink:0}}>☰</button>
      )}
      <div style={{flex:1,minWidth:0}}>
        <h1 style={{fontSize:isMobile?'15px':'18px',fontWeight:'700',color:'white',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</h1>
        {subtitle && <p style={{fontSize:'12px',color:'#6366f1',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{subtitle}</p>}
      </div>
      {!isMobile && (
        <div style={{fontSize:'12px',color:'#4a5568',whiteSpace:'nowrap'}}>
          {new Date().toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      )}
    </header>
  )
}

'use client'

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header style={{height:'60px',background:'#1a1d2e',borderBottom:'1px solid #2d3154',display:'flex',alignItems:'center',padding:'0 24px',position:'sticky',top:0,zIndex:50}}>
      <div>
        <h1 style={{fontSize:'18px',fontWeight:'700',color:'white',margin:0}}>{title}</h1>
        {subtitle && <p style={{fontSize:'12px',color:'#6366f1',margin:0}}>{subtitle}</p>}
      </div>
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'8px'}}>
        <div style={{fontSize:'12px',color:'#4a5568'}}>
          {new Date().toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      </div>
    </header>
  )
}

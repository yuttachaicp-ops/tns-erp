export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:     { bg:'rgba(251,191,36,0.1)',  color:'#fbbf24', label:'⏳ รอดำเนินการ' },
    IN_PROGRESS: { bg:'rgba(99,102,241,0.1)',  color:'#818cf8', label:'🔄 กำลังทำ' },
    COMPLETED:   { bg:'rgba(34,197,94,0.1)',   color:'#4ade80', label:'✅ เสร็จสิ้น' },
    CANCELLED:   { bg:'rgba(239,68,68,0.1)',   color:'#f87171', label:'❌ ยกเลิก' },
    TODO:        { bg:'rgba(148,163,184,0.1)', color:'#94a3b8', label:'📋 รอทำ' },
    DONE:        { bg:'rgba(34,197,94,0.1)',   color:'#4ade80', label:'✅ เสร็จ' },
  }
  const s = map[status] || { bg:'rgba(100,100,100,0.1)', color:'#888', label: status }
  return (
    <span style={{padding:'3px 10px',borderRadius:'999px',fontSize:'12px',fontWeight:'600',background:s.bg,color:s.color,whiteSpace:'nowrap'}}>
      {s.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    LOW:    { bg:'rgba(148,163,184,0.1)', color:'#94a3b8', label:'🟢 ต่ำ' },
    MEDIUM: { bg:'rgba(251,191,36,0.1)',  color:'#fbbf24', label:'🟡 กลาง' },
    HIGH:   { bg:'rgba(249,115,22,0.1)',  color:'#fb923c', label:'🟠 สูง' },
    URGENT: { bg:'rgba(239,68,68,0.1)',   color:'#f87171', label:'🔴 เร่งด่วน' },
  }
  const p = map[priority] || { bg:'rgba(100,100,100,0.1)', color:'#888', label: priority }
  return (
    <span style={{padding:'3px 10px',borderRadius:'999px',fontSize:'12px',fontWeight:'600',background:p.bg,color:p.color}}>
      {p.label}
    </span>
  )
}

export function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    SHOPEE:     { bg:'rgba(255,87,34,0.1)',  color:'#ff7043', label:'🛍️ Shopee' },
    LAZADA:     { bg:'rgba(156,39,176,0.1)', color:'#ce93d8', label:'💜 Lazada' },
    TIKTOK_SHOP:{ bg:'rgba(0,0,0,0.3)',      color:'#e0e0e0', label:'🎵 TikTok' },
    WEBSITE:    { bg:'rgba(99,102,241,0.1)', color:'#818cf8', label:'🌐 Website' },
    UNKNOWN:    { bg:'rgba(100,116,139,0.1)',color:'#94a3b8', label:'❓ ยังไม่ทราบ' },
  }
  const p = map[platform] || { bg:'rgba(100,100,100,0.1)', color:'#888', label: platform }
  return (
    <span style={{padding:'3px 10px',borderRadius:'999px',fontSize:'12px',fontWeight:'600',background:p.bg,color:p.color}}>
      {p.label}
    </span>
  )
}

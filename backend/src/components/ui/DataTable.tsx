'use client'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  keyField?: string
}

export default function DataTable<T extends Record<string, unknown>>({
  columns, data, loading, emptyText = 'ไม่มีข้อมูล', keyField = 'id'
}: DataTableProps<T>) {
  return (
    <div style={{background:'#1a1d2e',borderRadius:'12px',border:'1px solid #2d3154',overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
          <thead>
            <tr style={{background:'#0f1117'}}>
              {columns.map(col => (
                <th key={col.key} style={{padding:'12px 16px',textAlign:'left',color:'#6366f1',fontWeight:'600',fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap',width:col.width}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>⏳ กำลังโหลด...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} style={{padding:'40px',textAlign:'center',color:'#4a5568'}}>📭 {emptyText}</td></tr>
            ) : data.map((row, i) => (
              <tr key={String(row[keyField]) || i} style={{borderTop:'1px solid #2d3154',transition:'background 0.1s'}}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(99,102,241,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                {columns.map(col => (
                  <td key={col.key} style={{padding:'12px 16px',color:'#e2e8f0',verticalAlign:'middle'}}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

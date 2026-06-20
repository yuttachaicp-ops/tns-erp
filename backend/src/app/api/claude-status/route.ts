export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [summaryRes, incidentsRes] = await Promise.all([
      fetch('https://status.claude.com/api/v2/summary.json', { next: { revalidate: 60 } }),
      fetch('https://status.claude.com/api/v2/incidents.json?limit=10', { next: { revalidate: 60 } }),
    ])
    const summary = await summaryRes.json()
    const incidents = await incidentsRes.json()
    return NextResponse.json({ summary, incidents })
  } catch {
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลได้' }, { status: 500 })
  }
}

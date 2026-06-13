import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// GET /api/claude-usage?days=30
export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = Number(new URL(req.url).searchParams.get('days') || '30')
  const since = new Date(); since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const logs = await prisma.claudeUsageLog.findMany({
    where: { date: { gte: sinceStr } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ ok: true, logs })
}

// DELETE /api/claude-usage/:id  — delete single entry
export async function DELETE(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await req.json()
    await prisma.claudeUsageLog.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

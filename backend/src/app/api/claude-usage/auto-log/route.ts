import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/claude-usage/auto-log  — called by Claude Code hook after each session
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== (process.env.CRON_SECRET || 'tns-cron-cleanup-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { date, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, model, sessionId, sessionNote, autoLogged } = body
    const total = (inputTokens || 0) + (outputTokens || 0) + (cacheReadTokens || 0) + (cacheWriteTokens || 0)
    if (total === 0) return NextResponse.json({ ok: true, skipped: true })

    const entry = await prisma.claudeUsageLog.create({
      data: {
        date:             date || new Date().toISOString().slice(0, 10),
        inputTokens:      inputTokens      || 0,
        outputTokens:     outputTokens     || 0,
        cacheReadTokens:  cacheReadTokens  || 0,
        cacheWriteTokens: cacheWriteTokens || 0,
        totalTokens:      total,
        model:            model            || '',
        sessionId:        sessionId        || null,
        sessionNote:      sessionNote      || '',
        autoLogged:       autoLogged       ?? true,
      },
    })
    return NextResponse.json({ ok: true, id: entry.id, totalTokens: total })
  } catch (e) {
    console.error('[claude-usage auto-log]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

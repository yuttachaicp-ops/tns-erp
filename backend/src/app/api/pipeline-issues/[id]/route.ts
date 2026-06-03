import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const resolvedAt = body.status === 'RESOLVED' ? new Date() : body.status === 'OPEN' ? null : undefined
  await prisma.pipelineIssue.updateMany({
    where: { id: params.id, userId: user.userId },
    data: {
      title: body.title,
      description: body.description || null,
      severity: body.severity,
      status: body.status,
      ...(resolvedAt !== undefined ? { resolvedAt } : {}),
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.pipelineIssue.deleteMany({ where: { id: params.id, userId: user.userId } })
  return NextResponse.json({ ok: true })
}

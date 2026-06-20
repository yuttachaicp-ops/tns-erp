export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  await prisma.savingsGoal.updateMany({
    where: { id: params.id, userId: user.userId },
    data: {
      name: body.name,
      targetAmount: Number(body.targetAmount),
      savedAmount: Number(body.savedAmount) || 0,
      targetDate: body.targetDate || null,
      icon: body.icon || null,
      note: body.note || null,
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.savingsGoal.deleteMany({ where: { id: params.id, userId: user.userId } })
  return NextResponse.json({ ok: true })
}

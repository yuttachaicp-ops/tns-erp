export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const goals = await prisma.savingsGoal.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(goals)
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const goal = await prisma.savingsGoal.create({
    data: {
      userId: user.userId,
      name: body.name,
      targetAmount: Number(body.targetAmount),
      savedAmount: Number(body.savedAmount) || 0,
      targetDate: body.targetDate || null,
      icon: body.icon || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(goal)
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ success: false }, { status: 401 })
  const b = await req.json()
  const item = await prisma.catDailyLog.update({
    where: { id: params.id },
    data: {
      logDate: b.logDate ? new Date(b.logDate) : undefined,
      foodIntake: b.food || b.foodIntake || null,
      waterIntake: b.water || b.waterIntake || null,
      excretion: b.poop || b.excretion || null,
      behavior: b.mood || b.behavior || null,
      symptoms: b.symptom || b.symptoms || null,
      breathRate: b.breathRate ? parseFloat(b.breathRate) : null,
      weight: b.weight ? parseFloat(b.weight) : null,
      note: b.note || null,
    },
  })
  return NextResponse.json({ success: true, data: item })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ success: false }, { status: 401 })
  await prisma.catDailyLog.deleteMany({ where: { id: params.id, userId: user.userId } })
  return NextResponse.json({ success: true })
}

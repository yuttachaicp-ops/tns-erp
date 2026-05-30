import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json()
  await prisma.catVetVisit.updateMany({
    where: { id: params.id, userId: user.userId },
    data: {
      visitDate: b.visitDate ? new Date(b.visitDate) : undefined,
      clinic: b.clinic || null,
      doctor: b.doctor || null,
      reason: b.reason || null,
      diagnosis: b.diagnosis || null,
      treatment: b.treatment || null,
      nextDate: b.nextDate ? new Date(b.nextDate) : null,
      cost: b.cost ? parseFloat(b.cost) : null,
      note: b.note || null,
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.catVetVisit.deleteMany({ where: { id: params.id, userId: user.userId } })
  return NextResponse.json({ ok: true })
}

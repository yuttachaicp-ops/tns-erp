import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toPageFields(item: any) {
  return {
    id: item.id, catId: item.catId,
    visitDate: item.visitDate?.toISOString?.().split('T')[0] || item.visitDate,
    clinic: item.clinic || '',
    doctor: item.doctor || '',
    reason: item.reason || '',
    diagnosis: item.diagnosis || '',
    treatment: item.treatment || '',
    nextDate: item.nextDate?.toISOString?.().split('T')[0] || item.nextDate || '',
    cost: item.cost?.toString() || '',
    note: item.note || '',
  }
}

export async function GET(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const catId = new URL(req.url).searchParams.get('catId')
  const items = await prisma.catVetVisit.findMany({
    where: { userId: user.userId, ...(catId ? { catId } : {}) },
    orderBy: { visitDate: 'desc' },
  })
  return NextResponse.json(items.map(toPageFields))
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json()
  const item = await prisma.catVetVisit.create({
    data: {
      userId: user.userId,
      catId: b.catId,
      visitDate: b.visitDate ? new Date(b.visitDate) : new Date(),
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
  return NextResponse.json(toPageFields(item))
}

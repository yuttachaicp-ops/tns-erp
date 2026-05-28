import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const catId = new URL(req.url).searchParams.get('catId')
  const vaccs = await prisma.catVaccination.findMany({
    where: { userId: user.userId, ...(catId ? { catId } : {}) },
    orderBy: { vacDate: 'desc' },
  })
  return NextResponse.json(vaccs)
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const vacc = await prisma.catVaccination.create({
    data: {
      userId: user.userId,
      catId: body.catId,
      vaccineName: body.vaccineName,
      vacDate: body.vacDate ? new Date(body.vacDate) : new Date(),
      nextDate: body.nextDate ? new Date(body.nextDate) : null,
      clinic: body.clinic || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(vacc)
}
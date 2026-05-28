import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cats = await prisma.cat.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const cat = await prisma.cat.create({
    data: {
      userId: user.userId,
      name: body.name,
      breed: body.breed || null,
      color: body.color || null,
      birthDate: body.birthDate || null,
      weight: body.weight || null,
      microchip: body.microchip || null,
      allergy: body.allergy || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(cat)
}
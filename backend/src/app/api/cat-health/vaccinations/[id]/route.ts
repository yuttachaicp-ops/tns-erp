export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token=getTokenFromHeader(req.headers.get("Authorization"))
  const user=await verifyToken(token||"")
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})
  const body = await req.json()
  await prisma.catVaccination.updateMany({
    where: { id: params.id, userId: user.userId },
    data: {
      vaccineName: body.vaccineName,
      vacDate: body.vacDate ? new Date(body.vacDate) : undefined,
      nextDate: body.nextDate ? new Date(body.nextDate) : null,
      clinic: body.clinic || null,
      note: body.note || null,
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token=getTokenFromHeader(req.headers.get("Authorization"))
  const user=await verifyToken(token||"")
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})
  await prisma.catVaccination.deleteMany({
    where: { id: params.id, userId: user.userId },
  })
  return NextResponse.json({ ok: true })
}
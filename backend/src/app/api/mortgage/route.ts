export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mortgages = await prisma.mortgage.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(mortgages)
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const mortgage = await prisma.mortgage.create({
    data: {
      userId: user.userId,
      name: body.name,
      bankName: body.bankName || null,
      totalAmount: Number(body.totalAmount),
      monthlyPayment: Number(body.monthlyPayment),
      totalInstallments: Number(body.totalInstallments),
      paidInstallments: Number(body.paidInstallments) || 0,
      startDate: body.startDate || null,
      note: body.note || null,
    },
  })
  return NextResponse.json(mortgage)
}

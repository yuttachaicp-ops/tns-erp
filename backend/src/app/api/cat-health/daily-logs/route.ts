import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toPageFields(item: any) {
  return {
    id: item.id, catId: item.catId,
    logDate: item.logDate?.toISOString?.().split('T')[0] || item.logDate,
    weight: item.weight?.toString() || '',
    food: item.foodIntake || '',
    water: item.waterIntake || '',
    poop: item.excretion || '',
    mood: item.behavior || '',
    symptom: item.symptoms || '',
    breathRate: item.breathRate?.toString() || '',
    note: item.note || '',
  }
}

export async function GET(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ success: false }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
  const catId = searchParams.get('catId')
  const start = new Date(`${month}-01`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  const items = await prisma.catDailyLog.findMany({
    where: { userId: user.userId, ...(catId ? { catId } : {}), logDate: { gte: start, lt: end } },
    orderBy: { logDate: 'desc' },
  })
  return NextResponse.json({ success: true, data: items.map(toPageFields) })
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(getTokenFromHeader(req.headers.get('Authorization')) || '')
  if (!user) return NextResponse.json({ success: false }, { status: 401 })
  const b = await req.json()
  const item = await prisma.catDailyLog.create({
    data: {
      userId: user.userId,
      catId: b.catId,
      logDate: b.logDate ? new Date(b.logDate) : new Date(),
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
  return NextResponse.json({ success: true, data: toPageFields(item) })
}

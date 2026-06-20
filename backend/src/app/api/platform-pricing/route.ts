import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'

const DEFAULTS = [
  { platform: 'SHOPEE',         multiplier: 1.15, commission: 5.0, note: 'รวมค่า GP Shopee' },
  { platform: 'LAZADA',         multiplier: 1.12, commission: 4.5, note: 'รวมค่า GP Lazada' },
  { platform: 'SHOPEE_SUNTREE', multiplier: 1.15, commission: 5.0, note: 'รวมค่า GP Shopee (Suntree)' },
  { platform: 'LAZADA_SUNTREE', multiplier: 1.12, commission: 4.5, note: 'รวมค่า GP Lazada (Suntree)' },
]

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  // สร้าง default ถ้ายังไม่มีข้อมูล
  for (const d of DEFAULTS) {
    await prisma.platformPricing.upsert({
      where: { platform: d.platform },
      update: {},
      create: d,
    })
  }

  const items = await prisma.platformPricing.findMany({ orderBy: { platform: 'asc' } })
  return successResponse(items)
}

export async function PUT(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const body: { platform: string; multiplier: number; commission: number; note?: string }[] = await req.json()
    const results = await Promise.all(
      body.map(item =>
        prisma.platformPricing.upsert({
          where: { platform: item.platform },
          update: { multiplier: item.multiplier, commission: item.commission, note: item.note },
          create: { platform: item.platform, multiplier: item.multiplier, commission: item.commission, note: item.note },
        })
      )
    )
    return successResponse(results)
  } catch {
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

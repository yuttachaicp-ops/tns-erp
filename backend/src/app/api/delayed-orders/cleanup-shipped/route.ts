export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// POST /api/delayed-orders/cleanup-shipped
// ลบ SHIPPED orders ทั้งหมด — เรียกโดย scheduled task ทุกวันเวลา 00:00
export async function POST(req: NextRequest) {
  const secret   = req.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  if (!expected) return errorResponse('CRON_SECRET not configured', 500)
  if (secret !== expected) return errorResponse('Unauthorized', 401)

  try {
    const result = await prisma.delayedOrder.deleteMany({
      where: { status: 'SHIPPED' },
    })
    return successResponse({
      deleted:   result.count,
      timestamp: new Date().toISOString(),
      message:   `ลบออร์เดอร์ที่ส่งแล้ว ${result.count} รายการ`,
    })
  } catch (e) {
    console.error('[cleanup-shipped]', e)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

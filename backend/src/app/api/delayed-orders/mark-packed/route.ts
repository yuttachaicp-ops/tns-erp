import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'

// POST /api/delayed-orders/mark-packed
// Body: { orders: [{ orderNumber: string, trackingNumber?: string }] }
// Updates matching orders → READY_TO_SHIP, also fills trackingNumber if missing
export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const { orders }: { orders: Array<{ orderNumber: string; trackingNumber?: string }> } = await req.json()

    const orderNumbers = orders.map(o => o.orderNumber).filter(Boolean)
    const trackingMap  = new Map(orders.map(o => [o.orderNumber, o.trackingNumber || '']))

    // Get existing orders that match
    const existing = await prisma.delayedOrder.findMany({
      where: {
        orderNumber: { in: orderNumbers },
        status: { notIn: ['SHIPPED', 'CANCELLED'] }, // don't downgrade
      },
      select: { id: true, orderNumber: true, trackingNumber: true },
    })

    if (existing.length === 0) {
      return successResponse({ updated: 0, notFound: orderNumbers.length })
    }

    // Batch update to READY_TO_SHIP
    const updateOps = existing.map(e => {
      const newTracking = trackingMap.get(e.orderNumber)
      return prisma.delayedOrder.update({
        where: { id: e.id },
        data: {
          status: 'READY_TO_SHIP',
          ...(newTracking && !e.trackingNumber && { trackingNumber: newTracking }),
        },
      })
    })

    await prisma.$transaction(updateOps)

    return successResponse({
      updated:  existing.length,
      notFound: orderNumbers.length - existing.length,
      total:    orderNumbers.length,
    })
  } catch (e) {
    console.error(e)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'

// PATCH /api/delayed-orders/items/[itemId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const { isOutOfStock, expectedArrival, note } = await req.json()
    const item = await prisma.delayedOrderItem.update({
      where: { id: params.itemId },
      data: {
        ...(isOutOfStock     !== undefined && { isOutOfStock }),
        ...(expectedArrival  !== undefined && { expectedArrival }),
        ...(note             !== undefined && { note }),
      },
    })
    return successResponse(item)
  } catch {
    return errorResponse('ไม่พบสินค้า', 404)
  }
}

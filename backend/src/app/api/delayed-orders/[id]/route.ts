import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'

// PATCH /api/delayed-orders/[id]  – update status or note
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const { status, note } = await req.json()
    const order = await prisma.delayedOrder.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(note   !== undefined && { note }),
      },
      include: { items: true },
    })
    return successResponse(order)
  } catch {
    return errorResponse('ไม่พบคำสั่งซื้อ', 404)
  }
}

// DELETE /api/delayed-orders/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    await prisma.delayedOrder.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch {
    return errorResponse('ไม่พบคำสั่งซื้อ', 404)
  }
}

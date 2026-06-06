import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const body = await req.json()
    const item = await prisma.noBarcode.update({
      where: { id: params.id },
      data: body,
    })
    await logActivity(session.userId, 'UPDATE', 'NO_BARCODE', `แก้ไข: ${item.productName}`)
    return successResponse(item)
  } catch {
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const item = await prisma.noBarcode.delete({ where: { id: params.id } })
    await logActivity(session.userId, 'DELETE', 'NO_BARCODE', `ลบ: ${item.productName}`)
    return successResponse({ message: 'ลบสำเร็จ' })
  } catch {
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

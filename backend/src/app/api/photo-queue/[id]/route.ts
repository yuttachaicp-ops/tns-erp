import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.photoQueue.findUnique({
    where: { id: params.id },
    include: { user: { select: { name: true } } },
  })
  if (!item) return errorResponse('ไม่พบข้อมูล', 404)
  return successResponse(item)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  const body = await req.json()
  const item = await prisma.photoQueue.update({
    where: { id: params.id },
    data: body,
    include: { user: { select: { name: true } } },
  })

  await logActivity(session.userId, 'UPDATE', 'PHOTO_QUEUE', `แก้ไขสินค้า: ${item.productName}`)
  return successResponse(item)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  if (session.role !== 'ADMIN') return errorResponse('ไม่มีสิทธิ์', 403)

  const item = await prisma.photoQueue.delete({ where: { id: params.id } })
  await logActivity(session.userId, 'DELETE', 'PHOTO_QUEUE', `ลบสินค้า: ${item.productName}`)
  return successResponse({ message: 'ลบสำเร็จ' })
}

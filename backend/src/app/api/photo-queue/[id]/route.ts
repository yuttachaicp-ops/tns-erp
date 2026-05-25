import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  productName: z.string().min(1).optional(),
  sku: z.string().nullish(),
  category: z.string().nullish(),
  quantity: z.number().int().min(1).optional(),
  receivedDate: z.string().nullish(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  note: z.string().nullish(),
}).passthrough()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  const item = await prisma.photoQueue.findUnique({ where: { id: params.id } })
  if (!item) return errorResponse('ไม่พบข้อมูล', 404)
  return successResponse(item)
}

async function handleUpdate(req: NextRequest, id: string) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const updateData: Record<string, unknown> = {}
    if (data.productName !== undefined) updateData.productName = data.productName
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.category !== undefined) updateData.category = data.category
    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.status !== undefined) updateData.status = data.status
    if (data.note !== undefined) updateData.note = data.note
    if (data.receivedDate) {
      const dateStr = data.receivedDate as string
      updateData.receivedDate = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00.000Z')
    }
    const item = await prisma.photoQueue.update({
      where: { id },
      data: updateData,
      include: { user: { select: { name: true } } },
    })
    await logActivity(session.userId, 'UPDATE', 'PHOTO_QUEUE', `แก้ไขสินค้า: ${item.productName}`)
    return successResponse(item)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง', 422)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleUpdate(req, params.id)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return handleUpdate(req, params.id)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  try {
    const item = await prisma.photoQueue.delete({ where: { id: params.id } })
    await logActivity(session.userId, 'DELETE', 'PHOTO_QUEUE', `ลบสินค้า: ${item.productName}`)
    return successResponse({ message: 'ลบสำเร็จ' })
  } catch {
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}
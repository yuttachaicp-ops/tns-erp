import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  workTitle: z.string().min(1).optional(),
  workDetail: z.string().optional(),
  workCategory: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  assignedUser: z.string().optional(),
  workDate: z.string().optional(),
  workTime: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  const item = await prisma.dailyLog.findUnique({ where: { id: params.id } })
  if (!item) return errorResponse('ไม่พบข้อมูล', 404)
  return successResponse(item)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const updateData: Record<string, unknown> = { ...data }
    if (data.workDate) {
      updateData.workDate = new Date(data.workDate + 'T00:00:00.000Z')
    }
    const item = await prisma.dailyLog.update({
      where: { id: params.id },
      data: updateData,
    })
    await logActivity(session.userId, 'UPDATE', 'DAILY_LOGS', `แก้ไขงาน: ${item.workTitle}`)
    return successResponse(item)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง', 422)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  try {
    const item = await prisma.dailyLog.delete({ where: { id: params.id } })
    await logActivity(session.userId, 'DELETE', 'DAILY_LOGS', `ลบงาน: ${item.workTitle}`)
    return successResponse({ message: 'ลบสำเร็จ' })
  } catch {
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}
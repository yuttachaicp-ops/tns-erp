import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  workTitle: z.string().min(1).optional(),
  workDetail: z.string().nullish(),
  workCategory: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  assignedUser: z.string().nullish(),
  workDate: z.string().nullish(),
  workTime: z.string().nullish(),
}).passthrough()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  const item = await prisma.dailyLog.findUnique({ where: { id: params.id } })
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
    if (data.workTitle !== undefined) updateData.workTitle = data.workTitle
    if (data.workDetail !== undefined) updateData.workDetail = data.workDetail
    if (data.workCategory !== undefined) updateData.workCategory = data.workCategory
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.status !== undefined) updateData.status = data.status
    if (data.assignedUser !== undefined) updateData.assignedUser = data.assignedUser
    if (data.workTime !== undefined) updateData.workTime = data.workTime
    if (data.workDate) {
      const dateStr = data.workDate as string
      updateData.workDate = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00.000Z')
    }
    const item = await prisma.dailyLog.update({
      where: { id },
      data: updateData,
    })
    await logActivity(session.userId, 'UPDATE', 'DAILY_LOGS', `แก้ไขงาน: ${item.workTitle}`)
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
    const item = await prisma.dailyLog.delete({ where: { id: params.id } })
    await logActivity(session.userId, 'DELETE', 'DAILY_LOGS', `ลบงาน: ${item.workTitle}`)
    return successResponse({ message: 'ลบสำเร็จ' })
  } catch {
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}
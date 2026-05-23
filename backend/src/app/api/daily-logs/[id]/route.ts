import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  const body = await req.json()
  const item = await prisma.dailyLog.update({ where: { id: params.id }, data: body })
  await logActivity(session.userId, 'UPDATE', 'DAILY_LOGS', `แก้ไขงาน: ${item.workTitle}`)
  return successResponse(item)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  if (session.role !== 'ADMIN') return errorResponse('ไม่มีสิทธิ์', 403)
  const item = await prisma.dailyLog.delete({ where: { id: params.id } })
  await logActivity(session.userId, 'DELETE', 'DAILY_LOGS', `ลบงาน: ${item.workTitle}`)
  return successResponse({ message: 'ลบสำเร็จ' })
}

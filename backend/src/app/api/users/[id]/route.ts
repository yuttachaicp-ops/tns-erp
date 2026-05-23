import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  if (session.role !== 'ADMIN' && session.userId !== params.id) return errorResponse('ไม่มีสิทธิ์', 403)

  const body = await req.json()
  const updateData: Record<string, unknown> = {}
  if (body.name) updateData.name = body.name
  if (body.role && session.role === 'ADMIN') updateData.role = body.role
  if (body.isActive !== undefined && session.role === 'ADMIN') updateData.isActive = body.isActive
  if (body.password) updateData.password = await bcrypt.hash(body.password, 12)

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, isActive: true },
  })
  await logActivity(session.userId, 'UPDATE', 'USERS', `แก้ไขผู้ใช้: ${user.name}`)
  return successResponse(user)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  if (session.role !== 'ADMIN') return errorResponse('ไม่มีสิทธิ์', 403)
  if (session.userId === params.id) return errorResponse('ไม่สามารถลบตัวเองได้', 400)

  const user = await prisma.user.delete({ where: { id: params.id } })
  await logActivity(session.userId, 'DELETE', 'USERS', `ลบผู้ใช้: ${user.name}`)
  return successResponse({ message: 'ลบสำเร็จ' })
}

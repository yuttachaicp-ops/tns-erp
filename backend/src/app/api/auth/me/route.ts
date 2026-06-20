export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/api-helpers'
import { successResponse, errorResponse } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  })

  if (!user) return errorResponse('ไม่พบผู้ใช้', 404)
  return successResponse(user)
}

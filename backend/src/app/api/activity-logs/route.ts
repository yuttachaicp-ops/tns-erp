export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const module = searchParams.get('module')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (module) where.module = module

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
  ])
  return successResponse({ items, total, page, limit })
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  workTitle: z.string().min(1),
  workDetail: z.string().optional(),
  workCategory: z.string().default('ทั่วไป'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).default('TODO'),
  assignedUser: z.string().optional(),
  workDate: z.string().optional(),
  workTime: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (date) {
    const d = new Date(date)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    where.workDate = { gte: d, lt: next }
  }
  if (search) where.workTitle = { contains: search, mode: 'insensitive' }
  const [items, total] = await Promise.all([
    prisma.dailyLog.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    prisma.dailyLog.count({ where }),
  ])
  return successResponse({ items, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const workDate = data.workDate ? new Date(data.workDate + 'T00:00:00.000Z') : new Date()
    const item = await prisma.dailyLog.create({
      data: {
        workTitle: data.workTitle,
        workDetail: data.workDetail,
        workCategory: data.workCategory,
        priority: data.priority,
        status: data.status,
        assignedUser: data.assignedUser || null,
        workDate,
        workTime: data.workTime || null,
        createdBy: session.userId,
      },
    })
    await logActivity(session.userId, 'CREATE', 'DAILY_LOGS', `เพิ่มงาน: ${item.workTitle}`)
    return successResponse(item, 201)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง', 422)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}
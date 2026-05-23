import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  productName: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  receivedDate: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING'),
  note: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) where.OR = [
    { productName: { contains: search, mode: 'insensitive' } },
    { sku: { contains: search, mode: 'insensitive' } },
  ]

  const [items, total] = await Promise.all([
    prisma.photoQueue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    prisma.photoQueue.count({ where }),
  ])

  return successResponse({ items, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const item = await prisma.photoQueue.create({
      data: { ...data, createdBy: session.userId },
      include: { user: { select: { name: true } } },
    })

    await logActivity(session.userId, 'CREATE', 'PHOTO_QUEUE', `เพิ่มสินค้า: ${item.productName}`)
    return successResponse(item, 201)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง: ' + JSON.stringify(e.errors), 422)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

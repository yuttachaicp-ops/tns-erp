import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  productName: z.string().min(1),
  sku: z.string().optional(),
  platform: z.enum(['SHOPEE', 'LAZADA', 'TIKTOK_SHOP', 'WEBSITE', 'UNKNOWN']),
  quantity: z.number().int().min(1).default(1),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  assignedTo: z.string().optional(),
  note: z.string().optional(),
  image: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const platform = searchParams.get('platform')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (platform) where.platform = platform
  if (search) where.OR = [
    { productName: { contains: search, mode: 'insensitive' } },
    { sku: { contains: search, mode: 'insensitive' } },
  ]

  const [items, total] = await Promise.all([
    prisma.listingQueue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    prisma.listingQueue.count({ where }),
  ])

  return successResponse({ items, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const body = await req.json()
    const data = schema.parse(body)
    const item = await prisma.listingQueue.create({
      data: { ...data, createdBy: session.userId },
    })
    await logActivity(session.userId, 'CREATE', 'LISTING_QUEUE', `เพิ่มสินค้า: ${item.productName} (${item.platform})`)
    return successResponse(item, 201)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง', 422)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

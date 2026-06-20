export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  productName: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  sku: z.string().optional(),
  image: z.string().optional(),
  status: z.enum(['NO_BARCODE', 'HAS_BARCODE', 'NEW_BARCODE']).default('NO_BARCODE'),
  note: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (category) where.category = category
  if (search) where.OR = [
    { productName: { contains: search, mode: 'insensitive' } },
    { sku: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
  ]

  const [items, total] = await Promise.all([
    prisma.noBarcode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    prisma.noBarcode.count({ where }),
  ])

  return successResponse({ items, total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)

  try {
    const body = await req.json()
    const data = schema.parse(body)
    const item = await prisma.noBarcode.create({
      data: { ...data, createdBy: session.userId },
    })
    await logActivity(session.userId, 'CREATE', 'NO_BARCODE', `เพิ่มสินค้าไม่มีบาร์โค้ด: ${item.productName}`)
    return successResponse(item, 201)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง', 422)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

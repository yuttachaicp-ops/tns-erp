import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
const schema = z.object({
  productName: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),
  platform: z.string().default('ALL'),
  quantity: z.number().int().min(0).default(0),
  reason: z.string().default('หมดสต็อก'),
  status: z.string().default('PENDING'),
  notifiedDate: z.string().optional(),
  note: z.string().optional(),
})
export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const platform = searchParams.get('platform')
  const where: Record<string,unknown> = {}
  if (status) where.status = status
  if (platform) where.platform = platform
  const [items, total] = await Promise.all([
    prisma.stockClose.findMany({ where, orderBy:{ createdAt:'desc' } }),
    prisma.stockClose.count({ where }),
  ])
  return successResponse({ items, total })
}
export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const notifiedDate = data.notifiedDate
      ? (data.notifiedDate.includes('T') ? new Date(data.notifiedDate) : new Date(data.notifiedDate+'T00:00:00.000Z'))
      : new Date()
    const item = await prisma.stockClose.create({ data:{...data,notifiedDate,createdBy:session.userId} })
    return successResponse(item, 201)
  } catch(e:unknown) {
    if(e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง',422)
    return errorResponse('เกิดข้อผิดพลาด',500)
  }
}
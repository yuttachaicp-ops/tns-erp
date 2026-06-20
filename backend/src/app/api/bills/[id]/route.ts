export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const schema = z.object({
  name: z.string().optional(),
  amount: z.number().positive().optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  category: z.string().optional(),
  note: z.string().optional(),
}).passthrough()

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  try {
    const data = schema.parse(await req.json())
    const updateData: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(data)) {
      if (k !== 'id' && v !== null && v !== undefined) updateData[k] = v
    }
    const item = await prisma.bill.update({ where: { id: params.id }, data: updateData })
    return successResponse(item)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง', 422)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return PUT(req, { params })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  try {
    await prisma.bill.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch { return errorResponse('เกิดข้อผิดพลาด', 500) }
}
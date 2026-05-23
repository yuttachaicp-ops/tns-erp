import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getAuthUser, successResponse, errorResponse, logActivity } from '@/lib/api-helpers'
import { z } from 'zod'

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
})

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  if (session.role !== 'ADMIN') return errorResponse('ไม่มีสิทธิ์', 403)

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return successResponse(users)
}

export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  if (session.role !== 'ADMIN') return errorResponse('ไม่มีสิทธิ์', 403)

  try {
    const body = await req.json()
    const { email, password, name, role } = createSchema.parse(body)

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return errorResponse('อีเมลนี้ถูกใช้แล้ว', 409)

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    })
    await logActivity(session.userId, 'CREATE', 'USERS', `สร้างผู้ใช้: ${user.name}`)
    return successResponse(user, 201)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง', 422)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

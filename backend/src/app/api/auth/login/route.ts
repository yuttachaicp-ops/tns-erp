export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { successResponse, errorResponse, logActivity } from '@/lib/api-helpers'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      return errorResponse('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401)
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return errorResponse('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401)

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    await logActivity(user.id, 'LOGIN', 'AUTH', `${user.name} เข้าสู่ระบบ`)

    const response = successResponse({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })

    response.headers.set(
      'Set-Cookie',
      `tns-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    )
    return response
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง', 422)
    return errorResponse('เกิดข้อผิดพลาด', 500)
  }
}

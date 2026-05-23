import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { getTokenFromHeader, verifyToken, JWTPayload } from './auth'

export function successResponse(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status })
}

export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const token =
    getTokenFromHeader(req.headers.get('Authorization')) ||
    req.cookies.get('tns-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function logActivity(
  userId: string,
  action: string,
  module: string,
  detail?: string,
  ipAddress?: string
) {
  try {
    await prisma.activityLog.create({
      data: { userId, action, module, detail, ipAddress },
    })
  } catch {
    // non-blocking
  }
}

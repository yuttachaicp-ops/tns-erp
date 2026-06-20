export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api-helpers'

export async function POST(_req: NextRequest) {
  const response = successResponse({ message: 'ออกจากระบบสำเร็จ' })
  response.headers.set('Set-Cookie', 'tns-token=; Path=/; HttpOnly; Max-Age=0')
  return response
}

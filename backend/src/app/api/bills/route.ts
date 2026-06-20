export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
const schema = z.object({ name: z.string().min(1), amount: z.number().positive(), dueDay: z.number().int().min(1).max(31), category: z.string().default('อื่นๆ'), note: z.string().optional() })
export async function GET(req: NextRequest) {
  const session = await getAuthUser(req); if (!session) return errorResponse('Unauthorized',401)
  const month = new URL(req.url).searchParams.get('month') || new Date().toISOString().slice(0,7)
  const bills = await prisma.bill.findMany({ where:{createdBy:session.userId}, include:{payments:{where:{month}}}, orderBy:{dueDay:'asc'} })
  const items = bills.map(b=>({...b,isPaid:b.payments.length>0,paidAt:b.payments[0]?.paidAt||null}))
  const totalAmount=items.reduce((s,b)=>s+b.amount,0); const paidAmount=items.filter(b=>b.isPaid).reduce((s,b)=>s+b.amount,0)
  return successResponse({items,month,totalAmount,paidAmount,unpaidAmount:totalAmount-paidAmount})
}
export async function POST(req: NextRequest) {
  const session = await getAuthUser(req); if (!session) return errorResponse('Unauthorized',401)
  try { const item=await prisma.bill.create({data:{...schema.parse(await req.json()),createdBy:session.userId}}); return successResponse(item,201) }
  catch(e:unknown){if(e instanceof z.ZodError)return errorResponse('ข้อมูลไม่ถูกต้อง',422);return errorResponse('เกิดข้อผิดพลาด',500)}
}
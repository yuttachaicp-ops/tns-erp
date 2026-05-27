import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
const schema = z.object({ type: z.enum(['INCOME','EXPENSE']), amount: z.number().positive(), category: z.string().min(1), description: z.string().optional(), date: z.string().optional() })
export async function GET(req: NextRequest) {
  const session = await getAuthUser(req); if (!session) return errorResponse('Unauthorized',401)
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month'); const type = searchParams.get('type')
  const where: Record<string,unknown> = { createdBy: session.userId }
  if (type) where.type = type
  if (month) { const s=new Date(`${month}-01T00:00:00.000Z`); const e=new Date(s); e.setMonth(e.getMonth()+1); where.date={gte:s,lt:e} }
  const items = await prisma.transaction.findMany({ where, orderBy:{ date:'desc' } })
  const income = items.filter(i=>i.type==='INCOME').reduce((s,i)=>s+i.amount,0)
  const expense = items.filter(i=>i.type==='EXPENSE').reduce((s,i)=>s+i.amount,0)
  return successResponse({ items, income, expense, balance: income-expense })
}
export async function POST(req: NextRequest) {
  const session = await getAuthUser(req); if (!session) return errorResponse('Unauthorized',401)
  try {
    const body = await req.json(); const data = schema.parse(body)
    const ds = data.date || new Date().toISOString().split('T')[0]
    const date = ds.includes('T') ? new Date(ds) : new Date(ds+'T00:00:00.000Z')
    const item = await prisma.transaction.create({ data:{...data,date,createdBy:session.userId} })
    return successResponse(item,201)
  } catch(e:unknown) { if(e instanceof z.ZodError) return errorResponse('ข้อมูลไม่ถูกต้อง',422); return errorResponse('เกิดข้อผิดพลาด',500) }
}
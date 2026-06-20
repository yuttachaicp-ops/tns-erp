export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
const schema = z.object({
  productName: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  platform: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  reason: z.string().optional(),
  status: z.string().optional(),
  notifiedDate: z.string().optional(),
  note: z.string().optional(),
}).passthrough()
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req)
  if (!session) return errorResponse('Unauthorized', 401)
  try {
    const data = schema.parse(await req.json())
    const u: Record<string,unknown> = {}
    for (const [k,v] of Object.entries(data)) {
      if (k==='id'||v===null||v===undefined) continue
      if (k==='notifiedDate') { const d=v as string; u.notifiedDate=d.includes('T')?new Date(d):new Date(d+'T00:00:00.000Z') }
      else u[k]=v
    }
    return successResponse(await prisma.stockClose.update({where:{id:params.id},data:u}))
  } catch(e:unknown){if(e instanceof z.ZodError)return errorResponse('422',422);return errorResponse('500',500)}
}
export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){return PUT(req,{params})}
export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
  const session=await getAuthUser(req);if(!session)return errorResponse('Unauthorized',401)
  try{await prisma.stockClose.delete({where:{id:params.id}});return successResponse({deleted:true})}
  catch{return errorResponse('เกิดข้อผิดพลาด',500)}
}
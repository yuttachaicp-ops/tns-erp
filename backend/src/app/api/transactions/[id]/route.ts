import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
const schema = z.object({ type: z.enum(['INCOME','EXPENSE']).optional(), amount: z.number().positive().optional(), category: z.string().nullish(), description: z.string().nullish(), date: z.string().nullish() }).passthrough()
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthUser(req); if (!session) return errorResponse('Unauthorized',401)
  try {
    const data = schema.parse(await req.json())
    const u: Record<string,unknown> = {...data}; delete u.id
    if (data.date) { const d=data.date as string; u.date=d.includes('T')?new Date(d):new Date(d+'T00:00:00.000Z') }
    return successResponse(await prisma.transaction.update({where:{id:params.id},data:u}))
  } catch(e:unknown){if(e instanceof z.ZodError)return errorResponse('422',422);return errorResponse('500',500)}
}
export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){return PUT(req,{params})}
export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
  const session=await getAuthUser(req);if(!session)return errorResponse('Unauthorized',401)
  try{await prisma.transaction.delete({where:{id:params.id}});return successResponse({deleted:true})}
  catch{return errorResponse('เกิดข้อผิดพลาด',500)}
}
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'
import { z } from 'zod'
const schema = z.object({ name:z.string().optional(), amount:z.number().positive().optional(), dueDay:z.number().int().min(1).max(31).optional(), category:z.string().nullish(), note:z.string().nullish() }).passthrough()
export async function PUT(req:NextRequest,{params}:{params:{id:string}}){
  const session=await getAuthUser(req);if(!session)return errorResponse('Unauthorized',401)
  try{const d=schema.parse(await req.json());const u={...d};delete(u as Record<string,unknown>).id;return successResponse(await prisma.bill.update({where:{id:params.id},data:u}))}
  catch(e:unknown){if(e instanceof z.ZodError)return errorResponse('422',422);return errorResponse('500',500)}
}
export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){return PUT(req,{params})}
export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
  const session=await getAuthUser(req);if(!session)return errorResponse('Unauthorized',401)
  try{await prisma.bill.delete({where:{id:params.id}});return successResponse({deleted:true})}catch{return errorResponse('500',500)}
}
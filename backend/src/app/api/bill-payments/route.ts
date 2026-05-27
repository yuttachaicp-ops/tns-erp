import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-helpers'
export async function POST(req:NextRequest){
  const session=await getAuthUser(req);if(!session)return errorResponse('Unauthorized',401)
  try{const{billId,month}=await req.json();const p=await prisma.billPayment.upsert({where:{billId_month:{billId,month}},create:{billId,month,createdBy:session.userId},update:{paidAt:new Date()}});return successResponse(p)}
  catch{return errorResponse('เกิดข้อผิดพลาด',500)}
}
export async function DELETE(req:NextRequest){
  const session=await getAuthUser(req);if(!session)return errorResponse('Unauthorized',401)
  try{const{billId,month}=await req.json();await prisma.billPayment.delete({where:{billId_month:{billId,month}}});return successResponse({deleted:true})}
  catch{return errorResponse('เกิดข้อผิดพลาด',500)}
}
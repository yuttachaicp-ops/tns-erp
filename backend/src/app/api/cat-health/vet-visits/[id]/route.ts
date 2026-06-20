export const dynamic = 'force-dynamic'

import{NextRequest,NextResponse}from 'next/server'
import{prisma}from '@/lib/prisma'
import{jwtVerify}from 'jose'
const S=new TextEncoder().encode(process.env.JWT_SECRET||'tns-secret-key')
async function auth(req:NextRequest){
  try{const{payload}=await jwtVerify(req.headers.get('Authorization')?.replace('Bearer ','')||'',S);return payload as{userId:string}}
  catch{return null}
}
export async function PUT(req:NextRequest,{params}:{params:{id:string}}){
  const u=await auth(req);if(!u)return NextResponse.json({success:false},{status:401})
  const b=await req.json()
  const item=await prisma.catVetVisit.update({where:{id:params.id},data:{
    visitDate:b.visitDate?new Date(b.visitDate):undefined,
    results:b.results||null,bloodValues:b.bloodValues||null,
    additionalDiag:b.additionalDiag||null,medicationChange:b.medicationChange||null,
    cost:b.cost?parseFloat(b.cost):null,note:b.note||null
  }})
  return NextResponse.json({success:true,data:item})
}
export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
  const u=await auth(req);if(!u)return NextResponse.json({success:false},{status:401})
  await prisma.catVetVisit.delete({where:{id:params.id}})
  return NextResponse.json({success:true})
}
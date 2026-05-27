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
  const item=await prisma.catDailyLog.update({where:{id:params.id},data:{
    logDate:b.logDate?new Date(b.logDate):undefined,
    medicine:b.medicine||null,foodIntake:b.foodIntake||null,waterIntake:b.waterIntake||null,
    excretion:b.excretion||null,behavior:b.behavior||null,
    temperature:b.temperature?parseFloat(b.temperature):null,
    weight:b.weight?parseFloat(b.weight):null,
    symptoms:b.symptoms||null,note:b.note||null
  }})
  return NextResponse.json({success:true,data:item})
}
export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
  const u=await auth(req);if(!u)return NextResponse.json({success:false},{status:401})
  await prisma.catDailyLog.delete({where:{id:params.id}})
  return NextResponse.json({success:true})
}
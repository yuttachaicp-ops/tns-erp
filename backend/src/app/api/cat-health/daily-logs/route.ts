import{NextRequest,NextResponse}from 'next/server'
import{prisma}from '@/lib/prisma'
import{jwtVerify}from 'jose'
const S=new TextEncoder().encode(process.env.JWT_SECRET||'tns-secret-key')
async function auth(req:NextRequest){
  try{const{payload}=await jwtVerify(req.headers.get('Authorization')?.replace('Bearer ','')||'',S);return payload as{userId:string}}
  catch{return null}
}
export async function GET(req:NextRequest){
  const u=await auth(req);if(!u)return NextResponse.json({success:false},{status:401})
  const{searchParams}=new URL(req.url)
  const month=searchParams.get('month')||new Date().toISOString().slice(0,7)
  const start=new Date(`${month}-01`);const end=new Date(start);end.setMonth(end.getMonth()+1)
  const items=await prisma.catDailyLog.findMany({where:{userId:u.userId,logDate:{gte:start,lt:end}},orderBy:{logDate:'desc'}})
  return NextResponse.json({success:true,data:items})
}
export async function POST(req:NextRequest){
  const u=await auth(req);if(!u)return NextResponse.json({success:false},{status:401})
  const b=await req.json()
  const item=await prisma.catDailyLog.create({data:{
    userId:u.userId,logDate:b.logDate?new Date(b.logDate):new Date(),
    medicine:b.medicine||null,foodIntake:b.foodIntake||null,waterIntake:b.waterIntake||null,
    excretion:b.excretion||null,behavior:b.behavior||null,
    temperature:b.temperature?parseFloat(b.temperature):null,
    weight:b.weight?parseFloat(b.weight):null,
    symptoms:b.symptoms||null,note:b.note||null
  }})
  return NextResponse.json({success:true,data:item})
}
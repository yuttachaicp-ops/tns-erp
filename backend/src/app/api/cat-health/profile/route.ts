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
  const p=await prisma.catProfile.findUnique({where:{userId:u.userId}})
  return NextResponse.json({success:true,data:p})
}
export async function PUT(req:NextRequest){
  const u=await auth(req);if(!u)return NextResponse.json({success:false},{status:401})
  const b=await req.json()
  const p=await prisma.catProfile.upsert({
    where:{userId:u.userId},
    update:{name:b.name||'',age:b.age||null,gender:b.gender||null,breed:b.breed||null,weight:b.weight?parseFloat(b.weight):null,diagnosis:b.diagnosis||null,clinic:b.clinic||null,doctor:b.doctor||null},
    create:{userId:u.userId,name:b.name||'',age:b.age||null,gender:b.gender||null,breed:b.breed||null,weight:b.weight?parseFloat(b.weight):null,diagnosis:b.diagnosis||null,clinic:b.clinic||null,doctor:b.doctor||null}
  })
  return NextResponse.json({success:true,data:p})
}
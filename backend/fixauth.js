var fs=require('fs');
var files=['src/app/api/cat-health/vaccinations/route.ts','src/app/api/cat-health/vaccinations/[id]/route.ts'];
files.forEach(function(p){
  var c=fs.readFileSync(p,'utf8');
  c=c.replace("import { requireAuth } from '@/lib/auth'","import { verifyToken, getTokenFromHeader } from '@/lib/auth'");
  c=c.replace(/const user = await requireAuth\(req\)\s*\n\s*if \(!user\) return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\)/g,
    'const token=getTokenFromHeader(req.headers.get("Authorization"))\n  const user=await verifyToken(token||"")\n  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})');
  fs.writeFileSync(p,c,'utf8');
  console.log('fixed:'+p);
});

var fs=require('fs');
var p='src/app/api/cat-health/daily-logs/route.ts';
var c=fs.readFileSync(p,'utf8');
c=c.replace('userId:u.userId,logDate:b.logDate','catId:b.catId,userId:u.userId,logDate:b.logDate');
fs.writeFileSync(p,c,'utf8');
console.log('done');

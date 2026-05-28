var fs=require('fs');
var files=['src/app/api/cat-health/vaccinations/route.ts','src/app/api/cat-health/vaccinations/[id]/route.ts'];
files.forEach(function(p){var c=fs.readFileSync(p,'utf8');c=c.replace(/user\.id/g,'user.userId');fs.writeFileSync(p,c,'utf8');console.log('fixed:'+p);});

var fs=require('fs');
var c=fs.readFileSync('src/app/personal/cat-health/page.tsx','utf8');
fs.writeFileSync('src/app/personal/cat-health/page.tsx',c,'utf8');
console.log('rewritten, size='+c.length);

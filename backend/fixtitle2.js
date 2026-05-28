var fs=require('fs');
var p='src/app/personal/cat-health/page.tsx';
var c=fs.readFileSync(p,'utf8');
c=c.replace(/title="[^"]*"/,'title="Cat Health"');
fs.writeFileSync(p,c,'utf8');
console.log('done');

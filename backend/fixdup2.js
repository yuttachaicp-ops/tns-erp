var fs=require('fs');
var p='src/app/personal/cat-health/page.tsx';
var c=fs.readFileSync(p,'utf8');
c=c.replace("breathRate: '', breathRate: ''","breathRate: ''");
fs.writeFileSync(p,c,'utf8');
console.log('done');

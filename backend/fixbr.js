var fs=require('fs');
var p='src/app/personal/cat-health/page.tsx';
var c=fs.readFileSync(p,'utf8');
c=c.replace('symptom: string; note: string }','symptom: string; note: string; breathRate: string }');
c=c.replace("symptom: '', note: ''","symptom: '', note: '', breathRate: ''");
fs.writeFileSync(p,c,'utf8');
console.log('done');

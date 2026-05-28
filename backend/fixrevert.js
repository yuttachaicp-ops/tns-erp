var fs=require('fs');
var p='src/app/personal/cat-health/page.tsx';
var c=fs.readFileSync(p,'utf8');
c=c.replace(/import dynamic.*\nconst AppShell[^\n]*/,'');
c=c.replace("import AppShell from '@/components/layout/AppShell'\n",'''');
c=c.replace('<AppShell>','<div>');
c=c.replace('</AppShell>','</div>');
fs.writeFileSync(p,c,'utf8');
console.log('done');

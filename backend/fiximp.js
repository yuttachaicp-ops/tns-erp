var fs=require('fs');
var p='src/app/personal/cat-health/page.tsx';
var c=fs.readFileSync(p,'utf8');
c=c.replace("import AppShell from '@/components/layout/AppShell'","import dynamic from 'next/dynamic'\nconst AppShell=dynamic(()=>import('@/components/layout/AppShell'),{ssr:false})");
fs.writeFileSync(p,c,'utf8');
console.log('done');

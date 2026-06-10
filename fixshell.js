var fs=require('fs');
var p='backend/src/app/personal/cat-health/page.tsx';
var c=fs.readFileSync(p,'utf8');
c=c.replace("import Header from '@/components/layout/Header'","import Header from '@/components/layout/Header'\nimport AppShell from '@/components/layout/AppShell'");
c=c.replace("<div style={{ minHeight: '100vh', background: '#f8f9fa' }}>","<AppShell>");
c=c.replace("<Header title=\"?????????\" />\n      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>","<Header title=\"?? ?????????\" />\n      <div style={{ padding: '24px', flex: 1 }}>\n        <div style={{ maxWidth: 900, margin: '0 auto' }}>");
var lines=c.split('\n');
for(var i=lines.length-1;i>=0;i--){if(lines[i].trim()==='</div>'){lines[i]='      </div>\n    </div>\n  </AppShell>';break;}}
c=lines.join('\n');
fs.writeFileSync(p,c,'utf8');
console.log('done');

var fs=require('fs');
var p='src/app/personal/cat-health/page.tsx';
var lines=fs.readFileSync(p,'utf8').split('\n');
lines=lines.filter(function(l){return l.indexOf('dynamic')===-1&&l.indexOf('AppShell')===-1;});
fs.writeFileSync(p,lines.join('\n'),'utf8');
console.log('done, lines='+lines.length);

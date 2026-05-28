var fs=require('fs');
var p='src/app/personal/cat-health/page.tsx';
var c=fs.readFileSync(p,'utf8');
c=c.replace(/'([^']*)\r?\n([^']*)'/g, function(m,a,b){return "'"+a.trimEnd()+b.trimStart()+"'";});
fs.writeFileSync(p,c,'utf8');
console.log('Done');

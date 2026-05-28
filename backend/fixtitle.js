var fs=require('fs');
var p='src/app/personal/cat-health/page.tsx';
var c=fs.readFileSync(p,'utf8');
c=c.replace(/title="[^"]*"/,'title="\u{1F43E} \u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E41\u0E21\u0E27"');
fs.writeFileSync(p,c,'utf8');
console.log('done');

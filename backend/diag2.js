var fs=require('fs');
var l=fs.readFileSync('src/app/personal/cat-health/page.tsx','utf8').split('\n');
for(var i=126;i<136;i++)console.log((i+1)+':',JSON.stringify(l[i]));

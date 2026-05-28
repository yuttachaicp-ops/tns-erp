var fs=require('fs');
var p='src/app/personal/cat-health/page.tsx';
var lines=fs.readFileSync(p,'utf8').split('\n');
for(var i=0;i<lines.length;i++){
}
for(var i=lines.length-1;i>=0;i--){
  if(lines[i].trim()===')'){lines.splice(i,0,'    </div>');break;}
}
fs.writeFileSync(p,lines.join('\n'),'utf8');
console.log('done');

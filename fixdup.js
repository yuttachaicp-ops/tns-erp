var fs=require('fs');
var p='backend/prisma/schema.production.prisma';
var c=fs.readFileSync(p,'utf8');
var marker='model CatVaccination {';
var first=c.indexOf(marker);
var second=c.indexOf(marker,first+1);
if(second!==-1){c=c.substring(0,second).trimEnd()+'\n';fs.writeFileSync(p,c,'utf8');console.log('removed duplicate');}
else{console.log('no duplicate found');}

var fs=require('fs');
var p='prisma/schema.prisma';
var c=fs.readFileSync(p,'utf8');
c=c.replace('  catVaccinations CatVaccination[]','  catVaccinations CatVaccination[]\n  cats          Cat[]');
c=c.replace('  userId      String\n  logDate     DateTime','  userId      String\n  catId       String\n  logDate     DateTime');
c=c.replace('  userId           String\n  visitDate        DateTime','  userId           String\n  catId            String\n  visitDate        DateTime');
c=c.replace('  userId      String\n  vaccineName String','  userId      String\n  catId       String\n  vaccineName String');
fs.writeFileSync(p,c,'utf8');
console.log('schema updated');

const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
let result = [];

fs.readdir('./threads_json/', function(err, items) {
   for (var i=0; i<items.length; i++) {
      result = result.concat(JSON.parse(fs.readFileSync('./threads_json/'+items[i], 'utf8')));
   }
   fs.writeFile('./fullData.json', JSON.stringify(result), ()=>{console.log(arguments)});
   const parser = new Json2csvParser(['caption', 'link', 'author', 'text']);
   const csv = parser.parse(result);
   fs.writeFile('./fullData.csv', csv, ()=>{console.log(arguments)});
});



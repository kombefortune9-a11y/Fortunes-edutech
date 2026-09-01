const fs = require('fs');

let content = fs.readFileSync('./src/constants.ts', 'utf8');

content = content.replace(/<center>\s*<h1.*?MINISTRY OF EDUCATION<\/h1>\s*<h2.*?>\{school\}<\/h2>\s*<\/center>/g, 
`<center>
  <h1 style="margin: 0; padding: 0; font-size: 18pt; font-weight: bold;">MINISTRY OF EDUCATION</h1>
  <h2 style="margin: 5px 0; padding: 0; font-size: 16pt; font-weight: bold;">{district} DISTRICT</h2>
  <h3 style="margin: 5px 0; padding: 0; font-size: 14pt; font-weight: bold;">{school}</h3>
</center>`);

content = content.replace(/<center>\s*# MINISTRY OF EDUCATION\s*## \{school\}\s*<\/center>/g,
`<center>
  <h1 style="margin: 0; padding: 0; font-size: 18pt; font-weight: bold;">MINISTRY OF EDUCATION</h1>
  <h2 style="margin: 5px 0; padding: 0; font-size: 16pt; font-weight: bold;">{district} DISTRICT</h2>
  <h3 style="margin: 5px 0; padding: 0; font-size: 14pt; font-weight: bold;">{school}</h3>
</center>`);

fs.writeFileSync('./src/constants.ts', content);
console.log('done updating headers');

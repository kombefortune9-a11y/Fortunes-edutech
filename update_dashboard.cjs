const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
  /"4\. Form 4"/,
  '"4. Form 4",\n                      "5. Form 5 (A Level)",\n                      "6. Form 6 (A Level)"'
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log("Updated Dashboard");

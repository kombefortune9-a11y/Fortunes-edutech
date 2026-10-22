import fs from 'fs';
const code = fs.readFileSync('src/components/DocPreview.tsx', 'utf8');

const target1 = `    if (isOralLiteracyCombined) {
      wfTableFontSize = "9.5pt";
      wfTableTdFontSize = "9.5pt";
      wfTableThFontSize = "8.5pt";
      wfTablePadding = "1px 2px";
      wfLineHeight = "1.1";
      wfHeaderTitleSize = "11pt";
      wfHeaderSubSize = "9.5pt";`;

const replacement1 = `    if (isOralLiteracyCombined) {
      wfTableFontSize = "10.5pt";
      wfTableTdFontSize = "10.5pt";
      wfTableThFontSize = "9pt";
      wfTablePadding = "1.5px 2px";
      wfLineHeight = "1.15";
      wfHeaderTitleSize = "12pt";
      wfHeaderSubSize = "10pt";`;

const target2 = `    } else {
      wfTableFontSize = "10.5pt";
      wfTableTdFontSize = "10.5pt";
      wfTableThFontSize = "9.5pt";
      wfTablePadding = "1.8px 2.5px";
      wfLineHeight = "1.12";
      wfHeaderTitleSize = "12pt";
      wfHeaderSubSize = "10.5pt";`;

const replacement2 = `    } else {
      wfTableFontSize = "12pt";
      wfTableTdFontSize = "12pt";
      wfTableThFontSize = "10pt";
      wfTablePadding = "2.5px 3.5px";
      wfLineHeight = "1.25";
      wfHeaderTitleSize = "14pt";
      wfHeaderSubSize = "12pt";`;

let updated = code.replace(target1, replacement1);
updated = updated.replace(target2, replacement2);
fs.writeFileSync('src/components/DocPreview.tsx', updated);
console.log(updated !== code ? "Replaced!" : "Not found!");

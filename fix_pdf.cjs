const fs = require('fs');

// Fix AssessmentTracker.tsx
let atContent = fs.readFileSync('src/components/AssessmentTracker.tsx', 'utf8');

const newAtHandle = `const handleDownloadPDF = async (targetType: PdfExportType = 'active') => {
    if (!checkDownloadAccess()) return;
    toast.success("To download a selectable PDF, please choose 'Save as PDF' in the print dialog.", { duration: 5000 });
    setTimeout(() => {
      triggerInstantPrint(targetType);
    }, 1500);
  };`;

atContent = atContent.replace(/const handleDownloadPDF = async \(targetType: PdfExportType = 'active'\) => \{[\s\S]*?(?=const handleDownloadWord)/, newAtHandle + '\n\n  ');

fs.writeFileSync('src/components/AssessmentTracker.tsx', atContent);

// Fix ReceiptManager.tsx
let rmContent = fs.readFileSync('src/components/ReceiptManager.tsx', 'utf8');

const newRmHandle = `const handleDownloadPDF = async (receipt: ReceiptData) => {
    toast.success("To download a selectable PDF, please choose 'Save as PDF' in the print dialog.", { duration: 5000 });
    setTimeout(() => {
      handlePrint(receipt);
    }, 1500);
  };`;

rmContent = rmContent.replace(/const handleDownloadPDF = async \(receipt: ReceiptData\) => \{[\s\S]*?(?=const handlePrint)/, newRmHandle + '\n\n  ');

fs.writeFileSync('src/components/ReceiptManager.tsx', rmContent);
console.log("PDF download handlers rewritten.");

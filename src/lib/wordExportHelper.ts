import { saveAs } from "file-saver";

export interface WordExportOptions {
  metadata?: {
    type?: string;
    curriculumType?: string;
    grade?: string;
    subject?: string;
    term?: string;
    topic?: string;
    subtopic?: string;
    teacherName?: string;
    tsNumber?: string;
    schoolName?: string;
    district?: string;
    year?: string | number;
    isCombined?: boolean;
    [key: string]: any;
  };
  isLandscape?: boolean;
  title?: string;
}

/**
 * Builds a clean, bulletproof Word document (HTML with standard Office headers)
 * that renders perfectly across Microsoft Word, WPS Office (Android/iOS),
 * Google Docs, and LibreOffice without creating black boxes or distorted columns.
 */
export function buildWordDocumentHtml(
  rawHtml: string,
  options: WordExportOptions = {}
): string {
  const docType = options.metadata?.type || "schemes_of_work";
  const isLandscape =
    options.isLandscape !== undefined
      ? options.isLandscape
      : docType === "schemes_of_work" || docType === "weekly_forecast";

  // 1. Clean HTML by handling page breaks cleanly
  let cleanHtml = rawHtml;
  cleanHtml = cleanHtml.replace(
    /<div class="page-break"[^>]*><\/div>/gi,
    '<br clear="all" style="mso-special-character:line-break;page-break-before:always">'
  );
  cleanHtml = cleanHtml.replace(
    /class="[^"]*page-break[^"]*"/gi,
    'style="page-break-before:always; mso-special-character:line-break;"'
  );

  const docTitle =
    options.title ||
    options.metadata?.topic ||
    options.metadata?.subject ||
    "Fortunes EduTech Document";

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: ${isLandscape ? "11.0in 8.5in" : "8.5in 11.0in"};
      margin: 0.5in 0.5in 0.5in 0.5in;
      mso-header-margin: 0.3in;
      mso-footer-margin: 0.3in;
      mso-paper-source: 0;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.2;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1 {
      text-align: center;
      font-size: 15pt;
      font-weight: bold;
      color: #000000;
      margin: 4pt 0 2pt 0;
      text-transform: uppercase;
    }
    h2 {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      color: #000000;
      margin: 4pt 0 2pt 0;
      text-transform: uppercase;
    }
    h3 {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      color: #000000;
      margin: 4pt 0 4pt 0;
      text-transform: uppercase;
    }
    p {
      margin: 2pt 0;
      font-size: 10pt;
      color: #000000;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      border: 1pt solid #000000;
      margin: 6pt 0 8pt 0;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    th, td {
      border: 1pt solid #000000;
      padding: 4pt 5pt;
      text-align: left;
      vertical-align: top;
      font-size: 9pt;
      color: #000000;
      line-height: 1.18;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
      font-size: 9.5pt;
      text-align: center;
    }
    ul, ol {
      margin: 2pt 0 4pt 16pt;
      padding: 0;
    }
    li {
      margin-bottom: 2pt;
      font-size: 9pt;
      line-height: 1.2;
    }
    .hide-in-export, .no-print, [data-no-export], button, svg, .animate-spin {
      display: none !important;
    }

    /* Schemes of work column ratios for standard Word table rendering */
    .doc-type-schemes_of_work table th:nth-child(1), .doc-type-schemes_of_work table td:nth-child(1) { width: 5.5%; text-align: center; }
    .doc-type-schemes_of_work table th:nth-child(2), .doc-type-schemes_of_work table td:nth-child(2) { width: 8.5%; }
    .doc-type-schemes_of_work table th:nth-child(3), .doc-type-schemes_of_work table td:nth-child(3) { width: 8.5%; }
    .doc-type-schemes_of_work table th:nth-child(4), .doc-type-schemes_of_work table td:nth-child(4) { width: 18%; }
    .doc-type-schemes_of_work table th:nth-child(5), .doc-type-schemes_of_work table td:nth-child(5) { width: 9%; }
    .doc-type-schemes_of_work table th:nth-child(6), .doc-type-schemes_of_work table td:nth-child(6) { width: 27%; }
    .doc-type-schemes_of_work table th:nth-child(7), .doc-type-schemes_of_work table td:nth-child(7) { width: 7.5%; }
    .doc-type-schemes_of_work table th:nth-child(8), .doc-type-schemes_of_work table td:nth-child(8) { width: 8%; }
    .doc-type-schemes_of_work table th:nth-child(9), .doc-type-schemes_of_work table td:nth-child(9) { width: 8%; }

    /* Lesson plan column ratios & typography */
    .doc-type-lesson_plan h1, .doc-type-lesson_plan h2, .doc-type-lesson_plan h3 { font-size: 12pt !important; font-weight: bold !important; margin: 2pt 0; }
    .doc-type-lesson_plan table th { font-size: 11.5pt !important; font-weight: bold !important; padding: 4pt 5pt !important; }
    .doc-type-lesson_plan table td { font-size: 11.8pt !important; padding: 4pt 5pt !important; line-height: 1.35 !important; }
    .doc-type-lesson_plan table th:nth-child(1), .doc-type-lesson_plan table td:nth-child(1) { width: 10%; text-align: center; }
    .doc-type-lesson_plan table th:nth-child(2), .doc-type-lesson_plan table td:nth-child(2) { width: 42%; }
    .doc-type-lesson_plan table th:nth-child(3), .doc-type-lesson_plan table td:nth-child(3) { width: 33%; }
    .doc-type-lesson_plan table th:nth-child(4), .doc-type-lesson_plan table td:nth-child(4) { width: 15%; }
  </style>
</head>
<body>
  ${cleanHtml}
</body>
</html>
  `.trim();
}

/**
 * Downloads Word document Blob reliably across mobile and desktop browsers.
 */
export function downloadWordBlob(
  htmlContent: string,
  fileName: string,
  options: WordExportOptions = {}
): { blob: Blob; success: boolean } {
  const fullHtml = buildWordDocumentHtml(htmlContent, options);

  // Use UTF-8 BOM blob with standard Word MIME type
  const blob = new Blob(["\ufeff", fullHtml], {
    type: "application/msword;charset=utf-8",
  });

  const downloadName = fileName.endsWith(".doc") ? fileName : `${fileName}.doc`;
  let success = false;

  try {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = downloadName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    }, 500);

    success = true;
  } catch (e) {
    try {
      saveAs(blob, downloadName);
      success = true;
    } catch (saveErr) {
      console.error("Failed to save Word document:", saveErr);
      success = false;
    }
  }

  return { blob, success };
}

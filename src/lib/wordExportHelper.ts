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
    .general-info-table,
    table.general-info-table {
      width: 100% !important;
      border-collapse: collapse !important;
      border-top: 1.5pt solid #000000 !important;
      border-bottom: 1.5pt solid #000000 !important;
      border-left: none !important;
      border-right: none !important;
      margin: 3pt 0 5pt 0 !important;
    }
    .general-info-table tr,
    table.general-info-table tr {
      border: none !important;
    }
    .general-info-table td,
    .general-info-table th,
    table.general-info-table td,
    table.general-info-table th {
      border: none !important;
      padding: 1.5pt 2pt !important;
      font-size: 8pt !important;
      line-height: 1.25 !important;
      vertical-align: middle !important;
      color: #000000 !important;
      white-space: nowrap !important;
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

    /* Schemes of work column ratios for standard 9-column CBC table rendering */
    .doc-type-schemes_of_work table { font-size: 12pt !important; }
    .doc-type-schemes_of_work table td { font-size: 12pt !important; padding: 4pt 5pt !important; line-height: 1.3 !important; }
    .doc-type-schemes_of_work table th { font-size: 9pt !important; font-weight: bold !important; padding: 3pt 2pt !important; }
    .doc-type-schemes_of_work table th:nth-child(1), .doc-type-schemes_of_work table td:nth-child(1) { width: 5.5%; text-align: center; }
    .doc-type-schemes_of_work table th:nth-child(2), .doc-type-schemes_of_work table td:nth-child(2) { width: 8.5%; }
    .doc-type-schemes_of_work table th:nth-child(3), .doc-type-schemes_of_work table td:nth-child(3) { width: 8.5%; }
    .doc-type-schemes_of_work table th:nth-child(4), .doc-type-schemes_of_work table td:nth-child(4) { width: 17.5%; }
    .doc-type-schemes_of_work table th:nth-child(5), .doc-type-schemes_of_work table td:nth-child(5) { width: 9.5%; }
    .doc-type-schemes_of_work table th:nth-child(6), .doc-type-schemes_of_work table td:nth-child(6) { width: 27.5%; }
    .doc-type-schemes_of_work table th:nth-child(7), .doc-type-schemes_of_work table td:nth-child(7) { width: 7.5%; }
    .doc-type-schemes_of_work table th:nth-child(8), .doc-type-schemes_of_work table td:nth-child(8) { width: 8%; }
    .doc-type-schemes_of_work table th:nth-child(9), .doc-type-schemes_of_work table td:nth-child(9) { width: 8%; }

    /* Schemes of work 10-column CBC table (CBC with COMPONENT) */
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(1), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(1) { width: 4.5%; text-align: center; }
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(2), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(2) { width: 7.5%; }
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(3), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(3) { width: 8%; }
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(4), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(4) { width: 8%; }
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(5), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(5) { width: 14.5%; }
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(6), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(6) { width: 9%; }
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(7), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(7) { width: 26.5%; }
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(8), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(8) { width: 7%; }
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(9), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(9) { width: 7%; }
    .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(10), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(10) { width: 8%; }

    /* Schemes of work 10-column OBC table (WEEK, TOPIC, SUBTOPIC, SPECIFIC OUTCOMES, KNOWLEDGE, SKILLS, VALUES, TEACHING METHODS, T/L AIDS, REFERENCE) */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(1), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(1),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(1), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(1) { width: 4.5%; text-align: center; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(2), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(2),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(2), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(2) { width: 8%; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(3), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(3),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(3), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(3) { width: 8%; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(4), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(4),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(4), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(4) { width: 19%; } /* SPECIFIC OUTCOMES expanded */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(5), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(5),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(5), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(5) { width: 13%; } /* KNOWLEDGE expanded */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(6), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(6),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(6), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(6) { width: 10%; } /* SKILLS expanded */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(7), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(7),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(7), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(7) { width: 5%; } /* VALUES reduced */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(8), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(8),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(8), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(8) { width: 7.5%; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(9), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(9),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(9), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(9) { width: 7%; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(10), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(10),
    .doc-type-schemes_of_work table:has(th:nth-child(10):not(:nth-child(11))) th:nth-child(10), .doc-type-schemes_of_work table:has(td:nth-child(10):not(:nth-child(11))) td:nth-child(10) { width: 8%; }

    /* Schemes of work 11-column table (OBC Language schemes: WEEK, COMPONENT, TOPIC, SUBTOPIC, SPECIFIC OUTCOMES, KNOWLEDGE, SKILLS, VALUES, TEACHING METHODS, T/L AIDS, REFERENCE) */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(1), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(1),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(1), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(1) { width: 4%; text-align: center; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(2), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(2),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(2), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(2) { width: 7.5%; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(3), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(3),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(3), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(3) { width: 7.5%; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(4), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(4),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(4), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(4) { width: 7.5%; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(5), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(5),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(5), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(5) { width: 18%; } /* SPECIFIC OUTCOMES expanded */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(6), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(6),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(6), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(6) { width: 13%; } /* KNOWLEDGE expanded */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(7), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(7),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(7), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(7) { width: 9.5%; } /* SKILLS expanded */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(8), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(8),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(8), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(8) { width: 4.5%; } /* VALUES reduced */
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(9), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(9),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(9), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(9) { width: 6.5%; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(10), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(10),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(10), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(10) { width: 6.5%; }
    .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(11), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(11),
    .doc-type-schemes_of_work table:has(th:nth-child(11)) th:nth-child(11), .doc-type-schemes_of_work table:has(td:nth-child(11)) td:nth-child(11) { width: 8%; }

    /* Weekly forecast column ratios & font sizing for standard Word table rendering */
    .doc-type-weekly_forecast table { font-size: 11.5pt !important; }
    .doc-type-weekly_forecast table td { font-size: 11.5pt !important; padding: 1.5pt 3pt !important; line-height: 1.08 !important; }
    .doc-type-weekly_forecast table th { font-size: 9.5pt !important; font-weight: bold !important; padding: 1.5pt 2pt !important; }

    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(1), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(1) { width: 4.5%; text-align: center; }
    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(2), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(2) { width: 8%; }
    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(3), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(3) { width: 8%; }
    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(4), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(4) { width: 15%; }
    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(5), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(5) { width: 10.5%; }
    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(6), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(6) { width: 25.5%; }
    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(7), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(7) { width: 6.5%; }
    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(8), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(8) { width: 7%; }
    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(9), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(9) { width: 8%; }
    .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(10), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(10) { width: 7%; }

    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(1), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(1),
    .doc-type-weekly_forecast table th:nth-child(1), .doc-type-weekly_forecast table td:nth-child(1) { width: 3.5%; text-align: center; }
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(2), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(2),
    .doc-type-weekly_forecast table th:nth-child(2), .doc-type-weekly_forecast table td:nth-child(2) { width: 7%; }
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(3), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(3),
    .doc-type-weekly_forecast table th:nth-child(3), .doc-type-weekly_forecast table td:nth-child(3) { width: 7%; }
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(4), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(4),
    .doc-type-weekly_forecast table th:nth-child(4), .doc-type-weekly_forecast table td:nth-child(4) { width: 16%; } /* SPECIFIC OUTCOMES expanded */
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(5), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(5),
    .doc-type-weekly_forecast table th:nth-child(5), .doc-type-weekly_forecast table td:nth-child(5) { width: 13%; } /* KNOWLEDGE expanded */
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(6), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(6),
    .doc-type-weekly_forecast table th:nth-child(6), .doc-type-weekly_forecast table td:nth-child(6) { width: 10%; } /* SKILLS expanded */
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(7), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(7),
    .doc-type-weekly_forecast table th:nth-child(7), .doc-type-weekly_forecast table td:nth-child(7) { width: 4.5%; } /* VALUES reduced */
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(8), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(8),
    .doc-type-weekly_forecast table th:nth-child(8), .doc-type-weekly_forecast table td:nth-child(8) { width: 6.5%; }
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(9), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(9),
    .doc-type-weekly_forecast table th:nth-child(9), .doc-type-weekly_forecast table td:nth-child(9) { width: 6.5%; }
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(10), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(10),
    .doc-type-weekly_forecast table th:nth-child(10), .doc-type-weekly_forecast table td:nth-child(10) { width: 8%; }
    .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(11), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(11),
    .doc-type-weekly_forecast table th:nth-child(11), .doc-type-weekly_forecast table td:nth-child(11) { width: 14.5%; }

    /* Lesson plan column ratios & typography */
    .doc-type-lesson_plan h1, .doc-type-lesson_plan h2, .doc-type-lesson_plan h3 { font-size: 11pt !important; font-weight: bold !important; margin: 2pt 0; }
    .doc-type-lesson_plan b, .doc-type-lesson_plan strong { font-size: 11pt !important; font-weight: bold !important; }
    .doc-type-lesson_plan table th { font-size: 11pt !important; font-weight: bold !important; padding: 4pt 4pt !important; }
    .doc-type-lesson_plan table td { font-size: 11.8pt !important; padding: 4pt 4pt !important; line-height: 1.35 !important; }
    .doc-type-lesson_plan table td:nth-child(1), .doc-type-lesson_plan .stage-cell { font-size: 11pt !important; font-weight: bold !important; }
    /* 5-Column Lesson Plan Table (STAGE, TEACHER'S ACTIVITIES, LEARNERS' ACTIVITIES, CONTENT, ASSESSMENT CRITERIA) */
    .doc-type-lesson_plan table th:nth-child(1), .doc-type-lesson_plan table td:nth-child(1) { width: 11%; text-align: left; }
    .doc-type-lesson_plan table th:nth-child(2), .doc-type-lesson_plan table td:nth-child(2) { width: 25%; }
    .doc-type-lesson_plan table th:nth-child(3), .doc-type-lesson_plan table td:nth-child(3) { width: 25%; }
    .doc-type-lesson_plan table th:nth-child(4), .doc-type-lesson_plan table td:nth-child(4) { width: 24%; }
    .doc-type-lesson_plan table th:nth-child(5), .doc-type-lesson_plan table td:nth-child(5) { width: 15%; }
    /* 4-Column Lesson Plan Table */
    .doc-type-lesson_plan table:not(:has(th:nth-child(5))) th:nth-child(1), .doc-type-lesson_plan table:not(:has(th:nth-child(5))) td:nth-child(1) { width: 12%; }
    .doc-type-lesson_plan table:not(:has(th:nth-child(5))) th:nth-child(2), .doc-type-lesson_plan table:not(:has(th:nth-child(5))) td:nth-child(2) { width: 38%; }
    .doc-type-lesson_plan table:not(:has(th:nth-child(5))) th:nth-child(3), .doc-type-lesson_plan table:not(:has(th:nth-child(5))) td:nth-child(3) { width: 34%; }
    .doc-type-lesson_plan table:not(:has(th:nth-child(5))) th:nth-child(4), .doc-type-lesson_plan table:not(:has(th:nth-child(5))) td:nth-child(4) { width: 16%; }
  </style>
</head>
<body class="doc-type-${docType} curriculum-${options.metadata?.curriculumType || 'CBC'}">
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

  // Use UTF-8 BOM blob with standard Word docx MIME type
  const blob = new Blob(["\ufeff", fullHtml], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8",
  });

  const baseName = fileName.replace(/\.(doc|docx)$/i, "");
  const downloadName = `${baseName}.docx`;
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

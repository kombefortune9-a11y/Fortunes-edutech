import { getDownloadAccessStatus } from "../lib/downloadCheck";
import { safeLocalStorage } from "../lib/storage";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
// Word export doesn't require extra libraries for simple HTML-based .doc files which Word opens perfectly
import { saveAs } from "file-saver";
import { loadHtml2Pdf } from "../lib/pdfLoader";
import { shareOrSavePdfBlob, downloadBlobDirect } from "../lib/pdfShareHelper";
import { buildWordDocumentHtml, downloadWordBlob } from "../lib/wordExportHelper";
import { prepareDocumentForPdfExport, sanitizeClonedDoc } from "../lib/pdfUtils";
import { PdfExportModal } from "./PdfExportModal";
import {
  Download,
  Copy,
  Check,
  ChevronLeft,
  FileText,
  Printer,
  Share2,
  FileCheck,
  FileCode,
  Edit3,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { GenerationParams } from "../services/geminiService";
import { cn } from "../lib/utils";
import { useAuth } from "./FirebaseProvider";
import { isDeveloperEmail } from "../constants";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, recordActivity } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";

interface DocPreviewProps {
  content: string;
  metadata: GenerationParams;
  onBack: () => void;
}

export function DocPreview({ content, metadata, onBack }: DocPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingWord, setGeneratingWord] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [visualHtml, setVisualHtml] = useState<string>("");
  const [hasBeenEdited, setHasBeenEdited] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // AI Quality Feedback States
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackType, setFeedbackType] = useState<'up' | 'down' | null>(null);
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // Sync localContent when content prop changes (e.g. on new generation)
  useEffect(() => {
    setLocalContent(content);
    setVisualHtml("");
    setHasBeenEdited(false);
    setFeedbackSubmitted(false);
    setFeedbackType(null);
    setShowCommentForm(false);
    setFeedbackComment("");
  }, [content]);

  // Handle toggling edit mode
  const handleToggleEdit = () => {
    if (!isEditing) {
      // Starting editing: capture what is currently displayed in the document
      const docEl = document.getElementById("printable-document");
      if (docEl && docEl.innerHTML) {
        setVisualHtml(docEl.innerHTML);
        setHasBeenEdited(true);
      } else if (!visualHtml) {
        setVisualHtml(cleanContent);
        setHasBeenEdited(true);
      }
      setIsEditing(true);
    } else {
      // Finishing / Saving editing
      if (editorRef.current) {
        const newHtml = editorRef.current.innerHTML;
        setVisualHtml(newHtml);
        setLocalContent(newHtml);
        setHasBeenEdited(true);
      }
      setIsEditing(false);
    }
  };

  // Handle visual edit saving
  const handleVisualSave = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setVisualHtml(newHtml);
      setLocalContent(newHtml);
      setHasBeenEdited(true);
      setIsEditing(false);
    }
  };
  const [readyPdfUrl, setReadyPdfUrl] = useState<{
    url: string;
    name: string;
    blob?: Blob;
  } | null>(null);
  const [exportModalState, setExportModalState] = useState<{
    isOpen: boolean;
    blob: Blob | null;
    fileName: string;
    title: string;
    fileType: 'pdf' | 'doc';
  }>({
    isOpen: false,
    blob: null,
    fileName: '',
    title: '',
    fileType: 'pdf',
  });
  const { user, incrementLocalDownloads, subscriptionDetails, downloadRecords } = useAuth();

    const checkDownloadAccess = (): boolean => {
    const status = getDownloadAccessStatus(user, subscriptionDetails);
    if (!status.allowed) {
      toast.error(status.message, {
        id: 'download-access-depleted-toast',
        duration: 8000
      });
      return false;
    }
    return true;
  };

  const handleSaveForSync = async () => {
    if (!checkDownloadAccess()) return;
    if (!user) {
      toast.error("Please log in to save for sync");
      return;
    }

    try {
      // Instantly cache in localStorage so sync is active immediately without waiting
      try {
        const syncItem = {
          id: `sync_${Date.now()}`,
          content: cleanContent,
          metadata: metadata,
          timestamp: { seconds: Math.floor(Date.now() / 1000) },
          isActive: true,
          subject: metadata.subject,
          grade: metadata.grade,
          type: metadata.type
        };
        const existing = safeLocalStorage.getItem('eduplan_active_sync_sources');
        let list = existing ? JSON.parse(existing) : [];
        if (!Array.isArray(list)) list = [];
        list = list.filter((s: any) => !(s.type === metadata.type && s.grade === metadata.grade && s.subject === metadata.subject));
        list.unshift(syncItem);
        safeLocalStorage.setItem('eduplan_active_sync_sources', JSON.stringify(list));
      } catch (cacheErr) {
        console.warn("Sync local cache notice:", cacheErr);
      }

      const syncRef = collection(db, "users", user.uid, "sync_sources");
      await addDoc(syncRef, {
        content: cleanContent,
        metadata: metadata,
        timestamp: serverTimestamp(),
        isActive: true,
        subject: metadata.subject,
        grade: metadata.grade,
        type: metadata.type
      });
      toast.success("Document saved & activated for instant synchronization!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sync_sources`);
    }
  };

  const handleFeedbackSubmit = async (type: 'up' | 'down', commentText: string = "") => {
    if (!user) {
      toast.error("Please log in to submit feedback");
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      const feedbackCol = collection(db, "document_feedback");
      await addDoc(feedbackCol, {
        userUid: user.uid,
        userEmail: user.email || "anonymous_teacher@fortunes.edu",
        feedbackType: type,
        timestamp: serverTimestamp(),
        comment: commentText,
        subject: metadata.subject || "Not Specified",
        grade: metadata.grade || "Not Specified",
        docType: metadata.type || "Not Specified",
        curriculumType: metadata.curriculumType || "Not Specified",
        contentSnippet: cleanContent.slice(0, 500) // snippet for developer to review
      });
      setFeedbackSubmitted(true);
      setFeedbackType(type);
      setShowCommentForm(false);
      toast.success(type === 'up' ? "Thank you for the thumbs up!" : "Feedback submitted successfully. Thank you!");
    } catch (err: any) {
      console.warn("Notice: Document feedback saved locally (quota/offline mode):", err);
      try {
        const stored = safeLocalStorage.getItem('eduplan_offline_feedback');
        const list = stored ? JSON.parse(stored) : [];
        list.push({
          userEmail: user.email || "anonymous_teacher@fortunes.edu",
          feedbackType: type,
          timestamp: new Date().toISOString(),
          comment: commentText,
          subject: metadata.subject || "Not Specified",
          grade: metadata.grade || "Not Specified",
          docType: metadata.type || "Not Specified",
        });
        safeLocalStorage.setItem('eduplan_offline_feedback', JSON.stringify(list));
      } catch (e) {}
      setFeedbackSubmitted(true);
      setFeedbackType(type);
      setShowCommentForm(false);
      toast.success("Feedback received! Thank you for your review.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const isLandscape = (() => {
    const t = (metadata.type || "").toLowerCase();
    return t === "weekly_forecast" || t === "schemes_of_work";
  })();
  const orientationLabel = isLandscape ? "LANDSCAPE" : "PORTRAIT";

  const getSignatureFileName = (extension: string) => {
    const subject = (metadata.subject || "SUBJECT").trim().toUpperCase().replace(/\s+/g, "_");
    let shortType = "DOC";
    const t = (metadata.type || "").toLowerCase();
    if (t === "schemes_of_work") shortType = "SCHEMES";
    else if (t === "weekly_forecast") shortType = "WEEKLY";
    else if (t === "lesson_plan") shortType = "Lesson_P";
    else if (t === "catch_up") shortType = "Lesson_P";
    else if (t === "individual_work_plan") shortType = "IND_WORK_PLAN";
    else if (t === "lesson_notes") shortType = "NOTES";
    else if (t === "video_script") shortType = "VIDEO_SCRIPT";
    else if (t === "assessments") shortType = "ASSESSMENTS";
    else if (t === "syllabi") shortType = "SYLLABUS";

    return `FORTUNES_EDUTECH_${subject}_${shortType}.${extension}`;
  };

  // Clean content - strip triple backticks and ensure markdown tables have proper spacing
  const cleanContent = (() => {
    let text = localContent || "";

    // Globally strip markdown code block backticks completely to allow rendering the raw HTML inside
    text = text.replace(/```html\s*/gi, "");
    text = text.replace(/```markdown\s*/gi, "");
    text = text.replace(/```\s*/g, "");

    // Convert any escaped HTML tags (e.g., &lt;b&gt; or &lt;div&gt;) back to actual HTML tags
    text = text.replaceAll("&lt;", "<")
               .replaceAll("&gt;", ">")
               .replaceAll("&quot;", '"')
               .replaceAll("&#39;", "'")
               .replaceAll("&amp;lt;", "<")
               .replaceAll("&amp;gt;", ">");

    // CRITICAL: Strip leading whitespace on any line starting with an HTML tag to prevent ReactMarkdown/rehype from rendering it as an indented code block
    text = text.replace(/^\s*(<\/?[a-zA-Z1-6]+(?:\s+[^>]*)?>)/gm, "$1");

    // LITERACY IN ENGLISH LESSON PLAN FORMATTING ENFORCEMENT:
    // Ensure INTRODUCTION section is outside the table, between EXPECTED STANDARD and LESSON DEVELOPMENT, and not in the table
    if (metadata?.type === "lesson_plan") {
      const sLowMeta = (metadata.subject || '').toLowerCase();
      const isLiteracy = (sLowMeta.includes('literacy') || (metadata as any).englishComponent === 'literacy') && !sLowMeta.includes('oral');
      if (isLiteracy) {
        let extractedTeacher = "";
        let extractedLearners = "";

        // Check if Introduction exists inside HTML <tr> table row
        const introTrRegex = /<tr[^>]*>\s*<td[^>]*>\s*(?:<b>)?\s*INTRODUCTION\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<\/tr>/i;
        const introTrMatch = text.match(introTrRegex);
        if (introTrMatch) {
          extractedTeacher = introTrMatch[1].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          extractedLearners = introTrMatch[2].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          text = text.replace(introTrRegex, '');
        }

        // Check if Introduction exists inside markdown table row
        const introTableRowRegex = /\|\s*(?:<b>)?\s*Introduction.*?(?:<\/b>)?\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|[ \t]*\r?\n?/i;
        const introMatch = text.match(introTableRowRegex);
        if (introMatch) {
          if (!extractedTeacher) extractedTeacher = introMatch[1].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          if (!extractedLearners) extractedLearners = introMatch[2].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          text = text.replace(introTableRowRegex, '');
        }

        // If INTRODUCTION is not already present outside the table:
        if (!text.match(/<b>\s*INTRODUCTION[\s\S]*?(?:LESSON DEVELOPMENT|<table|\|[ \t]*STAGE)/i)) {
          const introBlock = `\n<div style="margin-top: 15px; margin-bottom: 15px; line-height: 1.6;">\n<b>INTRODUCTION (5 minutes):</b><br/>\n* <b>Teacher to:</b> ${extractedTeacher || 'review previously taught sounds, show cards with taught graphemes, and introduce the target sound/concept.'}<br/>\n* <b>Learners will:</b> ${extractedLearners || 'sound out given graphemes, listen to words, mention common sound, and focus on the target sound/concept.'}<br/>\n</div>\n`;

          if (text.match(/<b>EXPECTED STANDARD:<\/b>[\s\S]*?<\/div>/i)) {
            text = text.replace(/(<b>EXPECTED STANDARD:<\/b>[\s\S]*?<\/div>)/i, `$1\n${introBlock}`);
          } else if (text.match(/<b>EXPECTED STANDARD:<\/b>.*?(?:<br\s*\/?>|\n)/i)) {
            text = text.replace(/(<b>EXPECTED STANDARD:<\/b>.*?(?:<br\s*\/?>|\n))/i, `$1\n${introBlock}`);
          } else if (text.match(/EXPECTED STANDARD:.*?(?:<br\s*\/?>|\n)/i)) {
            text = text.replace(/(EXPECTED STANDARD:.*?(?:<br\s*\/?>|\n))/i, `$1\n${introBlock}`);
          } else if (text.match(/(?:<h3[^>]*>|<b>)LESSON DEVELOPMENT/i)) {
            text = text.replace(/((?:<h3[^>]*>|<b>)LESSON DEVELOPMENT)/i, `${introBlock}\n$1`);
          }
        }
      }
    }

    // Ensure blank line BEFORE the table starts (but NOT between table rows)
    // We only want to add a blank line if the previous line doesn't start with a pipe
    text = text.replace(/(^|\n)([^|\n\s][^\n]*)\n(\s*\|)/g, "$1$2\n\n$3");

    // Sometimes the AI might output |:---|:---| (missing leading/trailing pipes in alignment row)
    // We should ensure that if a line looks like an alignment row, it has leading/trailing pipes
    text = text.replace(/^(\s*):-+(|:|-)+(\s*)$/gm, "|$1$2$3|");

    // CRITICAL TABLE REPAIR PASS: Ensure markdown table rows are contiguous and cells do not contain unescaped raw newlines.
    // This prevents table rows like 'Comprehension' or 'Conclusion' from dropping out of the table into raw text.
    const textLines = text.split('\n');
    const fixedLines: string[] = [];
    let inTable = false;

    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      const trimmed = line.trim();

      const startsWithPipe = trimmed.startsWith("|");

      if (startsWithPipe) {
        inTable = true;
        // If line starts with pipe but doesn't end with pipe, ensure it closes properly
        if (!trimmed.endsWith("|") && i + 1 < textLines.length) {
          fixedLines.push(trimmed + " |");
        } else {
          fixedLines.push(trimmed);
        }
      } else if (inTable) {
        if (trimmed === "") {
          // Check if the next non-empty line starts with a pipe
          let nextIdx = i + 1;
          while (nextIdx < textLines.length && textLines[nextIdx].trim() === "") {
            nextIdx++;
          }
          if (nextIdx < textLines.length && textLines[nextIdx].trim().startsWith("|")) {
            // Skip this blank line inside the table to keep rows contiguous
            continue;
          } else {
            inTable = false;
            fixedLines.push(line);
          }
        } else if (
          trimmed.startsWith("<b>HOMEWORK") ||
          trimmed.startsWith("<b>LESSON EVALUATION") ||
          trimmed.startsWith("<b>TEACHER EVALUATION") ||
          trimmed.startsWith("<b>LEARNER EVALUATION") ||
          trimmed.startsWith("<div class=\"lesson-plan-homework-section") ||
          trimmed.startsWith("#") ||
          trimmed.startsWith("<div") ||
          trimmed.startsWith("---")
        ) {
          inTable = false;
          fixedLines.push(line);
        } else {
          // Line is an unescaped continuation line inside a table cell! Append with <br/> to previous row
          if (fixedLines.length > 0 && fixedLines[fixedLines.length - 1].startsWith("|")) {
            const lastLine = fixedLines[fixedLines.length - 1];
            if (lastLine.endsWith("|")) {
              fixedLines[fixedLines.length - 1] = lastLine.slice(0, -1) + "<br/> " + trimmed + " |";
            } else {
              fixedLines[fixedLines.length - 1] = lastLine + "<br/> " + trimmed;
            }
          } else {
            fixedLines.push(line);
          }
        }
      } else {
        fixedLines.push(line);
      }
    }
    text = fixedLines.join('\n');

    // EXPLICIT CLEANUP: Remove any accidental introductory headers (Ministry, District, School)
    const isSpecialCase = metadata.type === "weekly_forecast" || metadata.type === "individual_work_plan" || metadata.type === "assessments" || metadata.type === "lesson_notes" || metadata.type === "video_script";
    
    // SPECIFIC FOR ASSESSMENTS ONLY: Strip Republic of Zambia, Ministry of Education, and District headers
    if (metadata.type === "assessments") {
      text = text.replace(/<h[1-6][^>]*>\s*REPUBLIC OF ZAMBIA\s*<\/h[1-6]>/gi, "");
      text = text.replace(/<h[1-6][^>]*>\s*MINISTRY OF EDUCATION\s*<\/h[1-6]>/gi, "");
      text = text.replace(/<h[1-6][^>]*>[^<]*DISTRICT\s*<\/h[1-6]>/gi, "");
      text = text.replace(/^[#*_\s]*REPUBLIC OF ZAMBIA[#*_\s]*$/gim, "");
      text = text.replace(/^[#*_\s]*MINISTRY OF EDUCATION[#*_\s]*$/gim, "");
      text = text.replace(/^[#*_\s]*.*DISTRICT[#*_\s]*$/gim, "");
      // Clean empty center blocks if remaining
      text = text.replace(/<center>\s*<\/center>/gi, "");
    }

    // 1. Detect if the AI provided two Ministry headers and remove the first one
    // We only execute this if we find duplicate <center> blocks close to the beginning of the text (within the first 1200 chars)
    const firstCenter = text.toLowerCase().indexOf("<center>");
    if (firstCenter >= 0 && !isSpecialCase) {
      const secondCenter = text.toLowerCase().indexOf("<center>", firstCenter + 8);
      if (secondCenter > firstCenter && secondCenter < 1200) {
        const secondPart = text.substring(secondCenter);
        if (secondPart.match(/MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS/i)) {
          text = secondPart;
        }
      }
    }

    // 2. Remove common header lines ONLY if they appear before a horizontal rule AND we have content after
    // This refined approach preserves the professional header we want
    if (text.match(/(<center>|MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS)[\s\S]*?---/im) || isSpecialCase) {
       // Keep it
    } else {
       text = text.replace(/^(MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS|.*DISTRICT|.*PROVINCE|{school}|{schoolName})\s*\n/gim, "");
    }
    
    // 3. Remove accidental markdown separators at the very top (preserving the one after our header if any)
    const firstSeparator = text.indexOf("---");
    if ((firstSeparator > 0 && firstSeparator < 500) || isSpecialCase) {
       // Keep it
    } else {
       text = text.replace(/^[\s\n]*([-*_.]){3,}[\s\n]*/, "");
    }
 
    // 4. Final check: if it still starts with Ministry or District alone, strip that one line
    const testLines = text.split('\n', 15);
    const hasManyHeaders = testLines.filter(l => l.match(/MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS|DISTRICT|SCHOOL/i)).length > 5;
    if (hasManyHeaders && !isSpecialCase) {
       text = text.replace(/^[\s\n]*[#*_\s]*(MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS|.*DISTRICT|SCHOOL NAME).*\n?/gim, "");
    }

    // 5. Explicitly remove redundant type headers (like # LESSON PLAN) that often appear before TOPIC
    // We match any line that consists essentially of only the document type name
    const typeLabelRegex = /^[#*_\s]*(LESSON PLAN|SCHEMES OF WORK|WEEKLY FORECAST|LESSON NOTES|ASSESSMENTS|RECORD OF WORK|INDIVIDUAL WORK PLAN)[#*_\s]*$/gim;
    text = text.replace(typeLabelRegex, "");
    
    // Also catch it even if it follows the horizontal rule separator patterns directly
    text = text.replace(/(---[\s\n]*)[#*_\s]*(LESSON PLAN|SCHEMES OF WORK|WEEKLY FORECAST|LESSON NOTES|ASSESSMENTS|RECORD OF WORK|INDIVIDUAL WORK PLAN)[#*_\s]*\n?/gim, "$1");

    // 6. Reduce spacing after the horizontal rule (metadata block) to keep TOPIC nearby
    text = text.replace(/(---[\s\n]*)\n{2,}/g, "$1\n");

    // Clean up multiple consecutive separators
    text = text.replace(/(\n\s*---[\s\n]*){2,}/g, "\n\n---\n\n");

    // Remove any trailing separators that would cause a blank page
    text = text.replace(/[\s\n]*([-*_.]){3,}[\s\n]*$/g, "");

    return text.trim();
  })();

  // Dynamic Sizing for Weekly Forecast
  const wfLen = cleanContent ? cleanContent.length : 0;
  let wfTableFontSize = "11.6pt";
  let wfTableTdFontSize = "11.6pt";
  let wfTableThFontSize = "11.6pt";
  let wfTablePadding = "3px 4px";
  let wfLineHeight = "1.2";
  let wfHeaderMarginTop = "2px";
  let wfHeaderMarginBottom = "2px";
  let wfHeaderTitleSize = "13.5pt";
  let wfHeaderSubSize = "11.6pt";
  let wfMetaBoxPadding = "2px 0";
  let wfMetaBoxMarginBottom = "4px";

  // Dynamic Sizing for Schemes of Work
  let sowTableFontSize = "12pt";
  let sowTableTdFontSize = "12pt";
  let sowTableThFontSize = "12pt";
  let sowTablePadding = "5px 6px";
  let sowLineHeight = "1.3";

  if (metadata.type === "schemes_of_work") {
    const isEnglishCombined = metadata.englishCombined || (metadata.subject && metadata.subject.toLowerCase().includes('english') && (metadata.grade?.includes('Grade 1') || metadata.grade?.includes('Grade 2')));
    
    if (isEnglishCombined) {
      sowTableFontSize = "12pt";
      sowTableTdFontSize = "12pt";
      sowTableThFontSize = "12pt";
      sowTablePadding = "4px 5px";
      sowLineHeight = "1.25";
    }
  }

  if (metadata.type === "weekly_forecast") {
    const isOralLiteracyCombined = metadata.englishCombined || 
      (metadata.subject && (
        (metadata.subject.toLowerCase().includes('oral') && metadata.subject.toLowerCase().includes('literacy')) ||
        metadata.subject.toLowerCase().includes('oral /literacy') ||
        metadata.subject.toLowerCase().includes('oral/literacy') ||
        metadata.subject.toLowerCase().includes('oral & literacy') ||
        (metadata.subject.toLowerCase().includes('english') && (metadata.grade?.includes('Grade 1') || metadata.grade?.includes('Grade 2')))
      ));

    if (isOralLiteracyCombined) {
      wfTableFontSize = "11.6pt";
      wfTableTdFontSize = "11.6pt";
      wfTableThFontSize = "11.6pt";
      wfTablePadding = "3px 4px";
      wfLineHeight = "1.2";
      wfHeaderTitleSize = "13.5pt";
      wfHeaderSubSize = "11.6pt";
      wfHeaderMarginTop = "2px";
      wfHeaderMarginBottom = "2px";
      wfMetaBoxPadding = "2px 0";
      wfMetaBoxMarginBottom = "4px";
    } else {
      wfTableFontSize = "11.6pt";
      wfTableTdFontSize = "11.6pt";
      wfTableThFontSize = "11.6pt";
      wfTablePadding = "3px 4px";
      wfLineHeight = "1.2";
      wfHeaderTitleSize = "13.5pt";
      wfHeaderSubSize = "11.6pt";
      wfMetaBoxPadding = "2px 0";
      wfMetaBoxMarginBottom = "4px";
    }
  }

  const recordDownload = async (
    format: "pdf" | "print" | "markdown" | "word",
  ) => {
    if (!user) return;
    try {
      const rawDoc = {
        userId: user.uid,
        title: metadata.topic || `Document: ${metadata.type || ""}`,
        type: metadata.type || "",
        subject: metadata.subject || "",
        grade: metadata.grade || "",
        content: localContent || "",
        format: format || "",
        timestamp: serverTimestamp(),
        metadata: {
          term: metadata.term || "",
          level: metadata.studentLevel || "",
          teacherName: metadata.teacherName || "",
          school: metadata.school || "",
          district: metadata.district || "",
          zone: metadata.zone || "",
        },
      };

      // Permanent recursive sanitizer to guarantee no undefined values reach Firestore under any circumstance
      const sanitize = (obj: any): any => {
        if (obj === undefined || obj === null) return "";
        if (typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(sanitize);
        
        // Detect non-plain objects (like FieldValue, Timestamp, Date) and keep them exactly as-is
        const proto = Object.getPrototypeOf(obj);
        if (proto !== Object.prototype && proto !== null) {
          return obj;
        }

        const res: any = {};
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          res[key] = val === undefined ? "" : (typeof val === "object" && val !== null ? sanitize(val) : val);
        }
        return res;
      };

      // Always save to local storage cache immediately so recent records reflect downloaded documents instantly and remain offline
      try {
        const sanitizedData = sanitize(rawDoc);
        const storedStr = safeLocalStorage.getItem('eduplan_downloads');
        const current: any[] = storedStr ? JSON.parse(storedStr) : [];
        const newDoc = {
          id: 'local_' + Date.now(),
          ...sanitizedData,
          timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
        };
        const updatedList = [newDoc, ...current.filter(d => !(d.title === newDoc.title && d.type === newDoc.type))];
        safeLocalStorage.setItem('eduplan_downloads', JSON.stringify(updatedList));

        if (user && user.uid !== 'guest_teacher') {
          safeLocalStorage.setItem(`eduplan_downloads_cache_${user.uid}`, JSON.stringify(updatedList));
        }
      } catch (e) {
        console.error("Local save of download failed", e);
      }

      if (user.uid === 'guest_teacher') {
        return;
      }

      // Update local state instantly so that count and remaining update on user UI without waiting
      if (typeof incrementLocalDownloads === "function") {
        incrementLocalDownloads(metadata.type || "", metadata.grade || "", sanitize(rawDoc));
      }

      await addDoc(collection(db, "users", user.uid, "downloads"), sanitize(rawDoc));

      if (metadata.type === 'schemes_of_work' || metadata.type === 'weekly_forecast') {
        try {
          const syncRef = collection(db, "users", user.uid, "sync_sources");
          await addDoc(syncRef, {
            content: cleanContent,
            metadata: metadata,
            timestamp: serverTimestamp(),
            isActive: true,
            subject: metadata.subject,
            grade: metadata.grade,
            type: metadata.type
          });
        } catch (syncErr) {
          console.warn("Auto-save sync source notice:", syncErr);
        }
      }

      // Write to the central system_activity collection for the developer's real-time visibility
      await recordActivity({
        type: 'download',
        doc_type: metadata.type,
        grade: metadata.grade,
        subject: metadata.subject,
        topic: metadata.topic,
        subtopic: metadata.subtopic,
        format: metadata.format || 'unknown'
      });
    } catch (error) {
      console.error("Failed to record download activity:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!checkDownloadAccess()) return;
    recordDownload("print");
    window.print();
  };

  const handleDownloadWord = async () => {
    if (!checkDownloadAccess()) return;
    const element = document.getElementById("printable-document");
    if (!element) return;

    setGeneratingWord(true);
    const toastId = toast.loading("Generating editable Word document...");

    try {
      recordDownload("word");

      const fileName = getSignatureFileName("doc");
      const isLandscapeOrientation = 
        isLandscape || 
        metadata.type === "schemes_of_work" || 
        metadata.type === "weekly_forecast";

      const { blob, success } = downloadWordBlob(
        element.outerHTML, 
        fileName, 
        {
          metadata,
          isLandscape: isLandscapeOrientation,
          title: metadata.topic || metadata.subject || "Word Document",
        }
      );

      setExportModalState({
        isOpen: true,
        blob,
        fileName,
        title: metadata.topic || metadata.subject || "Word Document",
        fileType: "doc",
      });

      toast.success("Word document downloaded directly to phone! You can also share it.", { id: toastId, duration: 4000 });
    } catch (error) {
      console.error("Word conversion error:", error);
      toast.error("Failed to generate Word document.", { id: toastId });
    } finally {
      setGeneratingWord(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!checkDownloadAccess()) return;
    const element = document.getElementById("printable-document");
    if (!element) return;

    setGeneratingPdf(true);
    const toastId = toast.loading("Generating PDF document for export...");

    // Safety fallback
    const safetyTimeout = setTimeout(() => {
      setGeneratingPdf(false);
    }, 15000);

    let h2p;
    let restoreStyles: (() => void) | null = null;
    try {
      restoreStyles = prepareDocumentForPdfExport();
      h2p = await loadHtml2Pdf();
    } catch (loadErr: any) {
      if (restoreStyles) restoreStyles();
      clearTimeout(safetyTimeout);
      setGeneratingPdf(false);
      toast.error(loadErr.message || "Failed to initialize PDF generator. Please check internet connection.", { id: toastId });
      return;
    }

    try {
      restoreStyles = prepareDocumentForPdfExport();
      await new Promise(resolve => setTimeout(resolve, 500));

      recordDownload("pdf");
      const fileName = getSignatureFileName("pdf");

      const isWeeklyForecast = metadata.type === "weekly_forecast";

      const opt = {
        margin: isWeeklyForecast ? [3, 3, 3, 3] : (isLandscape ? [4, 4, 4, 4] : [6, 4, 6, 4]),
        filename: fileName,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 1.2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          scrollY: 0,
          windowWidth: isLandscape ? 1092 : 763,
          onclone: (clonedDoc: Document) => {
            sanitizeClonedDoc(clonedDoc);
            // Ensure document element maintains standard desktop print width in cloned DOM
            const targetWidth = isLandscape ? '1092px' : '763px';
            clonedDoc.body.style.width = targetWidth;
            clonedDoc.body.style.minWidth = targetWidth;
            clonedDoc.body.style.margin = '0 auto';
            clonedDoc.body.style.padding = '0';

            const printableEl = clonedDoc.getElementById('printable-document') || clonedDoc.querySelector('.markdown-content');
            if (printableEl) {
              (printableEl as HTMLElement).style.width = targetWidth;
              (printableEl as HTMLElement).style.minWidth = targetWidth;
              (printableEl as HTMLElement).style.maxWidth = targetWidth;
              (printableEl as HTMLElement).style.padding = '0';
              (printableEl as HTMLElement).style.margin = '0 auto';
            }
            if (isWeeklyForecast) {
              const wfEl = clonedDoc.querySelector('.doc-type-weekly_forecast');
              if (wfEl) {
                (wfEl as HTMLElement).style.minHeight = '0';
                (wfEl as HTMLElement).style.height = 'auto';
                (wfEl as HTMLElement).style.padding = '0';
                (wfEl as HTMLElement).style.margin = '0 auto';
              }
              // Compact sizing for Weekly Forecast PDF to strictly fit on 1 page without extra page breaks
              clonedDoc.querySelectorAll('.doc-type-weekly_forecast table, .weekly-forecast-table').forEach(tbl => {
                (tbl as HTMLElement).style.fontSize = wfTableFontSize;
                (tbl as HTMLElement).style.lineHeight = wfLineHeight;
                (tbl as HTMLElement).style.margin = '2px 0';
              });
              clonedDoc.querySelectorAll('.doc-type-weekly_forecast th, .weekly-forecast-table th').forEach(th => {
                (th as HTMLElement).style.fontSize = wfTableThFontSize;
                (th as HTMLElement).style.padding = wfTablePadding;
              });
              clonedDoc.querySelectorAll('.doc-type-weekly_forecast td, .weekly-forecast-table td').forEach(td => {
                (td as HTMLElement).style.fontSize = wfTableTdFontSize;
                (td as HTMLElement).style.padding = wfTablePadding;
                (td as HTMLElement).style.lineHeight = wfLineHeight;
                (td as HTMLElement).style.height = '27.5mm';
              });
            } else if (metadata.type === "schemes_of_work") {
               // Compact sizing for Schemes of Work PDF to aim for 5-6 pages
              clonedDoc.querySelectorAll('.doc-type-schemes_of_work table, .scheme-table').forEach(tbl => {
                (tbl as HTMLElement).style.fontSize = sowTableFontSize;
                (tbl as HTMLElement).style.lineHeight = sowLineHeight;
                (tbl as HTMLElement).style.marginBottom = '4px';
              });
              clonedDoc.querySelectorAll('.doc-type-schemes_of_work th, .scheme-table th').forEach(th => {
                (th as HTMLElement).style.fontSize = sowTableThFontSize;
                (th as HTMLElement).style.padding = sowTablePadding;
              });
              clonedDoc.querySelectorAll('.doc-type-schemes_of_work td, .scheme-table td').forEach(td => {
                (td as HTMLElement).style.fontSize = sowTableTdFontSize;
                (td as HTMLElement).style.padding = sowTablePadding;
                (td as HTMLElement).style.lineHeight = sowLineHeight;
              });
            }
            // Ensure table rows never split across pages for schemes of work or weekly forecasts
            clonedDoc.querySelectorAll('tr, tbody, thead, tfoot, .scheme-row, .doc-type-schemes_of_work tr, .doc-type-weekly_forecast tr').forEach(el => {
              (el as HTMLElement).style.breakInside = 'avoid';
              (el as HTMLElement).style.pageBreakInside = 'avoid';
            });
            // Cleanup heavy visuals for export
            clonedDoc.querySelectorAll('.animate-in, .transition-all, .shadow-xl, .shadow-2xl, .shadow-lg, .shadow-md, .shadow-sm, .shadow').forEach(el => {
              (el as HTMLElement).style.boxShadow = 'none';
              (el as HTMLElement).style.animation = 'none';
              (el as HTMLElement).style.transition = 'none';
              (el as HTMLElement).style.backdropFilter = 'none';
            });
          }
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: isLandscape ? "landscape" : "portrait",
          compress: true,
        },
        pagebreak: isWeeklyForecast ? { mode: 'avoid-all' } : { 
          mode: ['css', 'legacy'], 
          avoid: ['tr', 'tbody tr', '.scheme-row', '.page-break-avoid'] 
        },
      };

      console.log(`Starting PDF download: ${fileName}`);

      // Generate PDF as blob and show modal with instant user gesture actions
      const worker = h2p().from(element).set(opt);
      const pdfBlob = await worker.output('blob');

      if (pdfBlob && pdfBlob.size > 0) {
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        setReadyPdfUrl({
          url: blobUrl,
          name: fileName,
          blob: pdfBlob,
        });

        setExportModalState({
          isOpen: true,
          blob: pdfBlob,
          fileName,
          title: metadata.topic || metadata.subject || "Document",
          fileType: "pdf",
        });

        // Trigger automatic direct download fallback
        downloadBlobDirect(pdfBlob, fileName);
        toast.success("PDF ready! Tap Share or Save to store to device.", { id: toastId, duration: 4000 });
      } else {
        await worker.save();
        toast.success("PDF document downloaded successfully!", { id: toastId });
      }

      if (safetyTimeout) clearTimeout(safetyTimeout);
      setGeneratingPdf(false);
      console.log("PDF download complete");
    } catch (err: any) {
      console.error("PDF generation error:", err);
      if (safetyTimeout) clearTimeout(safetyTimeout);
      setGeneratingPdf(false);
      toast.error("PDF generation failed. Please try again.", { id: toastId });
    } finally {
      if (restoreStyles) restoreStyles();
    }
  };

  const handleDownloadMd = () => {
    if (!checkDownloadAccess()) return;
    recordDownload("markdown");
    const blob = new Blob([localContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = `${metadata.topic ? metadata.topic.replace(/\s+/g, "_") : "EDU_PLAN"}_${metadata.type}`;
    a.download = `${fileName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1440px] mx-auto py-12 px-4 sm:px-6 md:px-8 @container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 sticky top-0 bg-slate-50/90 backdrop-blur-md py-6 z-10 border-b border-slate-200 px-4">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-slate-900 shadow-sm"
            title="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-4xl font-black tracking-tightest text-slate-900 uppercase leading-none">
              {orientationLabel} PREVIEW
            </h2>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">
              {metadata.subject?.replace(/\(catch-up\)/gi, "").replace(/catch-up/gi, "").trim().replace(/\s+/g, " ")} // {metadata.grade?.replace(/catch-up/gi, "").trim().replace(/\s+/g, " ")} {metadata.type === 'weekly_forecast' && metadata.forecastWeek ? `// WEEK ${metadata.forecastWeek}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white border border-slate-200 font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "COPIED" : "COPY"}
          </button>

          <button
            onClick={handleToggleEdit}
            className={cn(
              "px-2.5 py-1.5 sm:px-3 sm:py-2 border font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg",
              isEditing 
                ? "bg-amber-100 text-amber-700 border-amber-300" 
                : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
            )}
          >
            <FileText size={12} />
            {isEditing ? "FINISH EDITING" : "PRE-EDIT CONTENT"}
          </button>

          {(metadata.type === 'schemes_of_work' || metadata.type === 'weekly_forecast') && (
            <button
              onClick={handleSaveForSync}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-900 text-white border border-slate-900 font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg"
            >
              <Save size={12} />
              SAVE FOR SYNC
            </button>
          )}

          {readyPdfUrl ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setExportModalState({
                    isOpen: true,
                    blob: readyPdfUrl.blob || null,
                    fileName: readyPdfUrl.name,
                    title: metadata.topic || metadata.subject || "Document",
                    fileType: "pdf",
                  });
                }}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-slate-900 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg animate-pulse"
              >
                <Share2 size={12} />
                SHARE / SAVE PDF
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPdf}
                title="Re-generate PDF"
                className="px-2 py-1.5 sm:px-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1 whitespace-nowrap rounded-lg"
              >
                <Download size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className={cn(
                "px-2.5 py-1.5 sm:px-3 sm:py-2 text-white border border-slate-900 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg",
                generatingPdf
                  ? "bg-slate-400 cursor-wait"
                  : "bg-indigo-600 hover:bg-indigo-700",
              )}
            >
              {generatingPdf ? (
                <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={12} />
              )}
              {generatingPdf ? "GENERATING..." : "DOWNLOAD PDF"}
            </button>
          )}

          <button
            onClick={handleDownloadWord}
            disabled={generatingWord}
            className={cn(
              "px-2.5 py-1.5 sm:px-3 sm:py-2 text-white border border-slate-900 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg",
              generatingWord
                ? "bg-slate-400 cursor-wait"
                : "bg-emerald-600 hover:bg-emerald-700",
            )}
          >
            {generatingWord ? (
              <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileCode size={12} />
            )}
            {generatingWord ? "GENERATING..." : "DOWNLOAD WORD"}
          </button>

          <button
            onClick={handlePrint}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#00A86B] text-white border border-slate-900 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg"
          >
            <Printer size={12} />
            PRINT
          </button>
        </div>
      </div>

      {/* AI Output Quality Feedback Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">Verify AI Document Quality</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Help us improve our AI engine. Please rate the quality of this generated output.
            </p>
          </div>
        </div>

        {feedbackSubmitted ? (
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 animate-pulse">
            <Check size={12} />
            <span>Thank you for your feedback! ({feedbackType === 'up' ? 'Thumbs Up' : 'Thumbs Down'})</span>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFeedbackSubmit('up')}
                disabled={isSubmittingFeedback}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-xl hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <ThumbsUp size={12} className="text-emerald-500" />
                Good Output
              </button>
              <button
                onClick={() => setShowCommentForm(prev => !prev)}
                disabled={isSubmittingFeedback}
                className={cn(
                  "px-3 py-1.5 border font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50",
                  showCommentForm
                    ? "bg-rose-50 text-rose-700 border-rose-300"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                )}
              >
                <ThumbsDown size={12} className="text-rose-500" />
                Flag Bad Output
              </button>
            </div>
          </div>
        )}
      </div>

      {showCommentForm && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 shadow-xs max-w-4xl mx-auto animate-in slide-in-from-top duration-300">
          <label className="block text-[10px] font-black uppercase text-rose-800 tracking-wider mb-2">
            What needs improvement in this document? (e.g. spelling, formatting, incomplete content)
          </label>
          <textarea
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Please share specific details here so the developers can review and fine-tune the AI prompt..."
            className="w-full bg-white border border-rose-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[80px] mb-3 text-slate-800 placeholder:text-slate-400"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCommentForm(false)}
              className="px-3 py-1.5 bg-white text-slate-500 border border-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleFeedbackSubmit('down', feedbackComment)}
              disabled={isSubmittingFeedback || !feedbackComment.trim()}
              className="px-4 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-rose-700 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isSubmittingFeedback ? "Submitting..." : "Submit Flag"}
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "bg-[#ffffff] flex flex-col mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 mx-auto w-full shadow-2xl border border-slate-200",
          isLandscape
            ? "max-w-full lg:max-w-[1092px]"
            : "max-w-full lg:max-w-[763px]",
        )}
      >
        {/* Paper Content */}
        <div className="flex-1 bg-[#ffffff] p-2 md:p-4 overflow-x-auto">
          {isEditing ? (
            <div className="p-4 md:p-8 bg-white rounded-2xl border-2 border-amber-200 shadow-xl max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Visual Document Editor</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click anywhere to type and edit content directly</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVisualSave}
                    className="px-5 py-2 bg-[#00A86B] text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>

              <div 
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className={cn(
                  "markdown-content bg-white mx-auto p-4 md:p-8 outline-none focus:ring-2 focus:ring-[#00A86B] rounded-xl min-h-[800px]",
                  `doc-type-${metadata.type}`,
                  `curriculum-${metadata.curriculumType}`,
                  isLandscape ? "w-[1092px]" : "w-full md:w-[763px]"
                )}
                dangerouslySetInnerHTML={{ __html: visualHtml || cleanContent }}
              />

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
                  <AlertCircle size={12} />
                  Tip: Changes here will update your PDF and Word downloads immediately.
                </p>
                <button
                   onClick={() => {
                     const newContent = prompt("Advanced: Edit raw source code?", localContent);
                     if (newContent !== null) {
                       setLocalContent(newContent);
                       setVisualHtml(newContent);
                       setHasBeenEdited(true);
                     }
                   }}
                   className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 underline"
                >
                  Edit Raw Source
                </button>
              </div>
            </div>
          ) : hasBeenEdited ? (
            <div
              id="printable-document"
              className={cn(
                "markdown-content bg-white mx-auto",
                `doc-type-${metadata.type}`,
                `curriculum-${metadata.curriculumType}`,
                isLandscape ? "w-[1092px]" : "w-full md:w-[763px]",
              )}
              dangerouslySetInnerHTML={{ __html: visualHtml }}
            />
          ) : (
            <div
              id="printable-document"
              className={cn(
                "markdown-content bg-white mx-auto",
                `doc-type-${metadata.type}`,
                `curriculum-${metadata.curriculumType}`,
                isLandscape ? "w-[1092px]" : "w-full md:w-[763px]",
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              components={{
                table: ({ node, ...props }) => {
                  let className = "";
                  if (metadata.type === "schemes_of_work")
                    className = "scheme-table";
                  else if (metadata.type === "weekly_forecast")
                    className = "weekly-forecast-table";
                  else if (metadata.type === "lesson_plan")
                    className = "lesson-plan-table";
                  else if (metadata.type === "individual_work_plan")
                    className = "workplan-table";

                  const children = React.Children.toArray(props.children);
                  const theadIndex = children.findIndex((child: any) => child?.type === 'thead');

                  let referenceColIndex = -1;
                  let weeklyRecordColIndex = -1;

                  const extractText = (val: any): string => {
                    if (!val) return "";
                    if (typeof val === 'string') return val;
                    if (Array.isArray(val)) return val.map(extractText).join("");
                    if (val.props?.children) return extractText(val.props.children);
                    return "";
                  };

                  if (theadIndex !== -1) {
                    const thead = children[theadIndex] as any;
                    const tr = React.Children.toArray(thead.props?.children)[0] as any;
                    const headerCells = tr ? React.Children.toArray(tr.props?.children) : [];
                    
                    headerCells.forEach((th: any, idx: number) => {
                      const text = extractText(th?.props?.children || th?.props?.value || '').toLowerCase().trim();
                      const isExplicitRef = text.includes('reference') || text === 'ref' || text === 'ref.' || text.includes('references');
                      const isRecord = text.includes('record') || text.includes('weekly record') || text.includes('records') || text.includes('work');
                      
                      if (isRecord) {
                        weeklyRecordColIndex = idx;
                      } else if (isExplicitRef) {
                        referenceColIndex = idx;
                      } else if (idx === headerCells.length - 1 && referenceColIndex === -1 && metadata.type === 'schemes_of_work') {
                        // Only fallback to last column for schemes of work if no reference was seen
                        referenceColIndex = idx;
                      }
                    });

                    // For weekly forecast, ensure we track record of work column correctly
                    if (metadata.type === 'weekly_forecast' && weeklyRecordColIndex === -1 && headerCells.length > 0) {
                      const lastIdx = headerCells.length - 1;
                      const lastText = extractText((headerCells[lastIdx] as any)?.props?.children || '').toLowerCase().trim();
                      if (lastText.includes('record') || lastText.includes('work') || lastIdx >= 9) {
                        weeklyRecordColIndex = lastIdx;
                      }
                    }
                  }

                  const newChildren = children.map((section: any) => {
                    if (section?.type === 'thead') {
                      const trs = React.Children.toArray(section.props?.children);
                      const newTrs = trs.map((tr: any) => {
                        const ths = React.Children.toArray(tr.props?.children);
                        const newThs = ths.map((th: any, idx: number) => {
                          if (idx === referenceColIndex) {
                            return React.cloneElement(th as any, {
                              children: 'REFERENCE',
                              className: (th.props?.className || "") + " font-black tracking-wide uppercase px-2 text-center"
                            });
                          }
                          if (idx === weeklyRecordColIndex) {
                            return React.cloneElement(th as any, {
                              children: 'RECORD OF WORK',
                              className: (th.props?.className || "") + " font-black tracking-wide uppercase px-2 text-center"
                            });
                          }
                          return th;
                        });

                        // If Weekly Forecast table was generated with only 9 columns (missing Record of Work), auto-append it!
                        if (metadata.type === 'weekly_forecast' && weeklyRecordColIndex === -1) {
                          newThs.push(
                            <th key="rec-work-auto-th" className="font-black tracking-wide uppercase px-2 text-center">
                              RECORD OF WORK
                            </th>
                          );
                        }

                        return React.cloneElement(tr as any, { children: newThs });
                      });
                      return React.cloneElement(section as any, { children: newTrs });
                    }

                    if (section?.type === 'tbody') {
                      const trs = React.Children.toArray(section.props?.children);
                      const newTrs = trs.map((tr: any) => {
                        const tds = React.Children.toArray(tr.props?.children);
                        const rowData = tds.map(td => extractText((td as any).props?.children));
                        const currentTopic = rowData[1] || metadata.topic || "General";
                        const currentSubTopic = rowData[2] || "";

                        const newTds = tds.map((td: any, idx: number) => {
                          if (idx === referenceColIndex) {
                            let cellContent = td.props?.children;
                            let textVal = extractText(cellContent).trim();
                            
                            if (!textVal || textVal === '...' || textVal === '..' || textVal === '......' || textVal.replace(/[.\s]/g, '') === '' || textVal === '-' || textVal.toLowerCase() === 'reference') {
                              const prefix = metadata.curriculumType === "OBC" ? "OBC" : "CBC";
                              const syllabusName = metadata.subject && metadata.grade ? `${metadata.grade} ${metadata.subject} Syllabus` : "CDC Syllabus";
                              
                              // Generate a more authentic reference based on the row's topic if possible
                              let topicRef = currentTopic.includes('.') ? ` (Ref: ${currentTopic})` : "";
                              if (!topicRef && currentSubTopic) topicRef = ` (Ref: ${currentSubTopic})`;
                              
                              const fallbackText = `${prefix} ${syllabusName}${topicRef}`;
                              cellContent = fallbackText;
                            }
                            return React.cloneElement(td as any, {
                              children: cellContent,
                              className: (td.props?.className || "") + " reference-cell text-[#000000] font-bold opacity-100! visible!",
                              style: { ...td.props?.style, color: '#000000', opacity: 1, visibility: 'visible', fontSize: metadata.type === 'weekly_forecast' ? '9pt' : '11pt', textAlign: 'center' }
                            });
                          }
                          
                          if (idx === weeklyRecordColIndex) {
                            return React.cloneElement(td as any, {
                              className: (td.props?.className || "") + " weekly-record-cell",
                              children: ""
                            });
                          }
                          return td;
                        });

                        // If Weekly Forecast was missing Record of Work column, auto-append empty cell to row
                        if (metadata.type === 'weekly_forecast' && weeklyRecordColIndex === -1) {
                          newTds.push(
                            <td key="rec-work-auto-td" className="weekly-record-cell"></td>
                          );
                        }

                        return React.cloneElement(tr as any, { children: newTds });
                      });
                      return React.cloneElement(section as any, { children: newTrs });
                    }
                    return section;
                  });

                  return <table className={className} {...props} children={newChildren} />;
                },
              }}
            >
              {metadata.type === "individual_work_plan"
                ? `<div class="workplan-container">\n\n${cleanContent}\n\n</div>`
                : `\n\n${cleanContent}`}
            </ReactMarkdown>
          </div>
          )}
        </div>
      </div>

      <PdfExportModal
        isOpen={exportModalState.isOpen}
        onClose={() => setExportModalState((prev) => ({ ...prev, isOpen: false }))}
        blob={exportModalState.blob}
        fileName={exportModalState.fileName}
        title={exportModalState.title}
        fileType={exportModalState.fileType}
      />

      <style>{`
        @media print {
          @page {
            margin: ${metadata.type === "weekly_forecast" ? "0.4cm" : "0.5cm"};
            size: A4 ${isLandscape ? "landscape" : "portrait"};
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          nav, .sticky, button, .md\\:flex, .hidden, .hide-in-export { display: none !important; }
          .max-w-\\[1092px\\], .max-w-\\[763px\\] { max-w: none !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .min-h-[800px] { min-h: auto !important; }
          .p-4, .p-8 { padding: 0 !important; }
          .doc-type-schemes_of_work table { font-size: 12pt !important; }
          .doc-type-schemes_of_work td { font-size: 12pt !important; padding: 4px 5px !important; line-height: 1.25 !important; }
          .doc-type-schemes_of_work th { font-size: 12pt !important; padding: 5px 4px !important; font-weight: 800 !important; }
          .doc-type-weekly_forecast {
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          .doc-type-weekly_forecast table {
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
          }
        }
        
        .markdown-content {
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif;
          line-height: 1.5;
          color: #000;
        }

        .markdown-content hr {
          border: 0;
          height: 1px;
          background: #000;
          margin: 0.5rem 0;
        }

        .markdown-content h1, .markdown-content h2, .markdown-content h3 {
          font-weight: 900 !important;
          color: #000 !important;
          text-transform: none !important;
          text-align: left !important;
          margin-top: 0.15rem !important;
          margin-bottom: 0.15rem !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }

        .markdown-content center h1,
        .markdown-content center h2,
        .markdown-content center h3 {
          text-align: center !important;
          text-transform: uppercase !important;
        }

        .markdown-content.doc-type-lesson_plan {
          text-align: left !important;
        }

        .doc-type-lesson_plan h1,
        .doc-type-lesson_plan h2,
        .doc-type-lesson_plan h3,
        .doc-type-lesson_plan center h1,
        .doc-type-lesson_plan center h2,
        .doc-type-lesson_plan center h3,
        .markdown-content.doc-type-lesson_plan h1,
        .markdown-content.doc-type-lesson_plan h2,
        .markdown-content.doc-type-lesson_plan h3,
        .markdown-content.doc-type-lesson_plan center h1,
        .markdown-content.doc-type-lesson_plan center h2,
        .markdown-content.doc-type-lesson_plan center h3 {
          font-size: 12pt !important;
          font-weight: bold !important;
          margin-top: 1px !important;
          margin-bottom: 1px !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }

        .doc-type-lesson_plan p,
        .doc-type-lesson_plan li,
        .doc-type-lesson_plan div,
        .doc-type-lesson_plan span,
        .doc-type-lesson_plan table:first-of-type:not(.lesson-plan-table) td,
        .lesson-plan-content,
        .lesson-plan-content p,
        .lesson-plan-content li,
        .lesson-plan-content div {
          font-weight: normal !important;
          font-size: 11.8pt !important;
          line-height: 1.4 !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }

        .doc-type-lesson_plan b,
        .doc-type-lesson_plan strong,
        .lesson-plan-content b,
        .lesson-plan-content strong {
          font-weight: bold !important;
          font-size: 11.8pt !important;
        }

        .markdown-content h1 { font-size: 16pt; margin-top: 1pt; margin-bottom: 1pt; }
        .markdown-content h2 { font-size: 14pt; margin-top: 1pt; margin-bottom: 1pt; }
        .markdown-content h3 { font-size: 12.5pt; margin-top: 1pt; margin-bottom: 1pt; }

        .markdown-content p,
        .markdown-content li,
        .markdown-content td,
        .markdown-content div,
        .lesson-plan-content,
        .lesson-plan-content p,
        .lesson-plan-content li {
          text-align: left !important;
          font-weight: normal !important;
          font-size: 12pt !important;
          margin-bottom: 2px;
          color: #000000 !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif;
        }

        .markdown-content center,
        .markdown-content center * {
          text-align: center !important;
        }

        .markdown-content strong, .markdown-content b,
        .lesson-plan-content b, .lesson-plan-content strong {
          font-weight: bold !important;
          color: #000 !important;
        }

        .hide-in-export {
          display: none !important;
        }

        .markdown-content table {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box;
          border-collapse: collapse;
          margin: 0 !important;
          border: 1.5px solid #000;
          table-layout: fixed !important;
          page-break-inside: auto;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif;
        }
        
        .markdown-content tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: auto !important;
        }

        .markdown-content th, .markdown-content td {
          box-sizing: border-box;
          border: 1px solid #000;
          border-collapse: collapse;
          padding: 5px 6px !important;
          color: #000;
          vertical-align: top;
          line-height: 1.3 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
          white-space: normal !important;
          hyphens: none !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif;
        }

        .markdown-content td *, .markdown-content th * {
          white-space: normal !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
          max-width: 100%;
        }

        .markdown-content tr:last-child td {
          border-bottom: 2px solid #000 !important;
        }

        .markdown-content table {
          border-bottom: 2px solid #000 !important;
        }

        .markdown-content table th:last-child,
        .markdown-content table td:last-child {
          border-right: 2px solid #000 !important;
        }

        .markdown-content th {
          background-color: #f1f5f9;
          font-weight: 900 !important;
          color: #000 !important;
          text-transform: uppercase;
          font-size: 12.5pt !important;
          letter-spacing: 0.01em;
          padding: 6px 5px !important;
        }

        .markdown-content td {
          font-size: 12pt !important;
          padding: 6px 5px !important;
        }
        
        .markdown-content tr:nth-child(even) {
          background-color: #f8fafc;
        }

        .markdown-content ul {
          margin-left: 0.8rem;
          margin-bottom: 0.1rem;
          list-style-type: square;
        }

        .markdown-content ol {
          margin-left: 0.8rem;
          margin-bottom: 0.1rem;
          list-style-type: decimal;
          font-weight: bold;
        }

        .markdown-content ol li {
          font-weight: normal; /* To keep text inside li normal if numbering is bold */
        }

        .doc-type-lesson_plan table {
          table-layout: fixed !important;
          width: 100% !important;
        }

        .doc-type-lesson_plan table th {
          font-size: 11.8pt !important;
          padding: 6px 6px !important;
          line-height: 1.3 !important;
          color: #000000 !important;
          font-weight: bold !important;
        }

        .doc-type-lesson_plan table td {
          font-size: 11.8pt !important;
          padding: 6px 6px !important;
          line-height: 1.35 !important;
          color: #000000 !important;
          font-weight: normal !important;
          min-height: 36px !important;
          height: auto !important;
        }
        
        .doc-type-lesson_plan table td ul {
          margin: 0 !important;
          padding-left: 12px !important;
          list-style-type: disc !important;
        }
        
        .doc-type-lesson_plan table td ol {
          margin: 0 !important;
          padding-left: 12px !important;
          list-style-type: decimal !important;
        }
        
        .doc-type-lesson_plan table td li {
          margin: 0 0 3px 0 !important;
          padding: 0 !important;
          font-size: 11.8pt !important;
          line-height: 1.35 !important;
          color: #000000 !important;
          text-align: left !important;
        }
        
        .doc-type-lesson_plan table.lesson-plan-table th:nth-child(1),
        .doc-type-lesson_plan table.lesson-plan-table td:nth-child(1),
        .doc-type-lesson_plan table:not(:first-of-type) th:nth-child(1),
        .doc-type-lesson_plan table:not(:first-of-type) td:nth-child(1) {
          width: 10% !important;
        }
        
        .doc-type-lesson_plan table.lesson-plan-table th:nth-child(2),
        .doc-type-lesson_plan table.lesson-plan-table td:nth-child(2),
        .doc-type-lesson_plan table:not(:first-of-type) th:nth-child(2),
        .doc-type-lesson_plan table:not(:first-of-type) td:nth-child(2) {
          width: 41% !important;
        }
        
        .doc-type-lesson_plan table.lesson-plan-table th:nth-child(3),
        .doc-type-lesson_plan table.lesson-plan-table td:nth-child(3),
        .doc-type-lesson_plan table:not(:first-of-type) th:nth-child(3),
        .doc-type-lesson_plan table:not(:first-of-type) td:nth-child(3) {
          width: 33% !important;
        }

        .doc-type-lesson_plan table.lesson-plan-table th:nth-child(4),
        .doc-type-lesson_plan table.lesson-plan-table td:nth-child(4),
        .doc-type-lesson_plan table:not(:first-of-type) th:nth-child(4),
        .doc-type-lesson_plan table:not(:first-of-type) td:nth-child(4) {
          width: 16% !important;
        }

        .doc-type-lesson_plan table.lesson-plan-table th:nth-child(5),
        .doc-type-lesson_plan table.lesson-plan-table td:nth-child(5),
        .doc-type-lesson_plan table:not(:first-of-type) th:nth-child(5),
        .doc-type-lesson_plan table:not(:first-of-type) td:nth-child(5) {
          width: 0% !important;
          display: none !important;
        }

        /* Schemes of Work Table & Typography */
        .doc-type-schemes_of_work table,
        .scheme-table {
          font-size: 11.5pt !important;
          table-layout: fixed !important;
          width: 100% !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }
        .doc-type-schemes_of_work td,
        .scheme-table td {
          font-size: 11.5pt !important;
          padding: 5px 6px !important;
          line-height: 1.3 !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
          hyphens: none !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }
        .doc-type-schemes_of_work th,
        .scheme-table th {
          font-size: 11.5pt !important;
          padding: 6px 5px !important;
          font-weight: 800 !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
          hyphens: none !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }

        /* Schemes of Work Columns (CBC & Default - 9 columns): Expanded Learning Activities & Specific Competencies */
        .doc-type-schemes_of_work table th:nth-child(1), .doc-type-schemes_of_work table td:nth-child(1),
        .scheme-table th:nth-child(1), .scheme-table td:nth-child(1) { width: 5.5% !important; text-align: center; }
        .doc-type-schemes_of_work table th:nth-child(2), .doc-type-schemes_of_work table td:nth-child(2),
        .scheme-table th:nth-child(2), .scheme-table td:nth-child(2) { width: 8.5% !important; }
        .doc-type-schemes_of_work table th:nth-child(3), .doc-type-schemes_of_work table td:nth-child(3),
        .scheme-table th:nth-child(3), .scheme-table td:nth-child(3) { width: 8.5% !important; }
        .doc-type-schemes_of_work table th:nth-child(4), .doc-type-schemes_of_work table td:nth-child(4),
        .scheme-table th:nth-child(4), .scheme-table td:nth-child(4) { width: 17.5% !important; }
        .doc-type-schemes_of_work table th:nth-child(5), .doc-type-schemes_of_work table td:nth-child(5),
        .scheme-table th:nth-child(5), .scheme-table td:nth-child(5) { width: 9.5% !important; }
        .doc-type-schemes_of_work table th:nth-child(6), .doc-type-schemes_of_work table td:nth-child(6),
        .scheme-table th:nth-child(6), .scheme-table td:nth-child(6) { width: 27.5% !important; }
        .doc-type-schemes_of_work table th:nth-child(7), .doc-type-schemes_of_work table td:nth-child(7),
        .scheme-table th:nth-child(7), .scheme-table td:nth-child(7) { width: 7.5% !important; }
        .doc-type-schemes_of_work table th:nth-child(8), .doc-type-schemes_of_work table td:nth-child(8),
        .scheme-table th:nth-child(8), .scheme-table td:nth-child(8) { width: 8% !important; }
        .doc-type-schemes_of_work table th:nth-child(9), .doc-type-schemes_of_work table td:nth-child(9),
        .scheme-table th:nth-child(9), .scheme-table td:nth-child(9) { width: 8% !important; }

        /* Schemes of Work Columns (OBC - 10 columns) */
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(1), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(1) { width: 5% !important; text-align: center; }
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(2), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(2) { width: 8% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(3), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(3) { width: 8% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(4), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(4) { width: 16% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(5), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(5) { width: 10% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(6), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(6) { width: 9% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(7), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(7) { width: 8% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(8), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(8) { width: 7% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(9), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(9) { width: 7.5% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table th:nth-child(10), .curriculum-OBC.doc-type-schemes_of_work table td:nth-child(10) { width: 8.5% !important; }

        @media print {
          @page {
            size: ${isLandscape ? "landscape" : "portrait"};
            margin: ${metadata.type === "weekly_forecast" ? "4mm" : "6mm"} !important;
          }
        }

        .doc-type-weekly_forecast h1 { font-size: ${wfHeaderTitleSize} !important; margin: ${wfHeaderMarginTop} 0 ${wfHeaderMarginBottom} 0 !important; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important; text-align: center; font-weight: 800 !important; }
        .doc-type-weekly_forecast h2 { font-size: ${wfHeaderSubSize} !important; margin: ${wfHeaderMarginTop} 0 ${wfHeaderMarginBottom} 0 !important; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important; text-align: center; font-weight: 700 !important; }
        .doc-type-weekly_forecast h3 { font-size: calc(${wfHeaderSubSize} - 1pt) !important; margin: ${wfHeaderMarginTop} 0 ${wfHeaderMarginBottom} 0 !important; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important; text-align: center; font-weight: 700 !important; }

        .doc-type-weekly_forecast p {
          margin: ${wfHeaderMarginTop} 0 ${wfHeaderMarginBottom} 0 !important;
          font-size: ${wfTableFontSize} !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          line-height: ${wfLineHeight} !important;
        }

        .doc-type-weekly_forecast table {
          font-size: ${wfTableFontSize} !important;
          margin: 1px 0 !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }

        .doc-type-weekly_forecast td {
          font-size: ${wfTableTdFontSize} !important;
          padding: ${wfTablePadding} !important;
          line-height: ${wfLineHeight} !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          font-weight: normal !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
          hyphens: none !important;
          height: 27.5mm !important;
        }
        
        .doc-type-weekly_forecast th {
          font-size: ${wfTableThFontSize} !important;
          padding: ${wfTablePadding} !important;
          line-height: ${wfLineHeight} !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          text-transform: uppercase;
          font-weight: 800 !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
          hyphens: none !important;
        }

        /* Weekly Forecast Column Widths for CBC (10 columns) */
        .doc-type-weekly_forecast table th:nth-child(1), .doc-type-weekly_forecast table td:nth-child(1),
        .weekly-forecast-table th:nth-child(1), .weekly-forecast-table td:nth-child(1) { width: 4.5% !important; text-align: center; font-weight: bold; border-right: 1.5px solid #000 !important; }
        .doc-type-weekly_forecast table th:nth-child(2), .doc-type-weekly_forecast table td:nth-child(2),
        .weekly-forecast-table th:nth-child(2), .weekly-forecast-table td:nth-child(2) { width: 8% !important; }
        .doc-type-weekly_forecast table th:nth-child(3), .doc-type-weekly_forecast table td:nth-child(3),
        .weekly-forecast-table th:nth-child(3), .weekly-forecast-table td:nth-child(3) { width: 8% !important; }
        .doc-type-weekly_forecast table th:nth-child(4), .doc-type-weekly_forecast table td:nth-child(4),
        .weekly-forecast-table th:nth-child(4), .weekly-forecast-table td:nth-child(4) { width: 15% !important; }
        .doc-type-weekly_forecast table th:nth-child(5), .doc-type-weekly_forecast table td:nth-child(5),
        .weekly-forecast-table th:nth-child(5), .weekly-forecast-table td:nth-child(5) { width: 10.5% !important; }
        .doc-type-weekly_forecast table th:nth-child(6), .doc-type-weekly_forecast table td:nth-child(6),
        .weekly-forecast-table th:nth-child(6), .weekly-forecast-table td:nth-child(6) { width: 25.5% !important; }
        .doc-type-weekly_forecast table th:nth-child(7), .doc-type-weekly_forecast table td:nth-child(7),
        .weekly-forecast-table th:nth-child(7), .weekly-forecast-table td:nth-child(7) { width: 6.5% !important; }
        .doc-type-weekly_forecast table th:nth-child(8), .doc-type-weekly_forecast table td:nth-child(8),
        .weekly-forecast-table th:nth-child(8), .weekly-forecast-table td:nth-child(8) { width: 7% !important; }
        .doc-type-weekly_forecast table th:nth-child(9), .doc-type-weekly_forecast table td:nth-child(9),
        .weekly-forecast-table th:nth-child(9), .weekly-forecast-table td:nth-child(9) { width: 8% !important; }
        .doc-type-weekly_forecast table th:nth-child(10), .doc-type-weekly_forecast table td:nth-child(10),
        .weekly-forecast-table th:nth-child(10), .weekly-forecast-table td:nth-child(10) { width: 7% !important; }

        /* Weekly Forecast Column Widths for OBC (11 columns) */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(1), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(1) { width: 4% !important; text-align: center; font-weight: bold; border-right: 1.5px solid #000 !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(2), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(2) { width: 7% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(3), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(3) { width: 7% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(4), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(4) { width: 12% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(5), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(5) { width: 8% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(6), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(6) { width: 8% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(7), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(7) { width: 7% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(8), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(8) { width: 7% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(9), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(9) { width: 8% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(10), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(10) { width: 8% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(11), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(11) { width: 14% !important; }

        .doc-type-weekly_forecast table tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        /* Weekly Forecast: Format Record of Work column with guide lines for handwritten entries */
        .doc-type-weekly_forecast table td.weekly-record-cell {
          border: 1px solid #000 !important;
          color: transparent !important; /* Keep clean for manual entry */
          position: relative;
          min-height: 20px;
          background-image: linear-gradient(to bottom, transparent 90%, #a0a0a0 90%);
          background-size: 100% 1.1rem;
        }

        .page-break {
          page-break-before: always !important;
          break-before: page !important;
        }

        .doc-type-assessments p {
          margin-bottom: 0.85rem !important; /* balanced spacing between sentences/questions */
          font-size: 1rem;
        }

        .doc-type-assessments ol, .doc-type-assessments ul {
          margin-bottom: 1.25rem !important;
        }

        .doc-type-assessments li {
          margin-bottom: 0.5rem !important;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .doc-type-assessments img {
          max-width: 100% !important;
          height: auto !important;
          max-height: 150px !important;
          display: block;
          margin: 10px 0;
          object-fit: contain;
        }

        .doc-type-assessments h2, .doc-type-assessments h3 {
          margin-top: 2rem !important;
          margin-bottom: 1.25rem !important;
        }

        /* ===== MASTER CSS FOR SCHEMES + WEEKLY FORECAST + LESSON PLAN ===== */

        /* LANDSCAPE - Schemes of Work & Weekly Forecast */
        @media print and (orientation: landscape) {
          .scheme-table {
            table-layout: fixed !important;
            width: 100% !important;
            max-width: 290mm !important;
            font-size: 12pt !important;
            border-collapse: collapse !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .scheme-table th,
          .scheme-table td {
            border: 1px solid #000 !important;
            padding: 4px 6px !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            word-break: normal !important;
            hyphens: none !important;
            vertical-align: top !important;
            font-size: 12pt !important;
            line-height: 1.3 !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .scheme-table th {
            font-size: 12.5pt !important;
            font-weight: bold !important;
            background-color: #f5f5f5 !important;
            padding: 5px 6px !important;
          }

          .scheme-table tr {
            page-break-inside: avoid !important;
          }

          .weekly-forecast-table {
            table-layout: fixed !important;
            width: 100% !important;
            max-width: 290mm !important;
            font-size: 12pt !important;
            border-collapse: collapse !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .weekly-forecast-table th,
          .weekly-forecast-table td {
            border: 1px solid #000 !important;
            padding: 4px 6px !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            word-break: normal !important;
            hyphens: none !important;
            vertical-align: top !important;
            font-size: 12pt !important;
            line-height: 1.3 !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .weekly-forecast-table td {
            height: 27.5mm !important;
          }

          .weekly-forecast-table th {
            font-size: 12pt !important;
            font-weight: bold !important;
            background-color: #f5f5f5 !important;
            padding: 5px 6px !important;
          }

          .weekly-forecast-table tr {
            page-break-inside: avoid !important;
          }
        }

        /* PORTRAIT - Lesson Plan Only */
        @media print and (orientation: portrait) {
          .doc-type-lesson_plan h1,
          .doc-type-lesson_plan h2,
          .doc-type-lesson_plan h3,
          .doc-type-lesson_plan center h1,
          .doc-type-lesson_plan center h2,
          .doc-type-lesson_plan center h3 {
            font-size: 12pt !important;
            font-weight: bold !important;
            margin-top: 1px !important;
            margin-bottom: 1px !important;
          }

          /* Page 1: Fill the empty space below EXPECTED STANDARD */
          .lesson-plan-content,
          .lesson-plan-content p,
          .lesson-plan-content li,
          .lesson-plan-content div {
            display: block !important;
            font-size: 11.8pt !important;
            text-align: left !important;
            line-height: 1.4 !important;
            color: #000000 !important;
            font-weight: normal !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .lesson-plan-content b,
          .lesson-plan-content strong {
            font-weight: bold !important;
            font-size: 11.8pt !important;
            margin-top: 4px;
          }

          /* General styling of first table (teacher & school info) */
          .doc-type-lesson_plan table:first-of-type:not(.lesson-plan-table) {
            margin-top: 10px !important;
            margin-bottom: 5px !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .doc-type-lesson_plan table:first-of-type:not(.lesson-plan-table) td {
            padding: 4px 6px !important;
            font-size: 11.8pt !important;
            line-height: 1.35 !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          /* Ensure table rows don't split but cells can expand */
          .lesson-plan-table {
            table-layout: fixed !important;
            width: 100% !important;
            max-width: 100% !important;
            font-size: 11.8pt !important;
            border-collapse: collapse !important;
            break-inside: auto !important;
            margin-top: 5px !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .lesson-plan-table tr {
            break-inside: avoid !important;        /* Never split a single row */
            page-break-inside: avoid !important;
          }

          .lesson-plan-table th {
            font-size: 11.8pt !important;
            font-weight: bold !important;
            padding: 6px 6px !important;
            border: 1px solid #000 !important;
            background-color: #f5f5f5 !important;
            vertical-align: top !important;
            text-transform: uppercase !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .lesson-plan-table td {
            font-size: 11.8pt !important;
            padding: 6px 6px !important;
            border: 1px solid #000 !important;
            vertical-align: top !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            line-height: 1.35 !important;
            min-height: 36px !important;
            height: auto !important;
            color: #000000 !important;
            font-weight: normal !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          /* Keep LESSON DEVELOPMENT heading with the table */
          h3 {
            break-after: avoid !important;
            page-break-after: avoid !important;
            margin-top: 15px !important;
            margin-bottom: 5px !important;
          }

          /* Homework and Evaluation sections */
          .lesson-plan-footer,
          .lesson-plan-homework-section {
            font-size: 11.8pt !important;
            margin-top: 12px !important;
            break-inside: avoid; /* Keep individual blocks together */
            page-break-inside: avoid;
            color: #000000 !important;
            font-weight: normal !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .lesson-plan-footer {
            margin-top: 15px !important;
          }

          /* Remove thick black lines that might appear between sections */
          .doc-type-lesson_plan table,
          .doc-type-lesson_plan tr:last-child td {
            border-bottom: 1px solid #000 !important;
          }

          .lesson-plan-footer p, 
          .lesson-plan-footer div,
          .lesson-plan-homework-section p,
          .lesson-plan-homework-section div {
            margin-bottom: 3px !important;
            line-height: 1.3 !important;
          }
        } }

        /* Individual Work Plan Styles */
        .doc-type-individual_work_plan .workplan-table {
          width: 100% !important;
          border: 1px solid #000 !important;
          table-layout: fixed !important;
        }

        .doc-type-individual_work_plan hr {
          page-break-after: always !important;
          border: none !important;
          margin: 0 !important;
        }

        .doc-type-individual_work_plan .workplan-table tr {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }

        .doc-type-individual_work_plan .workplan-table td {
          padding: 11px !important;
          border: 1px solid #000 !important;
          font-size: 11pt !important;
          line-height: 1.3 !important;
          page-break-inside: auto !important;
        }

        .doc-type-individual_work_plan .workplan-table th:nth-child(1), .doc-type-individual_work_plan .workplan-table td:nth-child(1) { width: 12% !important; }
        .doc-type-individual_work_plan .workplan-table th:nth-child(2), .doc-type-individual_work_plan .workplan-table td:nth-child(2) { width: 30% !important; }
        .doc-type-individual_work_plan .workplan-table th:nth-child(3), .doc-type-individual_work_plan .workplan-table td:nth-child(3) { width: 23% !important; }
        .doc-type-individual_work_plan .workplan-table th:nth-child(4), .doc-type-individual_work_plan .workplan-table td:nth-child(4) { width: 25% !important; }
        .doc-type-individual_work_plan .workplan-table th:nth-child(5), .doc-type-individual_work_plan .workplan-table td:nth-child(5) { width: 10% !important; }

        .doc-type-individual_work_plan {
          font-size: 11pt !important;
        }
        .doc-type-individual_work_plan h3 {
          font-size: 12pt !important;
          margin: 15px 0 8px 0 !important;
          text-decoration: underline;
          text-align: center;
          width: 100%;
        }
        .doc-type-individual_work_plan p, .doc-type-individual_work_plan li {
          margin-bottom: 2px !important;
          line-height: 1.2 !important;
        }
        .doc-type-individual_work_plan table {
          margin-bottom: 15px !important;
          table-layout: fixed !important;
        }
        .doc-type-individual_work_plan table th:nth-child(1),
        .doc-type-individual_work_plan table td:nth-child(1) { width: 12% !important; }
        .doc-type-individual_work_plan table th:nth-child(2),
        .doc-type-individual_work_plan table td:nth-child(2) { width: 25% !important; }
        .doc-type-individual_work_plan table th:nth-child(3),
        .doc-type-individual_work_plan table td:nth-child(3) { width: 25% !important; }
        .doc-type-individual_work_plan table th:nth-child(4),
        .doc-type-individual_work_plan table td:nth-child(4) { width: 25% !important; }
        .doc-type-individual_work_plan table th:nth-child(5),
        .doc-type-individual_work_plan table td:nth-child(5) { width: 13% !important; }

        .overall-rating-box {
          display: block;
          width: 180px;
          height: 50px;
          border: 2px solid #000;
          margin: 15px 0;
          position: relative;
          background: #fff;
        }
        .score-label {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 9pt;
          font-weight: bold;
          text-transform: uppercase;
        }

        .doc-type-individual_work_plan .workplan-table th {
          padding: 8px !important;
          border: 1px solid #000 !important;
          background-color: #f1f5f9 !important;
          font-weight: bold !important;
          font-size: 11pt !important;
          text-transform: uppercase !important;
        }

        .doc-type-individual_work_plan .workplan-container {
          padding: 0 10px;
          break-inside: auto;
        }

        @media print {
          .doc-type-individual_work_plan .workplan-table {
            break-inside: auto !important;
          }
          .doc-type-individual_work_plan .workplan-table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }

        /* Weekly Forecast Intelligent Dynamic One-Page Fitting and Sizing */
        .doc-type-weekly_forecast {
          font-size: ${wfTableFontSize} !important;
        }
        .doc-type-weekly_forecast table {
          table-layout: fixed !important;
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: avoid !important;
          font-size: ${wfTableFontSize} !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }
        .doc-type-weekly_forecast td, .doc-type-weekly_forecast th {
          padding: ${wfTablePadding} !important;
          font-size: ${wfTableTdFontSize} !important;
          line-height: ${wfLineHeight} !important;
          word-break: break-word !important;
          border: 0.5pt solid black !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          font-weight: normal !important;
        }
        .doc-type-weekly_forecast td {
          height: 27.5mm !important;
        }
        .doc-type-weekly_forecast th {
          font-size: ${wfTableThFontSize} !important;
          font-weight: 800 !important;
          background-color: #f8fafc !important;
        }
        
        /* Dynamic Proportional Header Overrides for Custom Preambles */
        .doc-type-weekly_forecast center h2 {
          font-size: ${wfHeaderSubSize} !important;
          margin: ${wfHeaderMarginTop} 0 ${wfHeaderMarginBottom} 0 !important;
          line-height: ${wfLineHeight} !important;
        }
        .doc-type-weekly_forecast center h1 {
          font-size: ${wfHeaderTitleSize} !important;
          margin: ${wfHeaderMarginTop} 0 ${wfHeaderMarginBottom} 0 !important;
          line-height: ${wfLineHeight} !important;
        }
        .doc-type-weekly_forecast center h3 {
          font-size: calc(${wfHeaderSubSize} - 1pt) !important;
          margin: ${wfHeaderMarginTop} 0 ${wfHeaderMarginBottom} 0 !important;
          line-height: ${wfLineHeight} !important;
        }
        .doc-type-weekly_forecast center p {
          font-size: calc(${wfTableFontSize} + 1pt) !important;
          margin: ${wfHeaderMarginTop} 0 ${wfHeaderMarginBottom} 0 !important;
          line-height: ${wfLineHeight} !important;
        }
        .doc-type-weekly_forecast div[style*="font-size"] {
          font-size: ${wfTableFontSize} !important;
          line-height: ${wfLineHeight} !important;
          margin-bottom: ${wfMetaBoxMarginBottom} !important;
          padding: ${wfMetaBoxPadding} !important;
        }

        @media print {
          .doc-type-weekly_forecast {
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          .doc-type-weekly_forecast table {
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
          }
        }
        
        /* Curriculum-specific Column Widths for CBC Weekly Forecast (10 columns) */
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(1), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(1) { width: 4.5% !important; text-align: center; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(2), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(2) { width: 8% !important; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(3), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(3) { width: 8% !important; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(4), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(4) { width: 15% !important; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(5), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(5) { width: 10.5% !important; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(6), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(6) { width: 25.5% !important; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(7), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(7) { width: 6.5% !important; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(8), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(8) { width: 7% !important; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(9), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(9) { width: 8% !important; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(10), .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(10) { width: 7% !important; }

        /* Curriculum-specific Column Widths for OBC Weekly Forecast (11 columns) */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(1), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(1) { width: 3% !important; text-align: center; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(2), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(2) { width: 6.5% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(3), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(3) { width: 6.5% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(4), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(4) { width: 14% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(5), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(5) { width: 13% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(6), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(6) { width: 12% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(7), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(7) { width: 10% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(8), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(8) { width: 6% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(9), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(9) { width: 6% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(10), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(10) { width: 8% !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(11), .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(11) { width: 15% !important; }
       `}</style>
    </div>
  );
}

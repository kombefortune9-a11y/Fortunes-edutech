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
  AlertTriangle,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Zap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { GenerationParams, fixAndAlignTableColumns } from "../services/geminiService";
import { cn } from "../lib/utils";
import { useAuth } from "./FirebaseProvider";
import { isDeveloperEmail, TRIAL_VIEW_LIMITS } from "../constants";
import { TRIAL_DOC_NAMES } from "../lib/trialViewCheck";
import { AccessModal } from "./AccessModal";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, recordActivity } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";
import { parseAndSegmentSchemesContent, SegmentedScheme } from "../services/segmentedSchemesService";

interface DocPreviewProps {
  content: string;
  metadata: GenerationParams & { docId?: string };
  onBack: () => void;
  onNavigate?: (section: string) => void;
}

export function DocPreview({ content, metadata, onBack, onNavigate }: DocPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingWord, setGeneratingWord] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [visualHtml, setVisualHtml] = useState<string>("");
  const [initialEditHtml, setInitialEditHtml] = useState<string>("");
  const [hasBeenEdited, setHasBeenEdited] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorHtmlRef = useRef<string>("");

  // Segment Schemes to Weekly Forecasts State
  const [showSegmentModal, setShowSegmentModal] = useState<boolean>(false);
  const [segmentProgress, setSegmentProgress] = useState<number>(0);
  const [segmentStatusText, setSegmentStatusText] = useState<string>('');
  const [isSegmenting, setIsSegmenting] = useState<boolean>(false);
  const [segmentComplete, setSegmentComplete] = useState<boolean>(false);
  const [segmentResult, setSegmentResult] = useState<SegmentedScheme | null>(null);
  const [segmentError, setSegmentError] = useState<string | null>(null);

  const handleStartSegmentation = async () => {
    setShowSegmentModal(true);
    setIsSegmenting(true);
    setSegmentComplete(false);
    setSegmentError(null);
    setSegmentProgress(5);
    setSegmentStatusText('Initializing 13-week segmentation analysis...');

    try {
      const result = await parseAndSegmentSchemesContent(
        localContent || content,
        metadata,
        (pct, text) => {
          setSegmentProgress(pct);
          setSegmentStatusText(text);
        }
      );
      setSegmentResult(result);
      setSegmentComplete(true);
      toast.success('Schemes segmented and preserved for 3 months!');
    } catch (err: any) {
      console.error('Segmentation error:', err);
      setSegmentError(err.message || 'An error occurred during segmentation.');
    } finally {
      setIsSegmenting(false);
    }
  };

  const docKey = `${metadata.type}_${metadata.subject}_${metadata.grade}_${metadata.topic || ''}_${metadata.term || ''}`;
  const docKeyRef = useRef(docKey);
  const initialContentRef = useRef(content);

  // AI Quality Feedback States
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackType, setFeedbackType] = useState<'up' | 'down' | null>(null);
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // Sync localContent ONLY when a genuinely new document is passed from parent
  useEffect(() => {
    if (content !== initialContentRef.current || docKey !== docKeyRef.current) {
      initialContentRef.current = content;
      docKeyRef.current = docKey;
      setLocalContent(content);
      setVisualHtml("");
      setInitialEditHtml("");
      editorHtmlRef.current = "";
      setHasBeenEdited(false);
      setFeedbackSubmitted(false);
      setFeedbackType(null);
      setShowCommentForm(false);
      setFeedbackComment("");
    }
  }, [content, docKey]);

  // Synchronize initial editor HTML only once when entering edit mode, preventing cursor jumps
  useEffect(() => {
    if (isEditing && editorRef.current && initialEditHtml) {
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML === '') {
        editorRef.current.innerHTML = initialEditHtml;
      }
    }
  }, [isEditing, initialEditHtml]);

  // Real-time capturing of keystrokes inside contentEditable to prevent loss without causing React re-renders that reset the cursor
  const handleEditorInput = () => {
    if (editorRef.current) {
      editorHtmlRef.current = editorRef.current.innerHTML;
      try {
        safeLocalStorage.setItem(`eduplan_active_edit_${docKeyRef.current}`, editorRef.current.innerHTML);
      } catch (e) {
        // ignore cache quota
      }
    }
  };

  const handleEditorBlur = () => {
    if (editorRef.current) {
      editorHtmlRef.current = editorRef.current.innerHTML;
      try {
        safeLocalStorage.setItem(`eduplan_active_edit_${docKeyRef.current}`, editorRef.current.innerHTML);
      } catch (e) {
        // ignore
      }
    }
  };

  // Handle toggling edit mode
  const handleToggleEdit = () => {
    if (effectiveTrialMode) {
      toast.error("In-app document editing is disabled in Free Trial View-Only mode. Please subscribe to an active circle to edit documents.", { duration: 5000 });
      setShowAccessModal(true);
      return;
    }
    if (!isEditing) {
      // Starting editing: capture what is currently displayed in the document
      const docEl = document.getElementById("printable-document");
      const startHtml = visualHtml || (docEl && docEl.innerHTML) || cleanContent;
      editorHtmlRef.current = startHtml;
      setInitialEditHtml(startHtml);
      setHasBeenEdited(true);
      setIsEditing(true);
    } else {
      // Finishing / Saving editing
      handleVisualSave();
    }
  };

  // Handle visual edit saving
  const handleVisualSave = async () => {
    const currentHtml = editorRef.current?.innerHTML || editorHtmlRef.current;
    if (currentHtml) {
      setVisualHtml(currentHtml);
      setLocalContent(currentHtml);
      setHasBeenEdited(true);
      try {
        safeLocalStorage.setItem(`eduplan_active_edit_${docKeyRef.current}`, currentHtml);
      } catch (e) {
        // ignore
      }

      // If this document was opened from Recent Documents, sync edits back to Firestore & local cache
      if (metadata.docId && user && user.uid !== 'guest_teacher') {
        try {
          const docRef = doc(db, 'users', user.uid, 'downloads', metadata.docId);
          await updateDoc(docRef, { content: currentHtml });
          
          // Also update local cache for instant offline view
          const cacheKey = `eduplan_downloads_cache_${user.uid}`;
          const stored = safeLocalStorage.getItem(cacheKey);
          if (stored) {
            const list = JSON.parse(stored);
            const updated = list.map((item: any) => {
              if (item.id === metadata.docId) {
                return { ...item, content: currentHtml };
              }
              return item;
            });
            safeLocalStorage.setItem(cacheKey, JSON.stringify(updated));
            safeLocalStorage.setItem('eduplan_downloads', JSON.stringify(updated));
          }
        } catch (dbErr) {
          console.error("Failed to sync edited content back to Recent Documents:", dbErr);
        }
      }

      toast.success("Edits saved successfully!", { duration: 2500 });
    }
    setIsEditing(false);
  };

  const ensureEditingCommitted = () => {
    if (isEditing) {
      const currentHtml = editorRef.current?.innerHTML || editorHtmlRef.current;
      if (currentHtml) {
        setVisualHtml(currentHtml);
        setLocalContent(currentHtml);
        setHasBeenEdited(true);
        try {
          safeLocalStorage.setItem(`eduplan_active_edit_${docKeyRef.current}`, currentHtml);
        } catch (e) {
          // ignore
        }
      }
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
  const { 
    user, 
    incrementLocalDownloads, 
    subscriptionDetails, 
    downloadRecords, 
    isWhitelisted, 
    recordTrialDocView, 
    trialViewCounts, 
    canTrialUserViewDoc 
  } = useAuth();
  const [showAccessModal, setShowAccessModal] = useState<boolean>(false);

  const isDev = isDeveloperEmail(user?.email);
  const isTrial = !isWhitelisted || subscriptionDetails?.isTrialMode || subscriptionDetails?.subscriptionType === 'guest_trial';
  const effectiveTrialMode = isTrial && !isDev;

  const docSessionKey = metadata.docId || `${metadata.type}_${metadata.grade}_${metadata.subject}_${metadata.topic || ''}_${metadata.term || ''}`;

  // Record trial document view
  useEffect(() => {
    if (metadata?.type && effectiveTrialMode) {
      recordTrialDocView(metadata.type, docSessionKey);
    }
  }, [metadata?.type, metadata?.grade, metadata?.subject, metadata?.topic, metadata?.term, effectiveTrialMode, docSessionKey]);

  const trialCheck = canTrialUserViewDoc(metadata?.type || '');
  const isViewLimitBlocked = effectiveTrialMode && !trialCheck.allowed;

  const checkDownloadAccess = (): boolean => {
    if (effectiveTrialMode) {
      toast.error(
        "Downloads & printing are disabled in Free Trial View-Only mode. Please subscribe to an active Subscription Circle (Weekly, 14-day, Monthly, Termly, or Unlimited) to download files.",
        { id: 'trial-download-disabled-toast', duration: 7000 }
      );
      setShowAccessModal(true);
      return false;
    }
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
    ensureEditingCommitted();
    const currentUserId = user?.uid || 'guest_teacher';
    const markdownSource = localContent || cleanContent || "";
    const effectiveSyncContent = (hasBeenEdited && visualHtml) ? visualHtml : (markdownSource || visualHtml);

    try {
      // Instantly cache in localStorage so sync is active immediately without waiting
      try {
        const syncItem = {
          id: `sync_${Date.now()}`,
          content: effectiveSyncContent,
          fullText: markdownSource,
          visualHtml: visualHtml || "",
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

      // Notify user instantly about success
      toast.success("Information is saved successfully! Active and ready for smooth weekly & lessons synchronization.", { duration: 3000 });

      // Perform Firestore write completely in the background without blocking the UI
      if (user && user.uid !== 'guest_teacher') {
        const syncRef = collection(db, "users", currentUserId, "sync_sources");
        addDoc(syncRef, {
          content: effectiveSyncContent,
          fullText: markdownSource,
          visualHtml: visualHtml || "",
          metadata: metadata,
          timestamp: serverTimestamp(),
          isActive: true,
          subject: metadata.subject,
          grade: metadata.grade,
          type: metadata.type
        }).catch(err => {
          console.warn("Background Firestore sync write fallback:", err);
        });
      }
    } catch (err) {
      console.warn("Sync save error:", err);
      toast.success("Information is saved successfully! Active and ready for smooth weekly & lessons synchronization.", { duration: 3000 });
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

    // Strip duplicate "Grade" in GRADE headers (e.g., "GRADE: Grade 2" -> "GRADE: 2" or "GRADE: Grade 10" -> "GRADE: 10")
    text = text.replace(/(<strong>\s*GRADE:\s*<\/strong>\s*)Grade\s+/gi, "$1");
    text = text.replace(/(<b>\s*GRADE:\s*<\/b>\s*)Grade\s+/gi, "$1");
    text = text.replace(/(\bGRADE:\s*)Grade\s+/gi, "$1");

    // Remove unwanted vertical line breaks or <br> immediately after general header labels so Teacher's Name, Grade, Subject, Date, etc. go horizontally
    text = text.replace(/(<strong>\s*(?:TEACHER'S NAME|NAME OF TEACHER|TEACHER|GRADE|SUBJECT|DATE|TIME|DURATION|YEAR|TERM|YEAR\/TERM|ATTENDANCE):\s*<\/strong>)\s*<br\s*\/?>\s*/gi, "$1 ");
    text = text.replace(/(<b>\s*(?:TEACHER'S NAME|NAME OF TEACHER|TEACHER|GRADE|SUBJECT|DATE|TIME|DURATION|YEAR|TERM|YEAR\/TERM|ATTENDANCE):\s*<\/b>)\s*<br\s*\/?>\s*/gi, "$1 ");
    text = text.replace(/((?:TEACHER'S NAME|NAME OF TEACHER|TEACHER|GRADE|SUBJECT|DATE|TIME|DURATION|YEAR|TERM|YEAR\/TERM|ATTENDANCE):)\s*<br\s*\/?>\s*/gi, "$1 ");

    // Handle split TEACHER'S and NAME:
    text = text.replace(/TEACHER'S\s*<br\s*\/?>\s*NAME:/gi, "TEACHER'S NAME:");
    text = text.replace(/<strong>TEACHER'S<\/strong>\s*<br\s*\/?>\s*<strong>NAME:<\/strong>/gi, "<strong>TEACHER'S NAME:</strong>");
    text = text.replace(/<b>TEACHER'S<\/b>\s*<br\s*\/?>\s*<b>NAME:<\/b>/gi, "<b>TEACHER'S NAME:</b>");

    // Replace spaces in Week X, Day X, Lesson X with non-breaking spaces so they never wrap or fall back
    text = text.replace(/\bWeek\s+(\d+)\b/gi, "Week&nbsp;$1");
    text = text.replace(/\bDay\s+(\d+)\b/gi, "Day&nbsp;$1");
    text = text.replace(/\bLesson\s+(\d+)\b/gi, "Lesson&nbsp;$1");

    // Strip TS Number, Zone, and Attendance for Schemes of Work and Weekly Forecast as requested by the user
    if (metadata?.type === "schemes_of_work" || metadata?.type === "weekly_forecast") {
      text = text.replace(/(?:<strong>|<b>)?\s*ATTENDANCE:\s*(?:<\/strong>|<\/b>)?\s*(?:\([^)]*\)|[^\n\r<]*)/gi, "");
      text = text.replace(/(?:<strong>|<b>)?\s*ZONE:\s*(?:<\/strong>|<\/b>)?\s*[^\n\r<]*/gi, "");
      text = text.replace(/(?:<strong>|<b>)?\s*TS\s*NUMBER:\s*(?:<\/strong>|<\/b>)?\s*[^\n\r<]*/gi, "");
      text = text.replace(/(?:<strong>|<b>)?\s*TS\s*NO:\s*(?:<\/strong>|<\/b>)?\s*[^\n\r<]*/gi, "");

      if (metadata?.type === "weekly_forecast") {
        text = text.replace(/<span[^>]*>\s*(?:<b>)?\s*WEEK:\s*(?:<\/b>)?\s*[^<]*\/\/\s*(?:<b>)?\s*TERM:\s*(?:<\/b>)?\s*[^<]*<\/span>\s*<br\s*\/?>?/gi, "");

        const gLowMeta = (metadata?.grade || "").toLowerCase();
        const targetHeaderTitle = "WEEKLY FORECAST";

        text = text.replace(/WEEKLY FORECAST\s*(?:&amp;|&|\/|,|and)?\s*RECORD OF WORK/gi, targetHeaderTitle);
        text = text.replace(/(<strong[^>]*>)\s*RECORD OF WORK\s*(<\/strong>)/gi, `$1WEEKLY FORECAST$2`);
        text = text.replace(/(<h[123][^>]*>)\s*RECORD OF WORK\s*(<\/h[123]>)/gi, `$1WEEKLY FORECAST$2`);

        // Strip "(from the uploaded scheme)" or anything added after page dotted lines
        text = text.replace(/\s*\(from the uploaded scheme\)/gi, "");
        text = text.replace(/(Page:\s*\.{3,})\s*(?:\(?from the uploaded scheme\)?|[^\n|<]*)/gi, "$1");
      }

      // Strip bracketed local language vernacular terms in non-Zambian Language subjects
      const sLowSub = (metadata?.subject || "").toLowerCase();
      const isZambianLanguageSubject = sLowSub.includes("zambian language") ||
        sLowSub.includes("cinyanja") || sLowSub.includes("nyanja") ||
        sLowSub.includes("icibemba") || sLowSub.includes("bemba") ||
        sLowSub.includes("chitonga") || sLowSub.includes("tonga") ||
        sLowSub.includes("silozi") || sLowSub.includes("lozi") ||
        sLowSub.includes("kiikaonde") || sLowSub.includes("kaonde") ||
        sLowSub.includes("luvale") || sLowSub.includes("lunda");

      if (!isZambianLanguageSubject) {
        text = text.replace(/\s*\([^)]*(?:amanshi|amenshi|ukunwa|ukuba|ayasuma|uku-ipika|ukusefa|inyali|icefuko|mulembe|ubwali|icibemba|cinyanja|chitonga|silozi|kaonde|luvale|lunda|chibemba|nyanja)[^)]*\)/gi, "");
      }

      // Standardize general-info-table structure for Weekly Forecast
      if (metadata?.type === "weekly_forecast" || text.includes("WEEKLY FORECAST") || text.includes("RECORD OF WORK")) {
        const anyTableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
        let match;
        let targetTableHtml = "";
        let targetTableInner = "";

        while ((match = anyTableRegex.exec(text)) !== null) {
          const inner = match[1];
          if (inner.toUpperCase().includes("NAME OF TEACHER") || inner.toUpperCase().includes("TEACHER'S NAME") || inner.toUpperCase().includes("TEACHER:")) {
            targetTableHtml = match[0];
            targetTableInner = inner;
            break;
          }
        }

        // Retrieve registered profile from localStorage if metadata is missing fields
        let savedTeacherInfo: any = null;
        try {
          const raw = localStorage.getItem('teacher_info');
          if (raw) savedTeacherInfo = JSON.parse(raw);
        } catch (e) {}

        // Also check if text has a school header (e.g. ## CHANGWE LUNGO PRIMARY SCHOOL)
        let extractedSchool = "";
        const schoolHeaderMatch = text.match(/<h2[^>]*>([^<]+(?:PRIMARY|SECONDARY|BASIC|COMBINED|COMMUNITY|DAY)?\s*SCHOOL|[^<]+ACADEMY|[^<]+COLLEGE)<\/h2>/i) ||
                                  text.match(/^##\s+([^\n]+(?:SCHOOL|ACADEMY|COLLEGE))/im);
        if (schoolHeaderMatch && schoolHeaderMatch[1]) {
          extractedSchool = schoolHeaderMatch[1].trim();
        }

        const rawTeacher = metadata?.teacherName || savedTeacherInfo?.teacherName || "Teacher";
        const rawGrade = metadata?.grade || "1";
        const rawSubject = metadata?.subject || "Mathematics and Science";
        const rawYear = metadata?.year || new Date().getFullYear().toString();
        const rawTerm = metadata?.term || "3";
        const rawWeek = metadata?.forecastWeek || metadata?.weekNumber || "1";
        const rawSchool = (metadata?.school || savedTeacherInfo?.school || extractedSchool || "SCHOOL").toUpperCase();

        if (targetTableHtml && targetTableInner) {
          const cleanTable = `<table class="general-info-table" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; border-left: none; border-right: none;">
  <tr>
    <td style="padding: 3px 4px; font-size: 9.5pt; vertical-align: middle; border: none; width: 40%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>NAME OF TEACHER:</strong> ${rawTeacher}</td>
    <td style="padding: 3px 4px; font-size: 9.5pt; vertical-align: middle; border: none; width: 30%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>GRADE:</strong> ${rawGrade}</td>
    <td style="padding: 3px 4px; font-size: 9.5pt; vertical-align: middle; border: none; width: 30%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>SUBJECT:</strong> ${rawSubject}</td>
  </tr>
  <tr>
    <td style="padding: 3px 4px; font-size: 9.5pt; vertical-align: middle; border: none; width: 40%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>YEAR/TERM:</strong> ${rawYear} / TERM ${rawTerm}</td>
    <td style="padding: 3px 4px; font-size: 9.5pt; vertical-align: middle; border: none; width: 30%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>WEEK:</strong> ${rawWeek}</td>
    <td style="padding: 3px 4px; font-size: 9.5pt; vertical-align: middle; border: none; width: 30%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>SCHOOL:</strong> ${rawSchool}</td>
  </tr>
</table>`;
          text = text.replace(targetTableHtml, cleanTable);
        }
      }

      // Clean up any legacy corrupted table headers inserted inside general info table
      text = text.replace(/\|\s*GRADE:[^|\n\r]*\|\s*YEAR:[^|\n\r]*\|[ \t]*\r?\n?/gi, "");
      text = text.replace(/\|\s*NAME OF TEACHER:[^|\n\r]*\|\s*SUBJECT:[^|\n\r]*\|[ \t]*\r?\n?/gi, "");
      text = text.replace(/(NAME OF TEACHER:[^\n]*)\n*\|\s*DAY\s*\|\s*TOPIC\/Subtopics[^\n]*\n*\|:?---[^\n]*/gi, "$1");
      text = text.replace(/(GRADE:[^\n]*)\n*\|\s*DAY\s*\|\s*TOPIC\/Subtopics[^\n]*\n*\|:?---[^\n]*/gi, "$1");
      text = text.replace(/\|\s*DAY\s*\|\s*TOPIC\/Subtopics[^\n]*\n*\|:?---[^\n]*\n*\|\s*GRADE:[^\n]*/gi, "");

      // Re-run table aligner to ensure 9/10 columns are formatted cleanly
      text = fixAndAlignTableColumns(text, {
        type: metadata.type as any,
        grade: metadata.grade,
        subject: metadata.subject,
        curriculumType: metadata.curriculumType
      });
    }

    // Fix old general-info-table structure if present in lesson plan to ensure clean horizontal layout
    if (metadata?.type === "lesson_plan" || text.includes("LESSON PLAN")) {
      // Find any table that contains "TEACHER'S NAME", "TEACHER", or "NAME OF TEACHER" to be 100% robust
      const anyTableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
      let match;
      let targetTableHtml = "";
      let targetTableInner = "";
      
      while ((match = anyTableRegex.exec(text)) !== null) {
        const inner = match[1];
        if (inner.toUpperCase().includes("TEACHER'S NAME") || inner.toUpperCase().includes("NAME OF TEACHER") || inner.toUpperCase().includes("TEACHER:")) {
          targetTableHtml = match[0];
          targetTableInner = inner;
          break; // Found the general info table!
        }
      }

      if (targetTableHtml && targetTableInner) {
        // Clean any <br> or <br/> tags from the table first to avoid regex issues on line breaks
        const tableInner = targetTableInner.replace(/<br\s*\/?>/gi, " ");
        
        const extractField = (pattern: RegExp, fallback: string = "..........") => {
          const m = tableInner.match(pattern);
          if (m && m[1]) {
            let val = m[1].replace(/<[^>]+>/g, '').trim();
            // Remove double colons, empty fields or placeholders
            if (val === ":" || val === "::" || !val || val === "..........") {
              return fallback;
            }
            if (val.startsWith(":")) {
              val = val.substring(1).trim();
            }
            return val || fallback;
          }
          return fallback;
        };

        const rawTeacher = extractField(/(?:TEACHER'S NAME|NAME OF TEACHER|TEACHER):?\s*([^<>\n\r&]+)/i, metadata.teacherName || "Kombe fortune");
        const rawDate = extractField(/DATE:?\s*([^<>\n\r&]+)/i, metadata.date || "..........");
        const rawGrade = extractField(/GRADE:?\s*([^<>\n\r&]+)/i, metadata.grade || "..........");
        const rawYear = extractField(/YEAR:?\s*([0-9]{4})/i, metadata.year || "2026");
        const rawTerm = extractField(/TERM:?\s*([0-9]+)/i, metadata.term || "1");
        const rawTime = extractField(/TIME:?\s*([^<>\n\r&]+)/i, metadata.time || "..........");
        const rawSubject = extractField(/SUBJECT:?\s*([^<>\n\r&]+)/i, metadata.subject || "..........");
        const rawDuration = extractField(/DURATION:?\s*([^<>\n\r&]+)/i, metadata.duration || "..........");

        let cleanGradeValue = "..........";
        if (rawGrade && rawGrade !== "..........") {
          const stripped = rawGrade.replace(/^Grade\s+/i, '').replace(/^GRADE\s+/i, '').trim();
          if (/^\d+$/.test(stripped)) {
            cleanGradeValue = `Grade ${stripped}`;
          } else {
            cleanGradeValue = rawGrade;
          }
        }
        
        // Clean duration field by removing "minutes", "mins", etc.
        const cleanDurationValue = rawDuration ? rawDuration.replace(/\s*(?:minutes|mins|minute|min)\b/gi, "").trim() || rawDuration : "..........";

        const newTable = `<table class="general-info-table" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; border-left: none; border-right: none;">
  <tr>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 35%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>TEACHER:</strong> ${rawTeacher}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 33%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>DATE:</strong> ${rawDate}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 32%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>Att: (BOYS:</strong> ....... &nbsp;&nbsp;&nbsp;&nbsp; <strong>GIRLS:</strong> .......<strong>)</strong></td>
  </tr>
  <tr>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 35%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>YEAR/TERM:</strong> ${rawYear} / TERM ${rawTerm}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 33%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>TIME:</strong> ${rawTime}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 32%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>DURATION:</strong> ${cleanDurationValue}</td>
  </tr>
</table>`;
        text = text.replace(targetTableHtml, newTable);

        // Remove any pre-existing GRADE/SUBJECT lines outside the table first, to ensure we control their exact placement and format
        text = text.replace(/<b>GRADE:<\/b>\s*[^<>\n\r]*<br\/?>\s*/gi, "");
        text = text.replace(/<b>SUBJECT:<\/b>\s*[^<>\n\r]*<br\/?>\s*/gi, "");
        text = text.replace(/GRADE:\s*[^<>\n\r]*<br\/?>\s*/gi, "");
        text = text.replace(/SUBJECT:\s*[^<>\n\r]*<br\/?>\s*/gi, "");

        // Prepend GRADE and SUBJECT exactly on top of TOPIC
        const topicRegex = /(<b>TOPIC:<\/b>|TOPIC:)/i;
        if (text.match(topicRegex)) {
          text = text.replace(topicRegex, `<b>GRADE:</b> ${cleanGradeValue}<br/>\n<b>SUBJECT:</b> ${rawSubject}<br/>\n$1`);
        }
      }
    }

    // LITERACY IN ENGLISH LESSON PLAN FORMATTING ENFORCEMENT:
    // Ensure INTRODUCTION section is outside the table, between EXPECTED STANDARD and LESSON DEVELOPMENT, and not in the table
    if (metadata?.type === "lesson_plan") {
      const sLowMeta = (metadata.subject || '').toLowerCase();
      const isLiteracy = (sLowMeta.includes('literacy') || (metadata as any).englishComponent === 'literacy') && !sLowMeta.includes('oral');
      if (isLiteracy) {
        let extractedTeacher = "";
        let extractedLearners = "";

        // Check if Introduction exists inside HTML <tr> table row (4 or 5 columns)
        const introTrRegex = /<tr[^>]*>\s*<td[^>]*>\s*(?:<b>)?\s*INTRODUCTION\s*(?:<\/b>)?\s*<\/td>(?:\s*<td[^>]*>[\s\S]*?<\/td>)?\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<\/tr>/i;
        const introTrMatch = text.match(introTrRegex);
        if (introTrMatch) {
          extractedTeacher = introTrMatch[1].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          extractedLearners = introTrMatch[2].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          text = text.replace(introTrRegex, '');
        }

        // Check if Introduction exists inside markdown table row (4 or 5 columns)
        const introTableRowRegex = /\|\s*(?:<b>)?\s*Introduction.*?(?:<\/b>)?\s*\|(?:[^|]*\|)?\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|[ \t]*\r?\n?/i;
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

    if (metadata?.type === "lesson_plan" && metadata?.curriculumType === "OBC") {
      // Strip LEARNING ACTIVITIES section
      text = text.replace(/<b>LEARNING ACTIVITIES:<\/b>(?:(?!<b>)[\s\S])*?(?=(?:<b>|<h3|<table|LESSON DEVELOPMENT|<\/div>|$))/gi, "");
      text = text.replace(/(?:<strong>)?LEARNING ACTIVITIES:?(?:<\/strong>)?(?:(?!<b>)[\s\S])*?(?=(?:<b>|<h3|<table|LESSON DEVELOPMENT|<\/div>|$))/gi, "");
      // Strip EXPECTED STANDARD section
      text = text.replace(/<b>EXPECTED STANDARDS?:<\/b>(?:(?!<b>)[\s\S])*?(?=(?:<b>|<h3|<table|LESSON DEVELOPMENT|<\/div>|$))/gi, "");
      text = text.replace(/(?:<strong>)?EXPECTED STANDARDS?:?(?:<\/strong>)?(?:(?!<b>)[\s\S])*?(?=(?:<b>|<h3|<table|LESSON DEVELOPMENT|<\/div>|$))/gi, "");
      
      // Clean up consecutive trailing line breaks
      text = text.replace(/(?:<br\s*\/?>\s*){2,}/gi, "<br/>");
    }

    // PRE-PASS FOR TABLES: Normalize any table rows that have pipes but miss leading/trailing pipes
    const rawTableLines = text.split('\n');
    const normalizedTableLines: string[] = [];
    for (let i = 0; i < rawTableLines.length; i++) {
      let l = rawTableLines[i].trim();
      const pipeCount = (l.match(/\|/g) || []).length;
      if (pipeCount >= 2 && !l.startsWith('<') && !l.startsWith('http')) {
        if (!l.startsWith('|')) l = '| ' + l;
        if (!l.endsWith('|')) l = l + ' |';
      }
      normalizedTableLines.push(l);
    }
    text = normalizedTableLines.join('\n');

    // Ensure blank line BEFORE the table starts (but NOT between table rows)
    // We only want to add a blank line if the previous line doesn't start with a pipe
    text = text.replace(/(^|\n)([^|\n\s][^\n]*)\n(\s*\|)/g, "$1$2\n\n$3");

    // Sometimes the AI might output |:---|:---| (missing leading/trailing pipes in alignment row)
    // We should ensure that if a line looks like an alignment row, it has leading/trailing pipes
    text = text.replace(/^(\s*):-+(|:|-)+(\s*)$/gm, "|$1$2$3|");

    // CRITICAL TABLE REPAIR PASS: Ensure markdown table rows are contiguous, cells do not contain unescaped raw newlines,
    // and inject missing GFM table delimiter rows (|:---|:---|) if Gemini omitted them.
    const textLines = text.split('\n');
    const fixedLines: string[] = [];
    let inTable = false;
    let currentTableColCount = 0;

    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      const trimmed = line.trim();

      const startsWithPipe = trimmed.startsWith("|");

      if (startsWithPipe) {
        let formattedRow = trimmed;
        if (!formattedRow.endsWith("|")) formattedRow += " |";

        const isDelimiter = /^\s*\|?\s*:?-{3,}:?\s*(\||\s*$)/.test(formattedRow) || /^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(formattedRow);

        if (!inTable) {
          inTable = true;
          currentTableColCount = Math.max(2, (formattedRow.match(/\|/g) || []).length - 1);
          fixedLines.push(formattedRow);

          // Check if the next non-empty line is a delimiter line
          let nextIdx = i + 1;
          while (nextIdx < textLines.length && textLines[nextIdx].trim() === "") {
            nextIdx++;
          }
          const nextLine = (nextIdx < textLines.length) ? textLines[nextIdx].trim() : "";
          const nextIsDelimiter = /^\s*\|?\s*:?-{3,}:?\s*(\||\s*$)/.test(nextLine) || /^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(nextLine);

          if (!nextIsDelimiter) {
            const autoDelimiter = '|' + ' :--- |'.repeat(currentTableColCount);
            fixedLines.push(autoDelimiter);
          }
        } else {
          fixedLines.push(formattedRow);
        }
      } else if (inTable) {
        if (trimmed === "") {
          // Check if the next non-empty line starts with a pipe or has multiple pipes
          let nextIdx = i + 1;
          while (nextIdx < textLines.length && textLines[nextIdx].trim() === "") {
            nextIdx++;
          }
          if (nextIdx < textLines.length && (textLines[nextIdx].trim().startsWith("|") || (textLines[nextIdx].trim().match(/\|/g) || []).length >= 2)) {
            // Skip this blank line inside the table to keep rows contiguous
            continue;
          } else {
            inTable = false;
            currentTableColCount = 0;
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
          currentTableColCount = 0;
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

    // TABLE CELL BULLETING PASS ("BULLETINS"):
    // Ensures all Specific Outcomes, Competencies, Expected Standards, Learning Activities, Knowledge, Skills, Values,
    // Teaching Methods, T/L Aids, and multiple Subtopics in table cells have clear bullet points (• ) showing where each starts.
    const tableProcessedLines = text.split('\n');
    let currentTableHeaders: string[] = [];
    let insideTableRows = false;

    const bulletCell = (cellText: string, header: string): string => {
      const trimmedCell = cellText.trim();
      if (!trimmedCell || trimmedCell === '-' || trimmedCell === '...' || trimmedCell === 'N/A' || trimmedCell === '......') {
        return cellText;
      }
      const h = header.toLowerCase().replace(/[^a-z0-9]/g, ' ');
      // Columns that require bulleting:
      const needsBullet = 
        h.includes('outcome') || 
        h.includes('competenc') || 
        h.includes('standard') || 
        h.includes('activit') || 
        h.includes('knowledge') || 
        h.includes('skill') || 
        h.includes('value') || 
        h.includes('method') || 
        h.includes('aid') || 
        h.includes('material') || 
        h.includes('indicator') || 
        h.includes('teacher') || 
        h.includes('learner');

      if (!needsBullet) {
        // Handle TOPIC/Subtopics formatting to strictly match Schemes of Work standard:
        if (h.includes('topic') || h.includes('subtopic') || h.includes('sub topic')) {
          // If the cell already contains <small> and (<b> or <strong>), ensure structure is preserved
          if (trimmedCell.toLowerCase().includes('<small>') && (trimmedCell.toLowerCase().includes('<b>') || trimmedCell.toLowerCase().includes('<strong>'))) {
            return ' ' + trimmedCell + ' ';
          }

          // If the cell has multiple lines or <br> separating topic and subtopic
          const rawLines = trimmedCell.split(/<br\s*\/?>/i).map(l => l.trim()).filter(Boolean);
          if (rawLines.length >= 2) {
            const mainTopic = rawLines[0].replace(/^[#*_\-\s]+/, '').replace(/[*_#]+$/, '').trim();
            const subtopics = rawLines.slice(1).map(line => {
              const clean = line.replace(/<\/?(?:small|b|strong|i|em|span|p|div)[^>]*>/gi, '').trim();
              const withBullet = (clean.startsWith('•') || /^\d+[\.\)]/.test(clean)) ? clean : `• ${clean}`;
              return `<small><b>${withBullet}</b></small>`;
            }).join('<br/>');
            return ` ${mainTopic}<br/><br/>${subtopics} `;
          }

          // If the cell has a colon separating topic and subtopic (e.g. "3.8 FRACTIONS: Addition of fractions")
          if (trimmedCell.includes(':') && !trimmedCell.toLowerCase().startsWith('http')) {
            const colonParts = trimmedCell.split(':');
            const mainTopic = colonParts[0].replace(/^[#*_\-\s]+/, '').replace(/[*_#]+$/, '').trim();
            const subtopic = colonParts.slice(1).join(':').replace(/<\/?(?:small|b|strong|i|em|span)[^>]*>/gi, '').trim();
            if (subtopic) {
              const withBullet = (subtopic.startsWith('•') || /^\d+[\.\)]/.test(subtopic)) ? subtopic : `• ${subtopic}`;
              return ` ${mainTopic}<br/><br/><small><b>${withBullet}</b></small> `;
            }
          }

          // If the cell only contains a subtopic (e.g. starting with bullet or number or long descriptive sentence)
          const isOnlySubtopic = /^[•\-\*\d\.)]/.test(trimmedCell) || trimmedCell.length > 25;
          if (isOnlySubtopic) {
            const mainTopicFallback = (metadata?.topic && metadata.topic !== 'N/A') ? metadata.topic : '';
            const clean = trimmedCell.replace(/<\/?(?:small|b|strong|i|em|span)[^>]*>/gi, '').trim();
            const withBullet = (clean.startsWith('•') || /^\d+[\.\)]/.test(clean)) ? clean : `• ${clean}`;
            if (mainTopicFallback) {
              return ` ${mainTopicFallback}<br/><br/><small><b>${withBullet}</b></small> `;
            } else {
              return ` <small><b>${withBullet}</b></small> `;
            }
          }

          return cellText;
        }
        return cellText;
      }

      // If cell has "Oral:" or "Literacy:" sections, preserve them cleanly while bulleting items within each section
      if (trimmedCell.includes('Oral:') || trimmedCell.includes('Literacy:') || trimmedCell.includes('<b>Oral:') || trimmedCell.includes('<b>Literacy:')) {
        const sections = trimmedCell.split(/(?=(?:<br\s*\/?>\s*)?(?:<b>)?(?:Oral|Literacy):)/i).map(s => s.trim()).filter(Boolean);
        if (sections.length > 1) {
          return ' ' + sections.map(sec => {
            const headMatch = sec.match(/^((?:<br\s*\/?>\s*)?(?:<b>)?(?:Oral|Literacy):?(?:<\/b>)?)\s*([\s\S]*)/i);
            if (headMatch) {
              const secHead = headMatch[1];
              const secBody = headMatch[2].trim();
              if (!secBody) return secHead;
              const bodyLines = secBody.split(/<br\s*\/?>|;\s+/gi).map(s => s.trim()).filter(Boolean);
              const bulletedBody = bodyLines.map(item => {
                const cleaned = item.replace(/^[•\-\*]\s*/, '').trim();
                return cleaned ? `• ${cleaned}` : '';
              }).filter(Boolean).join('<br/>');
              return `${secHead}<br/>${bulletedBody}`;
            }
            return sec;
          }).join('<br/>') + ' ';
        }
      }

      // Split items by <br/>, semicolons, or existing bullet characters
      const items = trimmedCell.split(/<br\s*\/?>|;\s+/gi).map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        const bulletedItems = items.map(item => {
          const cleaned = item.replace(/^[•\-\*]\s*/, '').trim();
          if (!cleaned) return '';
          return `• ${cleaned}`;
        }).filter(Boolean);

        if (bulletedItems.length > 0) {
          return ' ' + bulletedItems.join('<br/>') + ' ';
        }
      }

      return cellText;
    };

    const finalProcessedLines: string[] = [];
    for (let i = 0; i < tableProcessedLines.length; i++) {
      const line = tableProcessedLines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const rawCells = trimmed.slice(1, -1).split('|');
        const isHeaderRow = rawCells.some(c => {
          const cLow = c.toLowerCase();
          return cLow.includes('week') || cLow.includes('day') || cLow.includes('topic') || cLow.includes('stage') || cLow.includes('competenc') || cLow.includes('outcome');
        });
        const isSeparatorRow = rawCells.every(c => /^[\s:-]+$/.test(c));

        if (isHeaderRow && !isSeparatorRow) {
          currentTableHeaders = rawCells.map(c => c.trim());
          insideTableRows = true;
          finalProcessedLines.push(line);
        } else if (isSeparatorRow) {
          finalProcessedLines.push(line);
        } else if (insideTableRows && currentTableHeaders.length > 0) {
          const newCells = rawCells.map((cell, cIdx) => {
            const header = currentTableHeaders[cIdx] || '';
            return bulletCell(cell, header);
          });
          finalProcessedLines.push('|' + newCells.join('|') + '|');
        } else {
          finalProcessedLines.push(line);
        }
      } else {
        insideTableRows = false;
        finalProcessedLines.push(line);
      }
    }
    text = finalProcessedLines.join('\n');

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

  // Dynamic Sizing for Weekly Forecast - Strictly calibrated to fit exactly 1 single page on A4 Landscape
  let wfTableFontSize = "8.5pt";
  let wfTableTdFontSize = "8.5pt";
  let wfTableThFontSize = "7.8pt";
  let wfTablePadding = "2px 3.5px";
  let wfLineHeight = "1.15";
  let wfHeaderMarginTop = "0px";
  let wfHeaderMarginBottom = "1px";
  let wfHeaderTitleSize = "11pt";
  let wfHeaderSubSize = "9.5pt";
  let wfMetaBoxPadding = "1px 0";
  let wfMetaBoxMarginBottom = "2px";

  // Dynamic Sizing for Schemes of Work
  let sowTableFontSize = "12pt";
  let sowTableTdFontSize = "12pt";
  let sowTableThFontSize = "8.5pt";
  let sowTablePadding = "5px 6px";
  let sowLineHeight = "1.3";

  if (metadata.type === "schemes_of_work") {
    const isEnglishCombined = metadata.englishCombined || (metadata.subject && metadata.subject.toLowerCase().includes('english') && (metadata.grade?.includes('Grade 1') || metadata.grade?.includes('Grade 2')));
    
    if (isEnglishCombined) {
      sowTableFontSize = "12pt";
      sowTableTdFontSize = "12pt";
      sowTableThFontSize = "8.5pt";
      sowTablePadding = "4px 5px";
      sowLineHeight = "1.25";
    }
  }

  if (metadata.type === "weekly_forecast") {
    // Strictly calibrated for clean readability and zero text collision across all columns on single A4 Landscape page
    wfTableFontSize = "8.5pt";
    wfTableTdFontSize = "8.5pt";
    wfTableThFontSize = "8pt";
    wfTablePadding = "2.5px 3.5px";
    wfLineHeight = "1.25";
    wfHeaderTitleSize = "11.5pt";
    wfHeaderSubSize = "9.5pt";
    wfHeaderMarginTop = "0px";
    wfHeaderMarginBottom = "1px";
    wfMetaBoxPadding = "1px 0";
    wfMetaBoxMarginBottom = "1.5px";
  }

  const recordDownload = async (
    format: "pdf" | "print" | "markdown" | "word",
  ) => {
    if (!user) return;
    try {
      const effectiveDownloadContent = (hasBeenEdited && visualHtml) ? visualHtml : (localContent || cleanContent);

      const rawDoc = {
        userId: user.uid,
        title: metadata.topic || `Document: ${metadata.type || ""}`,
        type: metadata.type || "",
        subject: metadata.subject || "",
        grade: metadata.grade || "",
        content: effectiveDownloadContent || "",
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
            content: effectiveDownloadContent,
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
    if (effectiveTrialMode) {
      toast.error("Text copying is disabled in Free Trial View-Only mode to protect educational content. Please subscribe to an active circle to copy and export text.", { duration: 5000 });
      setShowAccessModal(true);
      return;
    }
    if (!checkDownloadAccess()) return;
    ensureEditingCommitted();
    const copyText = (hasBeenEdited && visualHtml) ? visualHtml : cleanContent;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    ensureEditingCommitted();
    if (!checkDownloadAccess()) return;
    recordDownload("print");
    window.print();
  };

  const handleDownloadWord = async () => {
    ensureEditingCommitted();
    if (!checkDownloadAccess()) return;
    const element = document.getElementById("printable-document") || editorRef.current;
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
    ensureEditingCommitted();
    if (!checkDownloadAccess()) return;
    const element = document.getElementById("printable-document") || editorRef.current;
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
      restoreStyles = prepareDocumentForPdfExport(!isLandscape);
      h2p = await loadHtml2Pdf();
    } catch (loadErr: any) {
      if (restoreStyles) restoreStyles();
      clearTimeout(safetyTimeout);
      setGeneratingPdf(false);
      toast.error(loadErr.message || "Failed to initialize PDF generator. Please check internet connection.", { id: toastId });
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      recordDownload("pdf");
      const fileName = getSignatureFileName("pdf");

      const isWeeklyForecast = metadata.type === "weekly_forecast";
      const isLessonPlan = metadata.type === "lesson_plan";

      const opt = {
        margin: isWeeklyForecast ? [3, 3, 3, 3] : (isLessonPlan ? [4, 4, 4, 4] : (isLandscape ? [4, 4, 4, 4] : [6, 4, 6, 4])),
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
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedDoc.body.style.color = '#000000';
            if (clonedDoc.documentElement) {
              clonedDoc.documentElement.style.backgroundColor = '#ffffff';
            }

            const printableEl = clonedDoc.getElementById('printable-document') || clonedDoc.querySelector('.markdown-content');
            if (printableEl) {
              (printableEl as HTMLElement).style.width = targetWidth;
              (printableEl as HTMLElement).style.minWidth = targetWidth;
              (printableEl as HTMLElement).style.maxWidth = targetWidth;
              (printableEl as HTMLElement).style.padding = '0';
              (printableEl as HTMLElement).style.margin = '0 auto';
              (printableEl as HTMLElement).style.backgroundColor = '#ffffff';
              (printableEl as HTMLElement).style.color = '#000000';
            }

            // Force all tables, headers, and cells in the export to render with clean backgrounds and black text
            clonedDoc.querySelectorAll('table, .scheme-table, .weekly-forecast-table').forEach(tbl => {
              (tbl as HTMLElement).style.backgroundColor = '#ffffff';
            });
            clonedDoc.querySelectorAll('th').forEach(th => {
              (th as HTMLElement).style.backgroundColor = '#f1f5f9';
              (th as HTMLElement).style.color = '#000000';
              (th as HTMLElement).style.borderColor = '#000000';
            });
            clonedDoc.querySelectorAll('td').forEach(td => {
              (td as HTMLElement).style.backgroundColor = '#ffffff';
              (td as HTMLElement).style.color = '#000000';
              (td as HTMLElement).style.borderColor = '#000000';
            });
            if (isWeeklyForecast) {
              const wfEl = clonedDoc.querySelector('.doc-type-weekly_forecast');
              if (wfEl) {
                (wfEl as HTMLElement).style.minHeight = '0';
                (wfEl as HTMLElement).style.height = 'auto';
                (wfEl as HTMLElement).style.maxHeight = '100%';
                (wfEl as HTMLElement).style.padding = '0';
                (wfEl as HTMLElement).style.margin = '0 auto';
                (wfEl as HTMLElement).style.overflow = 'hidden';
              }
              // Compact sizing for Weekly Forecast PDF to strictly fit on 1 single page without extra page breaks or blank gaps
              clonedDoc.querySelectorAll('.doc-type-weekly_forecast table, .weekly-forecast-table').forEach(tbl => {
                (tbl as HTMLElement).style.fontSize = '8pt';
                (tbl as HTMLElement).style.lineHeight = '1.18';
                (tbl as HTMLElement).style.margin = '1px 0';
                (tbl as HTMLElement).style.borderCollapse = 'collapse';
              });
              clonedDoc.querySelectorAll('.doc-type-weekly_forecast th, .weekly-forecast-table th').forEach(th => {
                (th as HTMLElement).style.fontSize = '7.8pt';
                (th as HTMLElement).style.padding = '2px 2.5px';
                (th as HTMLElement).style.lineHeight = '1.15';
              });
              clonedDoc.querySelectorAll('.doc-type-weekly_forecast td, .weekly-forecast-table td').forEach(td => {
                (td as HTMLElement).style.fontSize = '8pt';
                (td as HTMLElement).style.padding = '2px 2.5px';
                (td as HTMLElement).style.lineHeight = '1.18';
                (td as HTMLElement).style.height = 'auto';
              });
              clonedDoc.querySelectorAll('.doc-type-weekly_forecast h1, .doc-type-weekly_forecast h2, .doc-type-weekly_forecast h3, .doc-type-weekly_forecast p').forEach(el => {
                (el as HTMLElement).style.marginTop = '0px';
                (el as HTMLElement).style.marginBottom = '1.5px';
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
            } else if (metadata.type === "lesson_plan") {
              // Compact sizing for Lesson Plan PDF to strictly guarantee 2 pages max without overflowing to page 3
              clonedDoc.querySelectorAll('.doc-type-lesson_plan table, .lesson-plan-table').forEach(tbl => {
                (tbl as HTMLElement).style.fontSize = '8.6pt';
                (tbl as HTMLElement).style.lineHeight = '1.12';
                (tbl as HTMLElement).style.margin = '2px 0';
                (tbl as HTMLElement).style.borderCollapse = 'collapse';
              });
              clonedDoc.querySelectorAll('.doc-type-lesson_plan th, .lesson-plan-table th').forEach(th => {
                (th as HTMLElement).style.fontSize = '8.8pt';
                (th as HTMLElement).style.padding = '2px 3px';
                (th as HTMLElement).style.lineHeight = '1.12';
              });
              clonedDoc.querySelectorAll('.doc-type-lesson_plan td, .lesson-plan-table td').forEach(td => {
                (td as HTMLElement).style.fontSize = '8.6pt';
                (td as HTMLElement).style.padding = '1.5px 3px';
                (td as HTMLElement).style.lineHeight = '1.12';
              });
              clonedDoc.querySelectorAll('.lesson-plan-homework-section, .lesson-plan-footer').forEach(el => {
                (el as HTMLElement).style.fontSize = '8.6pt';
                (el as HTMLElement).style.margin = '2px 0';
                (el as HTMLElement).style.lineHeight = '1.12';
              });
              clonedDoc.querySelectorAll('.doc-type-lesson_plan p, .doc-type-lesson_plan li, .lesson-plan-content p, .lesson-plan-content li').forEach(el => {
                (el as HTMLElement).style.fontSize = '8.6pt';
                (el as HTMLElement).style.lineHeight = '1.12';
                (el as HTMLElement).style.margin = '1px 0';
              });
            }
            // Ensure table rows never split across pages for schemes of work or weekly forecasts
            clonedDoc.querySelectorAll('tr, tbody, thead, tfoot, .scheme-row, .doc-type-schemes_of_work tr, .doc-type-weekly_forecast tr, .doc-type-lesson_plan tr').forEach(el => {
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
        pagebreak: { 
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

  const contentLower = (localContent || '').toLowerCase();
  const effectiveCurriculum = metadata.curriculumType || (contentLower.includes('expected standard') ? 'CBC' : (contentLower.includes('knowledge') && contentLower.includes('skills') ? 'OBC' : 'CBC'));

  return (
    <div className="w-full max-w-[1440px] mx-auto py-3 sm:py-6 md:py-10 px-2 sm:px-4 md:px-8 @container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-8 sticky top-0 bg-slate-50/90 backdrop-blur-md py-3 sm:py-4 z-10 border-b border-slate-200 px-2 sm:px-4">
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
          {effectiveTrialMode && (
            <button
              onClick={() => setShowAccessModal(true)}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap animate-pulse"
            >
              <span>⚡ UNLOCK FULL ACCESS</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className={cn(
              "px-2.5 py-1.5 sm:px-3 sm:py-2 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg",
              effectiveTrialMode
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-pointer"
                : "bg-white border border-slate-200 hover:bg-slate-50"
            )}
            title={effectiveTrialMode ? "Copying disabled in trial mode" : "Copy document"}
          >
            {effectiveTrialMode ? <Lock size={12} className="text-amber-500" /> : copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "COPIED" : "COPY"}
          </button>

          {metadata.type === 'schemes_of_work' && (
            <button
              onClick={handleStartSegmentation}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 hover:from-teal-700 hover:to-emerald-700 text-white border border-teal-800 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg animate-pulse cursor-pointer"
              title="Segment Schemes into 13 Discrete Weekly Forecasts"
            >
              <Zap size={12} className="text-amber-300" />
              <span>SEGMENT TO WEEKLY FORECASTS (1-13)</span>
            </button>
          )}

          <button
            onClick={handleToggleEdit}
            className={cn(
              "px-2.5 py-1.5 sm:px-3 sm:py-2 border font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg",
              effectiveTrialMode
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-pointer"
                : isEditing 
                  ? "bg-amber-100 text-amber-700 border-amber-300" 
                  : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
            )}
            title={effectiveTrialMode ? "Editing disabled in trial mode" : "Pre-edit content"}
          >
            {effectiveTrialMode ? <Lock size={12} className="text-amber-500" /> : <FileText size={12} />}
            {isEditing ? "FINISH EDITING" : "PRE-EDIT CONTENT"}
          </button>

          {readyPdfUrl ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (effectiveTrialMode) {
                    toast.error("PDF downloads are disabled in Free Trial View-Only mode. Please activate a Subscription Circle.");
                    setShowAccessModal(true);
                    return;
                  }
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
                "px-2.5 py-1.5 sm:px-3 sm:py-2 border font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg",
                effectiveTrialMode
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-pointer"
                  : generatingPdf
                    ? "bg-slate-400 cursor-wait text-white border-slate-900"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white border-slate-900",
              )}
            >
              {generatingPdf ? (
                <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : effectiveTrialMode ? (
                <Lock size={12} className="text-amber-500" />
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
              "px-2.5 py-1.5 sm:px-3 sm:py-2 border font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg",
              effectiveTrialMode
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-pointer"
                : generatingWord
                  ? "bg-slate-400 cursor-wait text-white border-slate-900"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-slate-900",
            )}
          >
            {generatingWord ? (
              <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : effectiveTrialMode ? (
              <Lock size={12} className="text-amber-500" />
            ) : (
              <FileCode size={12} />
            )}
            {generatingWord ? "GENERATING..." : "DOWNLOAD WORD"}
          </button>

          <button
            onClick={handlePrint}
            className={cn(
              "px-2.5 py-1.5 sm:px-3 sm:py-2 border font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap rounded-lg",
              effectiveTrialMode
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-pointer"
                : "bg-[#00A86B] text-white border-slate-900 hover:bg-emerald-600"
            )}
          >
            {effectiveTrialMode ? <Lock size={12} className="text-amber-500" /> : <Printer size={12} />}
            PRINT
          </button>
        </div>
      </div>

      {/* Free Trial Limit Reached Blocked Screen */}
      {isViewLimitBlocked ? (
        <div className="max-w-3xl mx-auto my-8 sm:my-12 bg-white border border-rose-200 rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock size={32} />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-black text-[10px] uppercase tracking-wider">
              Free Trial View Limit Reached
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
              Trial Document Limit Reached
            </h2>
            <p className="text-sm text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
              Free trial access mode allows viewing only <strong>1 Schemes of Work</strong>, <strong>1 Weekly Forecast</strong>, and <strong>2 Lesson Plans</strong> to prevent full document screenshotting and manual copying.
            </p>
          </div>

          {/* Current Trial Usage Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
            <div className={cn(
              "p-4 rounded-2xl border",
              trialViewCounts.schemes_of_work >= TRIAL_VIEW_LIMITS.schemes_of_work
                ? "bg-rose-50/70 border-rose-200 text-rose-950"
                : "bg-slate-50 border-slate-200/80 text-slate-800"
            )}>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Schemes of Work</p>
              <p className="text-base font-extrabold mt-1">
                {trialViewCounts.schemes_of_work} / {TRIAL_VIEW_LIMITS.schemes_of_work} <span className="text-xs font-semibold text-slate-500">Viewed</span>
              </p>
            </div>
            <div className={cn(
              "p-4 rounded-2xl border",
              trialViewCounts.weekly_forecast >= TRIAL_VIEW_LIMITS.weekly_forecast
                ? "bg-rose-50/70 border-rose-200 text-rose-950"
                : "bg-slate-50 border-slate-200/80 text-slate-800"
            )}>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Weekly Forecast</p>
              <p className="text-base font-extrabold mt-1">
                {trialViewCounts.weekly_forecast} / {TRIAL_VIEW_LIMITS.weekly_forecast} <span className="text-xs font-semibold text-slate-500">Viewed</span>
              </p>
            </div>
            <div className={cn(
              "p-4 rounded-2xl border",
              trialViewCounts.lesson_plan >= TRIAL_VIEW_LIMITS.lesson_plan
                ? "bg-rose-50/70 border-rose-200 text-rose-950"
                : "bg-slate-50 border-slate-200/80 text-slate-800"
            )}>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Lesson Plans</p>
              <p className="text-base font-extrabold mt-1">
                {trialViewCounts.lesson_plan} / {TRIAL_VIEW_LIMITS.lesson_plan} <span className="text-xs font-semibold text-slate-500">Viewed</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs font-semibold text-amber-900 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase text-[11px]">Ready to unlock all documents & downloads?</p>
              <p className="mt-0.5 text-amber-800">
                Subscribe to an active Subscription Circle (Weekly ZMK 20 - 30 Downloads, 14-day ZMK 40 - 65 Downloads, Monthly ZMK 70 - 110 Downloads, Individual Termly ZMK 180 - 250 Downloads, or Whole School Termly ZMK 500 - Unlimited Access) for full viewing, unlimited generations, Word/PDF downloads, and printing.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAccessModal(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>⚡ Select & Activate Subscription Circle</span>
            </button>
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ChevronLeft size={16} />
              <span>Back to Generator</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Active Free Trial View-Only Banner */}
          {effectiveTrialMode && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 font-black text-xs">
                  FREE TRIAL
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-amber-950 flex items-center gap-2 flex-wrap">
                    <span>View-Only Trial Mode</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                      Screenshots & Rewriting Restricted
                    </span>
                  </h4>
                  <p className="text-[11px] font-semibold text-amber-900 mt-1">
                    Trial View Quota: Schemes of Work (<strong>{trialViewCounts.schemes_of_work}/1</strong>) • Weekly Forecast (<strong>{trialViewCounts.weekly_forecast}/1</strong>) • Lesson Plans (<strong>{trialViewCounts.lesson_plan}/2</strong>).
                  </p>
                  <p className="text-[10px] text-amber-700 mt-0.5 font-medium">
                    Copying, in-app editing, Word/PDF downloads, and printing are disabled in Free Trial mode.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAccessModal(true)}
                className="px-4 py-2.5 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
              >
                <span>⚡ Unlock Full Access</span>
              </button>
            </div>
          )}

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
              "bg-[#ffffff] relative flex flex-col mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 mx-auto w-full shadow-2xl border border-slate-200 overflow-hidden",
              effectiveTrialMode && "select-none",
              isLandscape
                ? "max-w-full lg:max-w-[1092px]"
                : "max-w-full lg:max-w-[763px]",
            )}
            onCopy={(e) => {
              if (effectiveTrialMode) {
                e.preventDefault();
                toast.error("Text copying is disabled in Free Trial View-Only mode.");
                setShowAccessModal(true);
              }
            }}
            onContextMenu={(e) => {
              if (effectiveTrialMode) {
                e.preventDefault();
              }
            }}
          >
            {/* Watermark Overlay in Trial Mode to discourage screenshots */}
            {effectiveTrialMode && (
              <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-around items-center opacity-[0.05] overflow-hidden select-none py-10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="text-xl sm:text-2xl font-black uppercase tracking-[0.3em] rotate-[-20deg] whitespace-nowrap text-slate-900">
                    FORTUNES EDUTECH • TRIAL VIEW ONLY • REWRITING/SCREENSHOT RESTRICTED
                  </div>
                ))}
              </div>
            )}

            {/* Paper Content */}
            <div className="flex-1 bg-[#ffffff] p-1 sm:p-2 md:p-4 overflow-x-auto relative z-10">
          {isEditing ? (
            <div className="p-2 sm:p-4 md:p-8 bg-white rounded-2xl border-2 border-amber-200 shadow-xl max-w-4xl mx-auto overflow-x-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Visual Document Editor</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click anywhere to type and edit content directly</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVisualSave}
                    className="px-4 py-1.5 bg-[#00A86B] text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>

              {(() => {
                const contentLower = (localContent || '').toLowerCase();
                const effectiveCurriculum = metadata.curriculumType || (contentLower.includes('expected standard') ? 'CBC' : (contentLower.includes('knowledge') && contentLower.includes('skills') ? 'OBC' : 'CBC'));
                return (
                  <div 
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onBlur={handleEditorBlur}
                    className={cn(
                      "markdown-content bg-white mx-auto p-2 sm:p-4 md:p-8 outline-none focus:ring-2 focus:ring-[#00A86B] rounded-xl min-h-[800px]",
                      `doc-type-${metadata.type}`,
                      `curriculum-${effectiveCurriculum}`,
                      isLandscape ? "w-[1092px] min-w-[1092px]" : "w-full md:w-[763px] min-w-[560px] md:min-w-[763px]"
                    )}
                  />
                );
              })()}

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
          ) : (() => {
              const contentLower = (localContent || '').toLowerCase();
              const effectiveCurriculum = metadata.curriculumType || (contentLower.includes('expected standard') ? 'CBC' : (contentLower.includes('knowledge') && contentLower.includes('skills') ? 'OBC' : 'CBC'));
              return hasBeenEdited ? (
                <div
                  id="printable-document"
                  className={cn(
                    "markdown-content bg-white mx-auto",
                    `doc-type-${metadata.type}`,
                    `curriculum-${effectiveCurriculum}`,
                    isLandscape ? "w-[1092px] min-w-[1092px]" : "w-full md:w-[763px] min-w-[620px] md:min-w-[763px]",
                  )}
                  dangerouslySetInnerHTML={{ __html: visualHtml }}
                />
              ) : (
                <div
                  id="printable-document"
                  className={cn(
                    "markdown-content bg-white mx-auto",
                    `doc-type-${metadata.type}`,
                    `curriculum-${effectiveCurriculum}`,
                    isLandscape ? "w-[1092px] min-w-[1092px]" : "w-full md:w-[763px] min-w-[620px] md:min-w-[763px]",
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  components={{
                table: ({ node, ...props }) => {
                  const children = React.Children.toArray(props.children);
                  const extractText = (val: any): string => {
                    if (!val) return "";
                    if (typeof val === 'string') return val;
                    if (Array.isArray(val)) return val.map(extractText).join("");
                    if (val.props?.children) return extractText(val.props.children);
                    return "";
                  };

                  const allTableText = extractText(children).toUpperCase();
                  const isGeneralInfoTable = (props.className && props.className.includes("general-info-table")) ||
                    allTableText.includes("TEACHER'S NAME") ||
                    allTableText.includes("NAME OF TEACHER") ||
                    (allTableText.includes("ATTENDANCE") && allTableText.includes("GRADE"));

                  if (isGeneralInfoTable) {
                    return (
                      <table 
                        className="general-info-table"
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          borderTop: "2px solid #000",
                          borderBottom: "2px solid #000",
                          borderLeft: "none",
                          borderRight: "none",
                          marginTop: "8px",
                          marginBottom: "12px",
                          fontFamily: "'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif"
                        }}
                      >
                        {props.children}
                      </table>
                    );
                  }

                  let className = "";
                  if (metadata.type === "schemes_of_work")
                    className = "scheme-table";
                  else if (metadata.type === "weekly_forecast")
                    className = "weekly-forecast-table";
                  else if (metadata.type === "lesson_plan")
                    className = "lesson-plan-table";
                  else if (metadata.type === "individual_work_plan")
                    className = "workplan-table";

                  const theadIndex = children.findIndex((child: any) => child?.type === 'thead');
                  let referenceColIndex = -1;
                  let weeklyRecordColIndex = -1;
                  let contentColIndex = -1;

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
                      
                      if (text.includes('content')) {
                        contentColIndex = idx;
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

                  const isLP = metadata.type === "lesson_plan";

                  const newChildren = children.map((section: any) => {
                    if (section?.type === 'thead') {
                      const trs = React.Children.toArray(section.props?.children);
                      const newTrs = trs.map((tr: any) => {
                        const ths = React.Children.toArray(tr.props?.children);
                        const newThs = ths.map((th: any, idx: number) => {
                          const thText = extractText(th.props?.children).trim();
                          let headerLabel = th.props?.children;

                          if (idx === referenceColIndex) {
                            headerLabel = 'REFERENCE';
                          } else if (idx === weeklyRecordColIndex) {
                            headerLabel = 'RECORD OF WORK';
                          } else if (/^components?$/i.test(thText) || thText.toUpperCase() === 'COMPONENT' || thText.toUpperCase() === 'COMPONENTS') {
                            headerLabel = 'COMPONENT';
                          }

                          return React.cloneElement(th as any, {
                            children: headerLabel,
                            className: (th.props?.className || "") + " font-black tracking-tight uppercase px-1 text-center"
                          });
                        });

                        // If Weekly Forecast table was generated with only 9 columns (missing Record of Work), auto-append it!
                        if (metadata.type === 'weekly_forecast' && weeklyRecordColIndex === -1) {
                          newThs.push(
                            (<th key="rec-work-auto-th" className="font-black tracking-wide uppercase px-2 text-center">
                              RECORD OF WORK
                            </th>) as any
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
            );
          })()}
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
            margin: ${metadata.type === "weekly_forecast" ? "0.4cm" : (metadata.type === "lesson_plan" ? "0.45cm" : "0.5cm")};
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
          .doc-type-schemes_of_work th { font-size: 8.5pt !important; padding: 3px 2px !important; font-weight: 800 !important; line-height: 1.15 !important; text-align: center; }
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
          
          /* Safety net: Prevent trailing page breaks or empty elements from forcing a blank page at the end of the document */
          .page-break:last-child,
          .page-break:last-of-type,
          .page-break-avoid,
          hr:last-child,
          div:empty:last-child,
          p:empty:last-child,
          .markdown-content > :last-child.page-break,
          .markdown-content > .page-break:last-of-type {
            display: none !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            break-after: avoid !important;
            break-before: avoid !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
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
          font-size: 11pt !important;
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
          font-size: 10.5pt !important;
          line-height: 1.25 !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }

        .doc-type-lesson_plan b,
        .doc-type-lesson_plan strong,
        .lesson-plan-content b,
        .lesson-plan-content strong {
          font-weight: bold !important;
          font-size: 10.5pt !important;
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
          font-weight: 800 !important;
          color: #000 !important;
          text-transform: uppercase;
          font-size: 8.5pt !important;
          letter-spacing: -0.01em;
          padding: 3px 2px !important;
          line-height: 1.15 !important;
          text-align: center;
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
          font-size: 11pt !important;
          padding: 5px 4px !important;
          line-height: 1.25 !important;
          color: #000000 !important;
          font-weight: bold !important;
          text-align: left !important;
        }

        .doc-type-lesson_plan table td {
          font-size: 10.5pt !important;
          padding: 4px 4px !important;
          line-height: 1.25 !important;
          color: #000000 !important;
          font-weight: normal !important;
          min-height: 30px !important;
          height: auto !important;
        }

        .doc-type-lesson_plan table td:nth-child(1),
        .doc-type-lesson_plan table .stage-cell,
        .stage-cell {
          font-size: 10pt !important;
          font-weight: bold !important;
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
          width: 11% !important;
        }
        
        .doc-type-lesson_plan table.lesson-plan-table th:nth-child(2),
        .doc-type-lesson_plan table.lesson-plan-table td:nth-child(2),
        .doc-type-lesson_plan table:not(:first-of-type) th:nth-child(2),
        .doc-type-lesson_plan table:not(:first-of-type) td:nth-child(2) {
          width: 25% !important;
        }
        
        .doc-type-lesson_plan table.lesson-plan-table th:nth-child(3),
        .doc-type-lesson_plan table.lesson-plan-table td:nth-child(3),
        .doc-type-lesson_plan table:not(:first-of-type) th:nth-child(3),
        .doc-type-lesson_plan table:not(:first-of-type) td:nth-child(3) {
          width: 25% !important;
        }

        .doc-type-lesson_plan table.lesson-plan-table th:nth-child(4),
        .doc-type-lesson_plan table.lesson-plan-table td:nth-child(4),
        .doc-type-lesson_plan table:not(:first-of-type) th:nth-child(4),
        .doc-type-lesson_plan table:not(:first-of-type) td:nth-child(4) {
          width: 24% !important;
        }

        .doc-type-lesson_plan table.lesson-plan-table th:nth-child(5),
        .doc-type-lesson_plan table.lesson-plan-table td:nth-child(5),
        .doc-type-lesson_plan table:not(:first-of-type) th:nth-child(5),
        .doc-type-lesson_plan table:not(:first-of-type) td:nth-child(5) {
          width: 15% !important;
          display: table-cell !important;
        }

        /* 4-Column Lesson Plan Table (e.g. Literacy / Oral English) */
        .doc-type-lesson_plan table:not(:has(th:nth-child(5))) th:nth-child(1),
        .doc-type-lesson_plan table:not(:has(th:nth-child(5))) td:nth-child(1) {
          width: 12% !important;
        }
        .doc-type-lesson_plan table:not(:has(th:nth-child(5))) th:nth-child(2),
        .doc-type-lesson_plan table:not(:has(th:nth-child(5))) td:nth-child(2) {
          width: 38% !important;
        }
        .doc-type-lesson_plan table:not(:has(th:nth-child(5))) th:nth-child(3),
        .doc-type-lesson_plan table:not(:has(th:nth-child(5))) td:nth-child(3) {
          width: 34% !important;
        }
        .doc-type-lesson_plan table:not(:has(th:nth-child(5))) th:nth-child(4),
        .doc-type-lesson_plan table:not(:has(th:nth-child(5))) td:nth-child(4) {
          width: 16% !important;
        }

        /* Schemes of Work Table & Typography */
        .doc-type-schemes_of_work table,
        .scheme-table {
          font-size: 12pt !important;
          table-layout: fixed !important;
          width: 100% !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }
        .doc-type-schemes_of_work td,
        .scheme-table td {
          font-size: 12pt !important;
          padding: 5px 6px !important;
          line-height: 1.3 !important;
          word-break: keep-all !important;
          overflow-wrap: normal !important;
          hyphens: none !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }
        .doc-type-schemes_of_work th,
        .scheme-table th {
          font-size: 8.5pt !important;
          padding: 4px 3px !important;
          font-weight: 800 !important;
          line-height: 1.15 !important;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          text-align: center;
          white-space: nowrap !important;
          word-break: keep-all !important;
          overflow-wrap: normal !important;
          hyphens: none !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
        }

        /* Schemes of Work Columns (CBC & Default Non-Language - 8 columns: WEEK, TOPIC/Subtopics, SPECIFIC COMPETENCIES, EXPECTED STANDARD, LEARNING ACTIVITIES, TEACHING METHODS, TEACHING AND LEARNING AIDS, REFERENCE) */
        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(1),
        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(1),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(1),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(1),
        .scheme-table:not(:has(th:nth-child(9))) th:nth-child(1),
        .scheme-table:not(:has(th:nth-child(9))) td:nth-child(1) { width: 5.5% !important; text-align: center; }

        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(2),
        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(2),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(2),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(2),
        .scheme-table:not(:has(th:nth-child(9))) th:nth-child(2),
        .scheme-table:not(:has(th:nth-child(9))) td:nth-child(2) { width: 10% !important; } /* TOPIC/Subtopics */

        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(3),
        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(3),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(3),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(3),
        .scheme-table:not(:has(th:nth-child(9))) th:nth-child(3),
        .scheme-table:not(:has(th:nth-child(9))) td:nth-child(3) { width: 19% !important; } /* SPECIFIC COMPETENCIES - expanded */

        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(4),
        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(4),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(4),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(4),
        .scheme-table:not(:has(th:nth-child(9))) th:nth-child(4),
        .scheme-table:not(:has(th:nth-child(9))) td:nth-child(4) { width: 9.5% !important; } /* EXPECTED STANDARD */

        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(5),
        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(5),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(5),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(5),
        .scheme-table:not(:has(th:nth-child(9))) th:nth-child(5),
        .scheme-table:not(:has(th:nth-child(9))) td:nth-child(5) { width: 32.5% !important; } /* LEARNING ACTIVITIES - expanded with former subtopic space */

        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(6),
        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(6),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(6),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(6),
        .scheme-table:not(:has(th:nth-child(9))) th:nth-child(6),
        .scheme-table:not(:has(th:nth-child(9))) td:nth-child(6) { width: 7.5% !important; } /* TEACHING METHODS */

        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(7),
        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(7),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(7),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(7),
        .scheme-table:not(:has(th:nth-child(9))) th:nth-child(7),
        .scheme-table:not(:has(th:nth-child(9))) td:nth-child(7) { width: 8% !important; } /* TEACHING AND LEARNING AIDS */

        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(8),
        .curriculum-CBC.doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(8),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) th:nth-child(8),
        .doc-type-schemes_of_work table:not(:has(th:nth-child(9))) td:nth-child(8),
        .scheme-table:not(:has(th:nth-child(9))) th:nth-child(8),
        .scheme-table:not(:has(th:nth-child(9))) td:nth-child(8) { width: 8% !important; } /* REFERENCE */

        /* Schemes of Work Columns with COMPONENT (9 columns for CBC Language: WEEK, COMPONENT, TOPIC/Subtopics, SPECIFIC COMPETENCIES, EXPECTED STANDARD, LEARNING ACTIVITIES, TEACHING METHODS, T/L AIDS, REFERENCE) */
        .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(9):not(:nth-child(10))) th:nth-child(1), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(9):not(:nth-child(10))) td:nth-child(1) { width: 4.5% !important; text-align: center; }
        .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(9):not(:nth-child(10))) th:nth-child(2), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(9):not(:nth-child(10))) td:nth-child(2) { width: 7.5% !important; } /* COMPONENT */
        .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(9):not(:nth-child(10))) th:nth-child(3), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(9):not(:nth-child(10))) td:nth-child(3) { width: 9.5% !important; } /* TOPIC/Subtopics */
        .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(9):not(:nth-child(10))) th:nth-child(4), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(9):not(:nth-child(10))) td:nth-child(4) { width: 16% !important; } /* SPECIFIC COMPETENCIES */
        .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(9):not(:nth-child(10))) th:nth-child(5), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(9):not(:nth-child(10))) td:nth-child(5) { width: 9% !important; } /* EXPECTED STANDARD */
        .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(9):not(:nth-child(10))) th:nth-child(6), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(9):not(:nth-child(10))) td:nth-child(6) { width: 31.5% !important; } /* LEARNING ACTIVITIES */
        .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(9):not(:nth-child(10))) th:nth-child(7), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(9):not(:nth-child(10))) td:nth-child(7) { width: 7% !important; } /* TEACHING METHODS */
        .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(9):not(:nth-child(10))) th:nth-child(8), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(9):not(:nth-child(10))) td:nth-child(8) { width: 7% !important; } /* T/L AIDS */
        .curriculum-CBC.doc-type-schemes_of_work table:has(th:nth-child(9):not(:nth-child(10))) th:nth-child(9), .curriculum-CBC.doc-type-schemes_of_work table:has(td:nth-child(9):not(:nth-child(10))) td:nth-child(9) { width: 7.5% !important; } /* REFERENCE */

        /* Schemes of Work Columns (OBC Standard Non-Language - 9 columns: WEEK, TOPIC/Subtopics, SPECIFIC OUTCOMES, KNOWLEDGE, SKILLS, VALUES, TEACHING METHODS, T/L AIDS, REFERENCE) */
        .curriculum-OBC.doc-type-schemes_of_work table:not(:has(th:nth-child(10))) th:nth-child(1), .curriculum-OBC.doc-type-schemes_of_work table:not(:has(td:nth-child(10))) td:nth-child(1) { width: 4.5% !important; text-align: center; }
        .curriculum-OBC.doc-type-schemes_of_work table:not(:has(th:nth-child(10))) th:nth-child(2), .curriculum-OBC.doc-type-schemes_of_work table:not(:has(td:nth-child(10))) td:nth-child(2) { width: 10% !important; } /* TOPIC/Subtopics */
        .curriculum-OBC.doc-type-schemes_of_work table:not(:has(th:nth-child(10))) th:nth-child(3), .curriculum-OBC.doc-type-schemes_of_work table:not(:has(td:nth-child(10))) td:nth-child(3) { width: 21% !important; } /* SPECIFIC OUTCOMES expanded */
        .curriculum-OBC.doc-type-schemes_of_work table:not(:has(th:nth-child(10))) th:nth-child(4), .curriculum-OBC.doc-type-schemes_of_work table:not(:has(td:nth-child(10))) td:nth-child(4) { width: 16% !important; } /* KNOWLEDGE expanded */
        .curriculum-OBC.doc-type-schemes_of_work table:not(:has(th:nth-child(10))) th:nth-child(5), .curriculum-OBC.doc-type-schemes_of_work table:not(:has(td:nth-child(10))) td:nth-child(5) { width: 10% !important; } /* SKILLS */
        .curriculum-OBC.doc-type-schemes_of_work table:not(:has(th:nth-child(10))) th:nth-child(6), .curriculum-OBC.doc-type-schemes_of_work table:not(:has(td:nth-child(10))) td:nth-child(6) { width: 5% !important; } /* VALUES */
        .curriculum-OBC.doc-type-schemes_of_work table:not(:has(th:nth-child(10))) th:nth-child(7), .curriculum-OBC.doc-type-schemes_of_work table:not(:has(td:nth-child(10))) td:nth-child(7) { width: 7.5% !important; } /* TEACHING METHODS */
        .curriculum-OBC.doc-type-schemes_of_work table:not(:has(th:nth-child(10))) th:nth-child(8), .curriculum-OBC.doc-type-schemes_of_work table:not(:has(td:nth-child(10))) td:nth-child(8) { width: 7% !important; } /* T/L AIDS */
        .curriculum-OBC.doc-type-schemes_of_work table:not(:has(th:nth-child(10))) th:nth-child(9), .curriculum-OBC.doc-type-schemes_of_work table:not(:has(td:nth-child(10))) td:nth-child(9) { width: 9% !important; } /* REFERENCE */

        /* Schemes of Work Columns (10 columns for OBC Language: WEEK, COMPONENT, TOPIC/Subtopics, SPECIFIC OUTCOMES, KNOWLEDGE, SKILLS, VALUES, TEACHING METHODS, T/L AIDS, REFERENCE) */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(1), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(1) { width: 4% !important; text-align: center; }
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(2), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(2) { width: 7.5% !important; } /* COMPONENT */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(3), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(3) { width: 9.5% !important; } /* TOPIC/Subtopics */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(4), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(4) { width: 20% !important; } /* SPECIFIC OUTCOMES expanded */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(5), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(5) { width: 15% !important; } /* KNOWLEDGE expanded */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(6), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(6) { width: 9.5% !important; } /* SKILLS */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(7), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(7) { width: 4.5% !important; } /* VALUES */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(8), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(8) { width: 6.5% !important; } /* TEACHING METHODS */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(9), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(9) { width: 6.5% !important; } /* T/L AIDS */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(10)) th:nth-child(10), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(10)) td:nth-child(10) { width: 7% !important; } /* REFERENCE */

        /* Schemes of Work Columns (OBC English & Zambian Languages - 7 columns: WEEK, COMPONENT, TOPIC, SPECIFIC OUTCOMES, KNOWLEDGE, T/L AIDS, REFERENCE) */
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(7):not(:nth-child(8))) th:nth-child(1), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(7):not(:nth-child(8))) td:nth-child(1) { width: 5% !important; text-align: center; }
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(7):not(:nth-child(8))) th:nth-child(2), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(7):not(:nth-child(8))) td:nth-child(2) { width: 14% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(7):not(:nth-child(8))) th:nth-child(3), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(7):not(:nth-child(8))) td:nth-child(3) { width: 18% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(7):not(:nth-child(8))) th:nth-child(4), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(7):not(:nth-child(8))) td:nth-child(4) { width: 22% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(7):not(:nth-child(8))) th:nth-child(5), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(7):not(:nth-child(8))) td:nth-child(5) { width: 25% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(7):not(:nth-child(8))) th:nth-child(6), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(7):not(:nth-child(8))) td:nth-child(6) { width: 8% !important; }
        .curriculum-OBC.doc-type-schemes_of_work table:has(th:nth-child(7):not(:nth-child(8))) th:nth-child(7), .curriculum-OBC.doc-type-schemes_of_work table:has(td:nth-child(7):not(:nth-child(8))) td:nth-child(7) { width: 8% !important; }

        /* Style subtopic formatting inside TOPIC/Subtopics column */
        .doc-type-schemes_of_work table td small,
        .doc-type-weekly_forecast table td small,
        .scheme-table td small,
        .weekly-forecast-table td small {
          font-size: 8.5pt !important;
          font-weight: 700 !important;
          display: block;
          margin-top: 5px !important;
          color: #0f172a !important;
        }
        .doc-type-schemes_of_work table td small b,
        .doc-type-schemes_of_work table td small strong,
        .doc-type-weekly_forecast table td small b,
        .doc-type-weekly_forecast table td small strong {
          font-size: 8.5pt !important;
          font-weight: 800 !important;
        }

        @media print {
          @page {
            size: ${isLandscape ? "landscape" : "portrait"};
            margin: ${metadata.type === "weekly_forecast" ? "4mm" : (metadata.type === "lesson_plan" ? "4.5mm" : "6mm")} !important;
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
          word-wrap: break-word !important;
          hyphens: auto !important;
          height: auto !important;
          min-height: 0 !important;
        }
        
        .doc-type-weekly_forecast th {
          font-size: ${wfTableThFontSize} !important;
          padding: ${wfTablePadding} !important;
          line-height: ${wfLineHeight} !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          text-transform: uppercase;
          font-weight: 800 !important;
          white-space: normal !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
          hyphens: auto !important;
        }

        /* =========================================================================
           WEEKLY FORECAST COLUMN WIDTHS (CBC & OBC)
           ========================================================================= */

        /* CBC Weekly Forecast: Standard 9 Columns (DAY, TOPIC/Subtopics, SPECIFIC COMPETENCIES, EXPECTED STANDARDS, LEARNING ACTIVITIES, TEACHING METHODS, TEACHING AND LEARNING AIDS, REFERENCE, RECORD OF WORK) */
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(1),
        .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(1),
        .curriculum-CBC .weekly-forecast-table th:nth-child(1),
        .curriculum-CBC .weekly-forecast-table td:nth-child(1) { width: 5% !important; text-align: center; font-weight: bold; border-right: 1.5px solid #000 !important; }
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(2),
        .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(2),
        .curriculum-CBC .weekly-forecast-table th:nth-child(2),
        .curriculum-CBC .weekly-forecast-table td:nth-child(2) { width: 18% !important; } /* TOPIC/Subtopics - spacious */
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(3),
        .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(3),
        .curriculum-CBC .weekly-forecast-table th:nth-child(3),
        .curriculum-CBC .weekly-forecast-table td:nth-child(3) { width: 15% !important; } /* SPECIFIC COMPETENCIES */
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(4),
        .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(4),
        .curriculum-CBC .weekly-forecast-table th:nth-child(4),
        .curriculum-CBC .weekly-forecast-table td:nth-child(4) { width: 12% !important; } /* EXPECTED STANDARDS */
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(5),
        .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(5),
        .curriculum-CBC .weekly-forecast-table th:nth-child(5),
        .curriculum-CBC .weekly-forecast-table td:nth-child(5) { width: 18% !important; } /* LEARNING ACTIVITIES */
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(6),
        .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(6),
        .curriculum-CBC .weekly-forecast-table th:nth-child(6),
        .curriculum-CBC .weekly-forecast-table td:nth-child(6) { width: 10% !important; } /* TEACHING METHODS */
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(7),
        .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(7),
        .curriculum-CBC .weekly-forecast-table th:nth-child(7),
        .curriculum-CBC .weekly-forecast-table td:nth-child(7) { width: 8% !important; } /* T/L AIDS */
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(8),
        .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(8),
        .curriculum-CBC .weekly-forecast-table th:nth-child(8),
        .curriculum-CBC .weekly-forecast-table td:nth-child(8) { width: 7% !important; } /* REFERENCE */
        .curriculum-CBC.doc-type-weekly_forecast table th:nth-child(9),
        .curriculum-CBC.doc-type-weekly_forecast table td:nth-child(9),
        .curriculum-CBC .weekly-forecast-table th:nth-child(9),
        .curriculum-CBC .weekly-forecast-table td:nth-child(9) { width: 7% !important; } /* RECORD OF WORK */

        /* OBC Weekly Forecast: Standard 10 Columns (DAY, TOPIC/Subtopics, SPECIFIC OUTCOMES, KNOWLEDGE, SKILLS, VALUES, TEACHING METHODS, T/L AIDS, REFERENCE, RECORD OF WORK) */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(1),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(1),
        .curriculum-OBC .weekly-forecast-table th:nth-child(1),
        .curriculum-OBC .weekly-forecast-table td:nth-child(1) { width: 5% !important; text-align: center; font-weight: bold; border-right: 1.5px solid #000 !important; }
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(2),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(2),
        .curriculum-OBC .weekly-forecast-table th:nth-child(2),
        .curriculum-OBC .weekly-forecast-table td:nth-child(2) { width: 17% !important; } /* TOPIC/Subtopics - spacious */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(3),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(3),
        .curriculum-OBC .weekly-forecast-table th:nth-child(3),
        .curriculum-OBC .weekly-forecast-table td:nth-child(3) { width: 16% !important; } /* SPECIFIC OUTCOMES */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(4),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(4),
        .curriculum-OBC .weekly-forecast-table th:nth-child(4),
        .curriculum-OBC .weekly-forecast-table td:nth-child(4) { width: 14% !important; } /* KNOWLEDGE */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(5),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(5),
        .curriculum-OBC .weekly-forecast-table th:nth-child(5),
        .curriculum-OBC .weekly-forecast-table td:nth-child(5) { width: 8% !important; } /* SKILLS */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(6),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(6),
        .curriculum-OBC .weekly-forecast-table th:nth-child(6),
        .curriculum-OBC .weekly-forecast-table td:nth-child(6) { width: 7% !important; } /* VALUES */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(7),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(7),
        .curriculum-OBC .weekly-forecast-table th:nth-child(7),
        .curriculum-OBC .weekly-forecast-table td:nth-child(7) { width: 10% !important; } /* TEACHING METHODS */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(8),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(8),
        .curriculum-OBC .weekly-forecast-table th:nth-child(8),
        .curriculum-OBC .weekly-forecast-table td:nth-child(8) { width: 8% !important; } /* T/L AIDS */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(9),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(9),
        .curriculum-OBC .weekly-forecast-table th:nth-child(9),
        .curriculum-OBC .weekly-forecast-table td:nth-child(9) { width: 7% !important; } /* REFERENCE */
        .curriculum-OBC.doc-type-weekly_forecast table th:nth-child(10),
        .curriculum-OBC.doc-type-weekly_forecast table td:nth-child(10),
        .curriculum-OBC .weekly-forecast-table th:nth-child(10),
        .curriculum-OBC .weekly-forecast-table td:nth-child(10) { width: 8% !important; } /* RECORD OF WORK */

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

        .doc-type-assessments {
          font-size: 10pt;
          line-height: 1.45;
          color: #000;
        }

        .doc-type-assessments p {
          margin-top: 0.2rem !important;
          margin-bottom: 0.4rem !important;
          font-size: 10pt;
          line-height: 1.45;
        }

        .doc-type-assessments ol, .doc-type-assessments ul {
          margin-bottom: 0.75rem !important;
          padding-left: 1.25rem !important;
        }

        .doc-type-assessments li {
          margin-bottom: 0.35rem !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .doc-type-assessments .question-block {
          margin-bottom: 0.6rem !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .doc-type-assessments img {
          max-width: 100% !important;
          height: auto !important;
          max-height: 140px !important;
          display: block;
          margin: 6px 0;
          object-fit: contain;
        }

        .doc-type-assessments h2, .doc-type-assessments h3, .doc-type-assessments h4 {
          margin-top: 0.85rem !important;
          margin-bottom: 0.4rem !important;
          font-weight: 800 !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }

        /* ===== MASTER CSS FOR SCHEMES + WEEKLY FORECAST + LESSON PLAN ===== */

        /* General Information 3-Column Header Table (Lesson Plan, Schemes of Work, Weekly Forecast) */
        .general-info-table,
        table.general-info-table {
          width: 100% !important;
          max-width: 100% !important;
          border-collapse: collapse !important;
          border-top: 1.5px solid #000000 !important;
          border-bottom: 1.5px solid #000000 !important;
          border-left: none !important;
          border-right: none !important;
          margin-top: 4px !important;
          margin-bottom: 8px !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          background: transparent !important;
        }

        .general-info-table tr,
        table.general-info-table tr {
          border: none !important;
          border-top: none !important;
          border-bottom: none !important;
          border-left: none !important;
          border-right: none !important;
          page-break-inside: avoid !important;
        }

        .general-info-table td,
        .general-info-table th,
        table.general-info-table td,
        table.general-info-table th,
        .doc-type-lesson_plan .general-info-table td,
        .doc-type-schemes_of_work .general-info-table td,
        .doc-type-weekly_forecast .general-info-table td,
        .doc-type-lesson_plan table.general-info-table td,
        .doc-type-schemes_of_work table.general-info-table td,
        .doc-type-weekly_forecast table.general-info-table td {
          border: none !important;
          border-top: none !important;
          border-bottom: none !important;
          border-left: none !important;
          border-right: none !important;
          padding: 2px 2px !important;
          font-size: 8pt !important;
          line-height: 1.3 !important;
          vertical-align: middle !important;
          color: #000000 !important;
          font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          white-space: nowrap !important;
          word-break: keep-all !important;
          overflow-wrap: normal !important;
          hyphens: none !important;
          background: transparent !important;
          height: auto !important;
        }

        /* UNBREAKABLE HORIZONTAL TEXT ENFORCEMENTS FOR CELLS AND NESTED CONTENT */
        .scheme-table td:first-child,
        .scheme-table th:first-child,
        .doc-type-schemes_of_work table td:first-child,
        .doc-type-schemes_of_work table th:first-child {
          white-space: nowrap !important;
          word-break: keep-all !important;
          overflow-wrap: normal !important;
        }

        .scheme-table td *,
        .scheme-table th *,
        .general-info-table td *,
        .general-info-table th * {
          word-break: keep-all !important;
          word-wrap: normal !important;
          overflow-wrap: normal !important;
        }

        /* EXPLICIT WRAPPING FOR WEEKLY FORECAST TO PREVENT OVERLAPPING/COLLISIONS */
        .weekly-forecast-table th,
        .weekly-forecast-table td,
        .doc-type-weekly_forecast table th,
        .doc-type-weekly_forecast table td,
        .weekly-forecast-table th *,
        .weekly-forecast-table td *,
        .doc-type-weekly_forecast table th *,
        .doc-type-weekly_forecast table td * {
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          hyphens: auto !important;
        }

        .scheme-table th,
        .scheme-table th *,
        .general-info-table th,
        .general-info-table th *,
        .doc-type-schemes_of_work table th,
        .doc-type-schemes_of_work table th * {
          white-space: normal !important;
          word-break: normal !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          text-align: center !important;
        }

        /* EXPLICIT WRAPPING FOR LESSON PLANS TO PREVENT OVERLAPPING/COLLISIONS */
        .lesson-plan-table th,
        .lesson-plan-table td,
        .doc-type-lesson_plan table th,
        .doc-type-lesson_plan table td {
          white-space: normal !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
        }
        .lesson-plan-table th *,
        .lesson-plan-table td *,
        .doc-type-lesson_plan table th *,
        .doc-type-lesson_plan table td * {
          white-space: normal !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
        }

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
            font-size: 8.5pt !important;
            font-weight: 800 !important;
            background-color: #f5f5f5 !important;
            padding: 3px 2px !important;
            line-height: 1.15 !important;
            text-align: center;
            white-space: normal !important;
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
            font-size: 8.5pt !important;
            font-weight: 800 !important;
            background-color: #f5f5f5 !important;
            padding: 3px 2px !important;
            line-height: 1.15 !important;
            text-align: center !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
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
            font-size: 10.5pt !important;
            font-weight: bold !important;
            margin-top: 1px !important;
            margin-bottom: 1px !important;
          }

          /* Compact spacing for lists and metadata paragraphs */
          .doc-type-lesson_plan p,
          .doc-type-lesson_plan li,
          .doc-type-lesson_plan div,
          .lesson-plan-content,
          .lesson-plan-content p,
          .lesson-plan-content li,
          .lesson-plan-content div {
            display: block !important;
            font-size: 8.6pt !important;
            text-align: left !important;
            line-height: 1.12 !important;
            color: #000000 !important;
            font-weight: normal !important;
            margin-top: 1px !important;
            margin-bottom: 1px !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .lesson-plan-content b,
          .lesson-plan-content strong,
          .doc-type-lesson_plan b,
          .doc-type-lesson_plan strong {
            font-weight: bold !important;
            font-size: 8.6pt !important;
            margin-top: 1px !important;
            margin-bottom: 1px !important;
          }

          /* General styling of first table (teacher & school info) */
          .doc-type-lesson_plan table:first-of-type:not(.lesson-plan-table) {
            margin-top: 2px !important;
            margin-bottom: 2px !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .doc-type-lesson_plan table:first-of-type:not(.lesson-plan-table) td {
            padding: 1px 3px !important;
            font-size: 8.6pt !important;
            line-height: 1.12 !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          /* Ensure table rows don't split but cells can expand */
          .lesson-plan-table {
            table-layout: fixed !important;
            width: 100% !important;
            max-width: 100% !important;
            font-size: 8.6pt !important;
            border-collapse: collapse !important;
            break-inside: auto !important;
            margin-top: 2px !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .lesson-plan-table tr {
            break-inside: avoid !important;        /* Never split a single row */
            page-break-inside: avoid !important;
          }

          .lesson-plan-table th {
            font-size: 8.8pt !important;
            font-weight: bold !important;
            padding: 2px 3px !important;
            border: 1px solid #000 !important;
            background-color: #f5f5f5 !important;
            vertical-align: top !important;
            text-transform: uppercase !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .lesson-plan-table td {
            font-size: 8.6pt !important;
            padding: 1.5px 3px !important;
            border: 1px solid #000 !important;
            vertical-align: top !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            line-height: 1.12 !important;
            min-height: 20px !important;
            height: auto !important;
            color: #000000 !important;
            font-weight: normal !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .lesson-plan-table td:nth-child(1),
          .lesson-plan-table .stage-cell,
          .stage-cell {
            font-size: 8.8pt !important;
            font-weight: bold !important;
          }

          /* Keep LESSON DEVELOPMENT heading with the table */
          h3 {
            break-after: avoid !important;
            page-break-after: avoid !important;
            margin-top: 4px !important;
            margin-bottom: 2px !important;
          }

          /* Homework and Evaluation sections */
          .lesson-plan-footer,
          .lesson-plan-homework-section {
            font-size: 8.6pt !important;
            margin-top: 2px !important;
            break-inside: avoid; /* Keep individual blocks together */
            page-break-inside: avoid;
            color: #000000 !important;
            font-weight: normal !important;
            font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif !important;
          }

          .lesson-plan-footer {
            margin-top: 2px !important;
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
            margin-top: 1px !important;
            margin-bottom: 1px !important;
            line-height: 1.12 !important;
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
          height: auto !important;
          min-height: 0 !important;
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
       `}</style>
        </>
      )}

      {/* 13-Week Schemes Segmentation Progress Modal */}
      {showSegmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Schemes Segmentation Engine
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {metadata.grade} &bull; {metadata.subject} &bull; 13 Weeks
                  </p>
                </div>
              </div>
              {!isSegmenting && (
                <button
                  onClick={() => setShowSegmentModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded-md"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Progress Bar & Real-time details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700">
                  {isSegmenting ? 'Segmenting in Progress...' : segmentComplete ? 'Segmentation Complete!' : 'Process Status'}
                </span>
                <span className="font-black text-emerald-600 text-sm">{segmentProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    segmentError ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                  )}
                  style={{ width: `${segmentProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 font-medium min-h-[36px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                {segmentStatusText || 'Preparing scheme analysis...'}
              </p>
            </div>

            {segmentError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{segmentError}</span>
              </div>
            )}

            {segmentComplete && segmentResult && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950">
                <div className="flex items-center gap-1.5 font-black text-emerald-800 uppercase tracking-tight">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>3-Month System Retention Locked</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  All 13 discrete weekly forecasts and lesson plans are compiled and permanently anchored in the 
                  <strong> "Smart Planning"</strong> interface for 90 days. You can safely clear your browser cache anytime without losing this data.
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              {segmentComplete ? (
                <>
                  <button
                    onClick={() => setShowSegmentModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowSegmentModal(false);
                      if (onNavigate) {
                        onNavigate('curriculum_planning_hub');
                      } else {
                        onBack();
                      }
                    }}
                    className="px-5 py-2.5 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Open in Smart Planning</span>
                    <ArrowRight size={14} />
                  </button>
                </>
              ) : isSegmenting ? (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-1">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Weeks...</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowSegmentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Access Modal for upgrading from Trial View-Only */}
      <AccessModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
      />
    </div>
  );
}

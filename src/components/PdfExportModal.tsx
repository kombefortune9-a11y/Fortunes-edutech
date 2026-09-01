import { getDownloadAccessStatus } from "../lib/downloadCheck";
import React, { useState } from 'react';
import { Share2, Download, ExternalLink, Printer, Check, X, FileText, AlertCircle } from 'lucide-react';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { useAuth } from './FirebaseProvider';
import { isDeveloperEmail } from '../constants';

export interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  blob: Blob | null;
  fileName: string;
  title: string;
  fileType?: 'pdf' | 'doc';
  onPrint?: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  blob,
  fileName,
  title,
  fileType = 'pdf',
  onPrint,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { user, subscriptionDetails } = useAuth();

  if (!isOpen || !blob) return null;

  const checkDownloadAccess = (): boolean => {
    const status = getDownloadAccessStatus(user, subscriptionDetails);
    if (!status.allowed) {
      toast.error(status.message, {
        id: 'pdf-export-depleted-toast',
        duration: 8000
      });
      return false;
    }
    return true;
  };

  const isPdf = fileType === 'pdf';
  const mimeType = isPdf ? 'application/pdf' : 'application/msword';
  const canShareFiles = typeof navigator !== 'undefined' && 
    !!navigator.canShare && 
    !!navigator.share;

  const handleNativeShare = async () => {
    if (!checkDownloadAccess()) return;
    try {
      const file = new File([blob], fileName, { type: mimeType });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || fileName,
          text: `Here is your document: ${fileName}`,
        });
        toast.success("Document shared successfully!");
        onClose();
        return;
      }
      
      // If direct file share is not accepted by mobile browser (e.g. for .doc), fallback to direct download
      handleDirectSave();
      toast.success("Downloaded document to phone! You can now attach it in WhatsApp or open in Office.");
    } catch (err: any) {
      if (err?.name !== 'AbortError' && !err?.message?.toLowerCase().includes('cancel')) {
        console.warn("Share fallback triggered:", err);
        handleDirectSave();
      }
    }
  };

  const handleDirectSave = () => {
    if (!checkDownloadAccess()) return;
    setDownloading(true);
    try {
      // Primary: Single clean anchor click with blob URL (best for mobile browsers)
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }, 1000);

      toast.success(`Saved ${fileName} to Downloads folder!`);
    } catch (err) {
      try {
        saveAs(blob, fileName);
        toast.success(`Saved ${fileName} to your device!`);
      } catch (fallbackErr) {
        console.error("Direct save error:", fallbackErr);
        toast.error("Download failed. Try 'Open in Browser' to save from there.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const blobUrl = URL.createObjectURL(blob);
      const newTab = window.open(blobUrl, '_blank');
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        // Pop-up was blocked, try opening via link
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      toast.success("Document opened in browser tab!");
    } catch (err) {
      console.error("Failed to open tab:", err);
      toast.error("Could not open new tab. Please use 'Save to Phone Storage'.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 inline-block mb-1">
                Document Ready
              </span>
              <h3 className="text-lg font-black text-white leading-tight line-clamp-1">
                {title || fileName}
              </h3>
              <p className="text-xs text-indigo-200 font-semibold mt-0.5">
                {fileName} • {formatFileSize(blob.size)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body & Action Buttons */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-slate-600 font-medium">
            Choose how you would like to save or share your {isPdf ? 'PDF' : 'Word'} document on your device:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Primary Action 1: Share to WhatsApp / Phone Apps */}
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2.5 p-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 transition-all border border-emerald-700"
            >
              <Share2 size={16} />
              <span>Share (WhatsApp / Apps)</span>
            </button>

            {/* Primary Action 2: Save directly to phone storage */}
            <button
              onClick={handleDirectSave}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2.5 p-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-indigo-600/20 transition-all border border-indigo-700"
            >
              <Download size={16} />
              <span>Save to Phone Storage</span>
            </button>

            {/* Action 3: Open in browser tab */}
            {isPdf && (
              <button
                onClick={handleOpenInNewTab}
                className="w-full flex items-center justify-center gap-2.5 p-3.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all border border-slate-200"
              >
                <ExternalLink size={16} className="text-slate-600" />
                <span>Open in Browser</span>
              </button>
            )}

            {/* Action 4: Print (if handler provided) */}
            {onPrint && (
              <button
                onClick={() => {
                  onClose();
                  onPrint();
                }}
                className="w-full flex items-center justify-center gap-2.5 p-3.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all border border-slate-200"
              >
                <Printer size={16} className="text-slate-600" />
                <span>Print Document</span>
              </button>
            )}
          </div>

          {/* Quick Help Box */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 leading-relaxed font-medium">
              <strong>Phone Tip:</strong> Tapping <em>&ldquo;Share (WhatsApp / Apps)&rdquo;</em> allows sending directly to WhatsApp chats, Google Drive, or Gmail. Tapping <em>&ldquo;Save to Phone Storage&rdquo;</em> downloads directly into your phone&apos;s Downloads folder.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};

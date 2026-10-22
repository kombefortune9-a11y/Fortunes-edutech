import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  SwitchCamera, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RotateCw, 
  Scan, 
  RefreshCw, 
  Zap, 
  FileText, 
  Users, 
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ScannedLearner {
  name: string;
  gender: 'M' | 'F';
  marks: string[];
  rawText?: string;
}

export interface ScanResult {
  success: boolean;
  totalLearners: number;
  boysCount: number;
  girlsCount: number;
  detectedSubjects?: string[];
  learners: ScannedLearner[];
  warnings?: string[];
  reportSummary: string;
  errorMessage?: string;
}

interface DocumentCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (result: ScanResult, rawTextFormatted: string) => void;
  subjects: Array<{ id: string; name: string }>;
  grade: string;
  term: string;
  defaultFallbackGender?: 'M' | 'F';
}

export function DocumentCameraScanner({
  isOpen,
  onClose,
  onScanComplete,
  subjects,
  grade,
  term,
  defaultFallbackGender = 'M'
}: DocumentCameraScannerProps) {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanReport, setScanReport] = useState<ScanResult | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when opened in camera mode
  useEffect(() => {
    if (isOpen && mode === 'camera' && !capturedImage && !scanReport) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode, facingMode, capturedImage, scanReport]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  };

  const startCamera = async () => {
    stopCamera();
    setScanError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as any;
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setIsCameraActive(false);
      setScanError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings or use the File Upload option.'
          : 'Unable to start camera. Please ensure camera is not in use or switch to Upload mode.'
      );
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !isTorchOn } as any]
        });
        setIsTorchOn(!isTorchOn);
      } catch (e) {
        console.warn('Failed to toggle torch', e);
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setCapturedImage(dataUrl);
    stopCamera();
    triggerScan(dataUrl);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    const files = Array.from(rawFiles);

    if (files.length === 1) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCapturedImage(dataUrl);
        stopCamera();
        triggerScan(dataUrl);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Multiple files selection
    setIsScanning(true);
    setScanError(null);
    setScanReport(null);
    setScanStep(`Processing ${files.length} selected document photos...`);
    stopCamera();

    try {
      let combinedLearners: ScannedLearner[] = [];
      let totalBoys = 0;
      let totalGirls = 0;
      let detectedSubjects: string[] = [];
      let warnings: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        setScanStep(`Reading document photo ${i + 1} of ${files.length}: ${file.name}...`);

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const response = await fetch('/api/gemini/scan-marks-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUrl,
            mimeType: file.type || 'image/jpeg',
            subjects: subjects.map(s => ({ id: s.id, name: s.name })),
            grade,
            term,
            fallbackGender: defaultFallbackGender
          })
        });

        const data: ScanResult = await response.json();
        if (response.ok && data.success && Array.isArray(data.learners) && data.learners.length > 0) {
          combinedLearners = [...combinedLearners, ...data.learners];
          totalBoys += data.boysCount || 0;
          totalGirls += data.girlsCount || 0;
          if (data.detectedSubjects) {
            detectedSubjects = Array.from(new Set([...detectedSubjects, ...data.detectedSubjects]));
          }
          if (data.warnings) {
            warnings = [...warnings, ...data.warnings];
          }
        }
      }

      if (combinedLearners.length > 0) {
        const formattedLines = combinedLearners.map(l => {
          const marksStr = Array.isArray(l.marks) && l.marks.length > 0 ? `, ${l.marks.join(', ')}` : '';
          return `${l.name}, ${l.gender}${marksStr}`;
        });
        const rawTextFormatted = formattedLines.join('\n');

        const combinedResult: ScanResult = {
          success: true,
          totalLearners: combinedLearners.length,
          boysCount: totalBoys,
          girlsCount: totalGirls,
          detectedSubjects,
          learners: combinedLearners,
          warnings,
          reportSummary: `Successfully extracted ${combinedLearners.length} pupil(s) across ${files.length} document photos.`
        };

        setScanReport(combinedResult);
        onScanComplete(combinedResult, rawTextFormatted);
        toast.success(`Scanned ${combinedLearners.length} pupil(s) from ${files.length} document photos!`);
      } else {
        const msg = "No readable learner records detected across selected documents.";
        setScanError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      console.error('Multi-file scan error:', err);
      const msg = err.message || 'Error scanning uploaded documents.';
      setScanError(msg);
      toast.error(msg);
    } finally {
      setIsScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  const triggerScan = async (imageDataUrl: string) => {
    setIsScanning(true);
    setScanError(null);
    setScanReport(null);
    setScanStep('Optimizing document contrast and angle...');

    try {
      // Step update
      setTimeout(() => {
        setScanStep('Reading learner rows, detecting gender & marks...');
      }, 1000);

      setTimeout(() => {
        setScanStep('Organizing boys & girls and mapping subject columns...');
      }, 2200);

      const response = await fetch('/api/gemini/scan-marks-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          mimeType: 'image/jpeg',
          subjects: subjects.map(s => ({ id: s.id, name: s.name })),
          grade,
          term,
          fallbackGender: defaultFallbackGender
        })
      });

      const data: ScanResult = await response.json();

      if (!response.ok || !data.success || !data.learners || data.learners.length === 0) {
        const errorMsg = data.errorMessage || data.reportSummary || 'Unable to detect legible learner names or marks on the document.';
        setScanError(errorMsg);
        setScanReport({
          success: false,
          totalLearners: 0,
          boysCount: 0,
          girlsCount: 0,
          learners: [],
          reportSummary: errorMsg,
          errorMessage: errorMsg
        });
        toast.error('Document scan failed: ' + errorMsg, { duration: 5000 });
        return;
      }

      // Convert learners into bulk formatted text for easy fallback paste
      const formattedLines = data.learners.map(l => {
        const marksStr = Array.isArray(l.marks) && l.marks.length > 0 ? `, ${l.marks.join(', ')}` : '';
        return `${l.name}, ${l.gender}${marksStr}`;
      });
      const rawTextFormatted = formattedLines.join('\n');

      setScanReport(data);

      // Automatically complete and populate directly into the table
      onScanComplete(data, rawTextFormatted);
    } catch (err: any) {
      console.error('Scan request error:', err);
      const msg = err.message || 'Network error during document scanning.';
      setScanError(msg);
      setScanReport({
        success: false,
        totalLearners: 0,
        boysCount: 0,
        girlsCount: 0,
        learners: [],
        reportSummary: msg,
        errorMessage: msg
      });
      toast.error('Scan error: ' + msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScanReport(null);
    setScanError(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30">
              <Camera size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight uppercase text-white">
                  Document Camera Scanner
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/40">
                  AI OCR
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Scan physical mark sheets, registers & handwritten score lists
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all font-bold"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-2 gap-2">
          <button
            onClick={() => {
              setMode('camera');
              setCapturedImage(null);
              setScanReport(null);
              setScanError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-t-xl transition-all border-b-2 ${
              mode === 'camera'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera size={14} />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => {
              setMode('upload');
              stopCamera();
              setCapturedImage(null);
              setScanReport(null);
              setScanError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-t-xl transition-all border-b-2 ${
              mode === 'upload'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload size={14} />
            <span>Upload Photo / File</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* SCAN REPORT (Success or Failed notification card) */}
          <AnimatePresence>
            {scanReport && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl border ${
                  scanReport.success
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/90 border-rose-200 text-rose-950'
                } shadow-sm space-y-2`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    {scanReport.success ? (
                      <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-xl">
                        <CheckCircle2 size={18} />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-rose-100 text-rose-600 rounded-xl">
                        <AlertCircle size={18} />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight">
                        {scanReport.success ? 'Extracted from photo' : 'Scanning Issue'}
                      </h4>
                      <p className="text-xs font-semibold leading-snug">
                        {scanReport.success
                          ? `${scanReport.totalLearners} pupil(s) (${scanReport.boysCount} Boys, ${scanReport.girlsCount} Girls). Check the marks carefully, then Save.`
                          : scanReport.errorMessage || 'Could not recognize learner details. Please try again.'}
                      </p>
                    </div>
                  </div>

                  {!scanReport.success && capturedImage && !isScanning && (
                    <button
                      onClick={() => triggerScan(capturedImage)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>Retry</span>
                    </button>
                  )}
                </div>

                {scanReport.success && scanReport.warnings && scanReport.warnings.length > 0 && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                    {scanReport.warnings.map((w, idx) => (
                      <div key={idx}>• {w}</div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* SCANNING RADAR OVERLAY */}
          {isScanning && (
            <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col items-center justify-center space-y-4 relative overflow-hidden border border-slate-700 shadow-xl">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400 animate-spin" />
                <div className="p-4 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/50">
                  <Scan size={28} className="animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-sm font-black uppercase tracking-wide text-blue-300">
                  AI Optical Recognition in Progress
                </h4>
                <p className="text-xs text-slate-300 font-medium">{scanStep}</p>
              </div>
            </div>
          )}

          {/* VIEW 1: CAPTURED IMAGE PREVIEW */}
          {capturedImage && !isScanning && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 aspect-4/3 flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Captured Document"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleRetake}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold hover:bg-slate-900 transition-all"
                  >
                    <RefreshCw size={12} />
                    <span>Retake</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: LIVE CAMERA STREAM */}
          {mode === 'camera' && !capturedImage && !isScanning && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 aspect-4/3 flex items-center justify-center">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Alignment Box */}
                    <div className="absolute inset-4 sm:inset-6 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex justify-between items-start text-[10px] font-black text-white/80 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-lg w-fit">
                        <span>Align Document / Marksheet</span>
                      </div>
                      <div className="text-center text-[10px] font-bold text-white/70 bg-black/40 backdrop-blur-xs py-0.5 rounded-lg">
                        Ensure table columns & text are well lit
                      </div>
                    </div>

                    {/* Quick Camera Controls */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {hasTorch && (
                        <button
                          onClick={toggleTorch}
                          className={`p-2 rounded-xl backdrop-blur-xs transition-all ${
                            isTorchOn ? 'bg-amber-500 text-slate-900' : 'bg-black/50 text-white hover:bg-black/70'
                          }`}
                          title="Toggle Flashlight"
                        >
                          <Zap size={16} />
                        </button>
                      )}
                      <button
                        onClick={toggleCamera}
                        className="p-2 rounded-xl bg-black/50 backdrop-blur-xs text-white hover:bg-black/70 transition-all"
                        title="Switch Camera (Front/Back)"
                      >
                        <SwitchCamera size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center space-y-3 text-slate-300">
                    <div className="p-3 bg-slate-800 text-slate-400 rounded-2xl w-fit mx-auto">
                      <Camera size={28} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Camera Offline or Inactive</p>
                      <p className="text-[11px] text-slate-400">Click below to start camera or switch to file upload.</p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase shadow-md"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Shutter Capture Button */}
              {isCameraActive && (
                <div className="flex items-center justify-center pt-2">
                  <button
                    onClick={capturePhoto}
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white shadow-xl shadow-blue-500/30 border-4 border-white transition-all"
                    title="Capture Document Photo"
                  >
                    <Camera size={26} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: UPLOAD MODE */}
          {mode === 'upload' && !capturedImage && !isScanning && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3 group"
            >
              <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600 group-hover:scale-110 transition-all border border-slate-100">
                <Upload size={28} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900">
                  Select Document Photo or Mark Sheet
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Supports JPG, PNG, WebP (Take photo or select from gallery)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase shadow-xs">
                Browse or Take Photo
              </span>
            </div>
          )}

          {/* GUIDANCE NOTES */}
          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
            <div className="font-black flex items-center gap-1.5 uppercase text-[10px]">
              <HelpCircle size={13} className="text-blue-600" />
              <span>Scanning Tips for Highest Accuracy:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800 font-medium pl-1 text-[11px]">
              <li>Keep the document completely flat under steady lighting with minimal shadows.</li>
              <li>Ensure learner names, gender (M/F), and mark columns are clearly visible.</li>
              <li>The system automatically separates boys and girls into their respective tables starting from Learner 1.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs uppercase hover:bg-slate-200 transition-all"
          >
            Close
          </button>

          {capturedImage && !isScanning && (
            <button
              onClick={() => triggerScan(capturedImage)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Sparkles size={14} />
              <span>Rescan with AI</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

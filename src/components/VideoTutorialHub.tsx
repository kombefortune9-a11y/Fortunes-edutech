import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Video, 
  Mic, 
  Camera, 
  Monitor, 
  Download, 
  HelpCircle, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Languages, 
  Share2, 
  Info,
  Clock,
  Layers,
  ChevronRight,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useAuth } from './FirebaseProvider';
import { isDeveloperEmail } from '../constants';

interface TutorialVideo {
  id: string;
  title: string;
  category: 'teacher' | 'student' | 'admin' | 'overview';
  duration: string;
  description: string;
  videoUrl?: string; // Embedded video URL (e.g. MP4, YouTube embed, Cloudinary)
  thumbnailColor: string;
  steps: { time: string; title: string; desc: string }[];
}

const TUTORIAL_VIDEOS: TutorialVideo[] = [
  {
    id: 'teacher-core-walkthrough',
    title: 'Teacher Guide: Generate Lesson Plans & Schemes of Work in 2 Minutes',
    category: 'teacher',
    duration: '2:45',
    description: 'Complete video demonstration on selecting Grade & Subject, generating CBC/OBC Lesson Plans, Weekly Forecasts, and exporting high-quality PDFs.',
    thumbnailColor: 'from-emerald-600 to-teal-800',
    steps: [
      { time: '0:00', title: 'Dashboard Overview', desc: 'Navigating Fortunes Edutech dashboard & selecting Grade/Subject' },
      { time: '0:40', title: 'Generating Schemes of Work', desc: 'Filling term details & instant AI scheme generation' },
      { time: '1:15', title: 'Creating Lesson Plans', desc: 'Structuring lesson stages, competencies, and materials' },
      { time: '2:00', title: 'Exporting & Sharing PDF', desc: 'Downloading standard A4 portrait PDF directly to phone storage' }
    ]
  },
  {
    id: 'student-quiz-assessment',
    title: 'Student & Learner Guide: Accessing Notes & Attempting Quizzes',
    category: 'student',
    duration: '1:50',
    description: 'Learn how learners access Grade 1-12 notes, complete interactive assessments, and track performance scores.',
    thumbnailColor: 'from-blue-600 to-indigo-800',
    steps: [
      { time: '0:00', title: 'Student Sign In', desc: 'Logging in with NRC or Guest trial email' },
      { time: '0:30', title: 'Accessing Lesson Notes', desc: 'Browsing CBC aligned learning materials' },
      { time: '1:10', title: 'Taking Quizzes', desc: 'Submitting answers and instant grade feedback' }
    ]
  },
  {
    id: 'admin-school-management',
    title: 'School Admin & Head Teacher: Assessment Tracking & Reports',
    category: 'admin',
    duration: '2:15',
    description: 'Track school mean scores, grade distribution, subject pass rates, and export official ministry report sheets.',
    thumbnailColor: 'from-purple-600 to-indigo-900',
    steps: [
      { time: '0:00', title: 'Assessment Tracker', desc: 'Entering class test scores and CA marks' },
      { time: '1:00', title: 'Performance Analytics', desc: 'Analyzing district and school mean trends' },
      { time: '1:45', title: 'PDF & Excel Export', desc: 'Generating official academic performance reports' }
    ]
  }
];

export function VideoTutorialHub({ onNavigateToSection, onBack }: { onNavigateToSection?: (section: string) => void; onBack?: () => void }) {
  const { user, userType } = useAuth();
  const isDeveloper = userType === 'developer' || isDeveloperEmail(user?.email);

  const [activeTab, setActiveTab] = useState<'videos' | 'recorder' | 'tour'>('videos');
  const [selectedVideo, setSelectedVideo] = useState<TutorialVideo>(TUTORIAL_VIDEOS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'bemba' | 'nyanja'>('en');

  // Guard activeTab if non-developer attempts to access recorder
  useEffect(() => {
    if (!isDeveloper && activeTab === 'recorder') {
      setActiveTab('videos');
    }
  }, [isDeveloper, activeTab]);

  // Developer In-App Screen + Webcam Recorder States
  const [recordingSource, setRecordingSource] = useState<'screen' | 'camera'>('screen');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [includeWebcam, setIncludeWebcam] = useState(true);
  const [includeMic, setIncludeMic] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showIframeModal, setShowIframeModal] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopAllTracks();
    };
  }, []);

  const stopAllTracks = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Start In-App Screen + Webcam Recording
  const handleStartRecording = async () => {
    try {
      setRecordedChunks([]);
      setRecordingUrl(null);

      const mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
      const getDisplayMediaFn = mediaDevices && typeof (mediaDevices as any).getDisplayMedia === 'function'
        ? (mediaDevices as any).getDisplayMedia.bind(mediaDevices)
        : null;
      const getUserMediaFn = mediaDevices && typeof mediaDevices.getUserMedia === 'function'
        ? mediaDevices.getUserMedia.bind(mediaDevices)
        : null;

      let finalStream: MediaStream | null = null;

      if (recordingSource === 'screen') {
        if (!getDisplayMediaFn) {
          setShowIframeModal(true);
          return;
        }

        let screenStream: MediaStream | null = null;
        try {
          screenStream = await getDisplayMediaFn({
            video: {
              displaySurface: 'browser'
            },
            audio: true
          });
          screenStreamRef.current = screenStream;
        } catch (e: any) {
          console.warn('getDisplayMedia failed:', e);
          setShowIframeModal(true);
          return;
        }

        // Get microphone audio if requested
        let micStream: MediaStream | null = null;
        if (includeMic && getUserMediaFn) {
          try {
            micStream = await getUserMediaFn({ audio: true });
            micStreamRef.current = micStream;
          } catch (e) {
            console.warn('Microphone permission denied:', e);
          }
        }

        // Get webcam video if requested
        let webcamStream: MediaStream | null = null;
        if (includeWebcam && getUserMediaFn) {
          try {
            webcamStream = await getUserMediaFn({ video: { width: 640, height: 480 } });
            webcamStreamRef.current = webcamStream;
          } catch (e) {
            console.warn('Webcam permission denied:', e);
          }
        }

        if (webcamStream && screenStream) {
          // Combine screen and webcam on HTML5 Canvas for Picture-In-Picture
          const canvas = document.createElement('canvas');
          canvas.width = 1920;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');

          const screenVid = document.createElement('video');
          screenVid.srcObject = screenStream;
          screenVid.muted = true;
          await screenVid.play().catch(() => {});

          const camVid = document.createElement('video');
          camVid.srcObject = webcamStream;
          camVid.muted = true;
          await camVid.play().catch(() => {});

          const drawLoop = () => {
            if (ctx) {
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(0, 0, 1920, 1080);

              if (screenVid.readyState >= 2) {
                ctx.drawImage(screenVid, 0, 0, 1920, 1080);
              }

              if (camVid.readyState >= 2) {
                const pipW = 380;
                const pipH = 285;
                const x = 1920 - pipW - 36;
                const y = 1080 - pipH - 36;

                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                  ctx.roundRect(x, y, pipW, pipH, 20);
                } else {
                  ctx.rect(x, y, pipW, pipH);
                }
                ctx.clip();
                ctx.drawImage(camVid, x, y, pipW, pipH);
                ctx.restore();

                // Emerald PiP border
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#00A86B';
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                  ctx.roundRect(x, y, pipW, pipH, 20);
                } else {
                  ctx.rect(x, y, pipW, pipH);
                }
                ctx.stroke();
              }
            }
            animFrameRef.current = requestAnimationFrame(drawLoop);
          };
          drawLoop();

          const canvasStream = canvas.captureStream(30);
          const combinedAudioTracks = [
            ...screenStream.getAudioTracks(),
            ...(micStream ? micStream.getAudioTracks() : [])
          ];

          finalStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...combinedAudioTracks
          ]);
        } else {
          // Pure screen stream + audio
          const audioTracks = [
            ...screenStream.getAudioTracks(),
            ...(micStream ? micStream.getAudioTracks() : [])
          ];
          finalStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...audioTracks
          ]);
        }
      } else {
        // Camera only mode
        if (!getUserMediaFn) {
          toast.error('Camera access is not supported in this browser environment.');
          return;
        }

        const camStream = await getUserMediaFn({
          video: true,
          audio: includeMic
        });
        webcamStreamRef.current = camStream;
        finalStream = camStream;
      }

      if (!finalStream) {
        toast.error('Failed to create media recording stream.');
        return;
      }

      const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? { mimeType: 'video/webm;codecs=vp9' }
        : MediaRecorder.isTypeSupported('video/webm')
        ? { mimeType: 'video/webm' }
        : MediaRecorder.isTypeSupported('video/mp4')
        ? { mimeType: 'video/mp4' }
        : undefined;

      const mediaRecorder = new MediaRecorder(finalStream, options);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = options?.mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        setRecordedChunks(chunks);
        toast.success('Demonstration video recorded successfully!');
        stopAllTracks();
        setIsRecording(false);
      };

      // Stop if screen track ends
      if (screenStreamRef.current) {
        screenStreamRef.current.getVideoTracks()[0].onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
      }

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started! Demonstrate your app components now.');
    } catch (err: any) {
      console.error('Error starting recording:', err);
      toast.error('Could not start recording. Please grant screen or microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleDownloadRecord = () => {
    if (!recordingUrl) return;
    const a = document.createElement('a');
    a.href = recordingUrl;
    a.download = `Fortunes_Edutech_Demo_${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Video downloaded to your device!');
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Back Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer group"
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={16} className="text-emerald-600 group-hover:text-white transition-colors" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#00A86B] via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100 border border-white/20">
            <Video size={14} className="animate-pulse" />
            <span>{isDeveloper ? 'Developer & User Video Tutorials' : 'Video Tutorials & User Guides'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {isDeveloper 
              ? 'Fortunes Edutech App Walkthroughs & Recording Studio' 
              : 'Fortunes Edutech App Walkthroughs & Video Guides'}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
            {isDeveloper 
              ? 'Watch full video demonstrations of Fortunes Edutech with screen clicks, facecam, and voiceover in English, Chibemba, or Nyanja — or use the built-in Developer Studio to record your own demo directly!'
              : 'Watch step-by-step video demonstrations of Fortunes Edutech features with voiceover in English, Chibemba, or Nyanja.'}
          </p>

          {/* Tab Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-white text-emerald-900 shadow-md scale-105'
                  : 'bg-emerald-800/60 hover:bg-emerald-800 text-white'
              }`}
            >
              <Play size={14} />
              <span>Video Library</span>
            </button>

            {isDeveloper && (
              <button
                onClick={() => setActiveTab('recorder')}
                className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'recorder'
                    ? 'bg-white text-emerald-900 shadow-md scale-105'
                    : 'bg-emerald-800/60 hover:bg-emerald-800 text-white'
                }`}
              >
                <Camera size={14} />
                <span>Developer Recording Studio</span>
                <span className="bg-amber-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">LIVE</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('tour')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'tour'
                  ? 'bg-white text-emerald-900 shadow-md scale-105'
                  : 'bg-emerald-800/60 hover:bg-emerald-800 text-white'
              }`}
            >
              <Compass size={14} />
              <span>Interactive Step Tour</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: VIDEO LIBRARY */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Player Container */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
              {/* Mock Video Screen Canvas */}
              <div className="aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-6 text-center relative group">
                <div className="w-16 h-16 bg-[#00A86B] text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50 hover:scale-110 transition-transform cursor-pointer mb-4">
                  <Play size={28} className="ml-1" />
                </div>
                
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">
                  Demonstration Preview • {selectedVideo.duration}
                </span>

                <h2 className="text-white font-black text-lg sm:text-xl max-w-md tracking-tight leading-snug">
                  {selectedVideo.title}
                </h2>
                
                <p className="text-slate-400 text-xs mt-2 max-w-sm line-clamp-2">
                  {selectedVideo.description}
                </p>

                {/* Speaker & Language Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-white text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Developer Voice + Screen + Facecam</span>
                  </div>
                </div>

                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800">
                    <Languages size={13} className="text-emerald-400 ml-1.5" />
                    <button 
                      onClick={() => setSelectedLanguage('en')} 
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${selectedLanguage === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      ENG
                    </button>
                    <button 
                      onClick={() => setSelectedLanguage('bemba')} 
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${selectedLanguage === 'bemba' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      BEM
                    </button>
                    <button 
                      onClick={() => setSelectedLanguage('nyanja')} 
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${selectedLanguage === 'nyanja' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      NYA
                    </button>
                  </div>
                </div>

                {/* Bottom Overlay Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <button className="hover:text-emerald-400 transition-colors">
                      <Play size={16} />
                    </button>
                    <span className="font-mono text-[11px]">0:00 / {selectedVideo.duration}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] font-medium">
                    <span className="text-emerald-400 font-bold">HD 1080p</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">1.0x</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Details & Timestamps */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                    Active Video Tutorial
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {selectedVideo.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      toast.success('Tutorial link copied to clipboard!');
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 size={13} />
                    <span>Share Link</span>
                  </button>

                  {onNavigateToSection && (
                    <button
                      onClick={() => onNavigateToSection('schemes_of_work')}
                      className="px-3.5 py-2 rounded-xl bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100"
                    >
                      <span>Try Feature Now</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Step Bookmarks / Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Clock size={13} className="text-emerald-600" />
                  <span>Video Chapters & Key Clicks Highlighted</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {selectedVideo.steps.map((step, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group flex items-start gap-3"
                    >
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black font-mono px-2 py-1 rounded-lg shrink-0 mt-0.5">
                        {step.time}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-slate-900 group-hover:text-emerald-900">
                          {step.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Playlist Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers size={16} className="text-emerald-600" />
                  <span>All Video Demonstrations</span>
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  3 Videos
                </span>
              </div>

              <div className="space-y-2.5">
                {TUTORIAL_VIDEOS.map((vid) => {
                  const isSelected = vid.id === selectedVideo.id;
                  return (
                    <div
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${vid.thumbnailColor} text-white shrink-0 flex items-center justify-center font-black text-xs shadow-inner`}>
                        <Play size={18} className="ml-0.5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                            {vid.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {vid.duration}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {vid.title}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Developer Tip / Teacher Support Card */}
            {isDeveloper ? (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 space-y-3 border border-slate-700">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                  <Sparkles size={15} />
                  <span>Developer Recording Studio</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Record face + voice + screen component demos for Fortunes Edutech directly in your developer interface studio.
                </p>
                <button
                  onClick={() => setActiveTab('recorder')}
                  className="w-full bg-[#00A86B] hover:bg-emerald-600 text-white text-xs font-black py-2.5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950"
                >
                  <Camera size={14} />
                  <span>Open Developer Studio</span>
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-5 space-y-3 border border-emerald-800/60">
                <div className="flex items-center gap-2 text-emerald-300 font-black text-xs uppercase tracking-wider">
                  <BookOpen size={15} />
                  <span>Teacher Support Guide</span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                  Need step-by-step guidance on generating Schemes of Work, Lesson Plans, or Weekly Forecasts? View our complete User Manual.
                </p>
                {onNavigateToSection && (
                  <button
                    onClick={() => onNavigateToSection('user_manual')}
                    className="w-full bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-black py-2.5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <BookOpen size={14} />
                    <span>Open User Manual (PDF)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IN-APP DEVELOPER RECORDING STUDIO (DEVELOPER INTERFACE ONLY) */}
      {isDeveloper && activeTab === 'recorder' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          {/* Iframe Notice Banner */}
          {isInIframe && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Iframe Screen Capture Notice
                  </h4>
                  <p className="text-xs font-medium text-amber-800">
                    Browsers restrict display/screen sharing inside embedded preview frames. Open Fortunes Edutech in a new tab to share your full desktop screen, browser windows, and app components.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider shrink-0 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Open in New Tab ↗</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                <Monitor size={14} />
                <span>Developer Interface Feature</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                In-App Screen & Voice Recorder Studio
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Demonstrate Fortunes Edutech app components by sharing your screen with optional voiceover and floating webcam!
              </p>
            </div>

            {/* Recording Action Buttons */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="bg-[#00A86B] hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>Start Screen + Voice Demo</span>
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-200 transition-all flex items-center gap-2 cursor-pointer animate-bounce"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span>Stop Recording ({formatSeconds(recordingTime)})</span>
                </button>
              )}
            </div>
          </div>

          {/* Source Selection & Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              1. Choose What To Record
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRecordingSource('screen')}
                disabled={isRecording}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  recordingSource === 'screen'
                    ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">App Screen & Components</h4>
                    <p className="text-[11px] text-slate-500">Record full screen, app windows, or tabs</p>
                  </div>
                </div>
                {recordingSource === 'screen' && (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRecordingSource('camera')}
                disabled={isRecording}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  recordingSource === 'camera'
                    ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Camera / Webcam Only</h4>
                    <p className="text-[11px] text-slate-500">Record face presentation video</p>
                  </div>
                </div>
                {recordingSource === 'camera' && (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Toggle Switches for Webcam & Mic */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              2. Audio & Picture-In-Picture Controls
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Mic size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Include Microphone Voice</h4>
                    <p className="text-[11px] text-slate-500">Record developer voiceover explanation</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeMic}
                  onChange={(e) => setIncludeMic(e.target.checked)}
                  disabled={isRecording}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {recordingSource === 'screen' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Include Developer Webcam</h4>
                      <p className="text-[11px] text-slate-500">Overlay facecam in bottom right corner</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeWebcam}
                    onChange={(e) => setIncludeWebcam(e.target.checked)}
                    disabled={isRecording}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Recorded Result Player & Download */}
          {recordingUrl && (
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-black text-white">Recorded Video Preview Ready</h3>
                </div>
                <button
                  onClick={handleDownloadRecord}
                  className="bg-[#00A86B] hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Download size={14} />
                  <span>Download MP4/WebM Video</span>
                </button>
              </div>

              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800">
                <video
                  src={recordingUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Instructions Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={14} className="text-emerald-700" />
              <span>How To Create The Ideal Demonstration Video</span>
            </h4>
            <ul className="text-xs text-emerald-900 space-y-1.5 list-disc pl-5 font-medium leading-relaxed">
              <li>Click <strong>"Start Screen + Voice Demo"</strong> and choose the <strong>Entire Screen</strong> or <strong>Current Tab</strong>.</li>
              <li>Perform the demonstration: Log in → Select Subject → Generate Lesson Plan → Export PDF.</li>
              <li>When finished, click <strong>"Stop Recording"</strong>. Your video will be compiled instantly in the browser ready for download!</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE GUIDED TOUR */}
      {activeTab === 'tour' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
              <Compass size={14} />
              <span>Interactive Guided Tour</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              4-Step Guided Interface Tour
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Follow these highlighted steps to master Fortunes Edutech in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-500 transition-all">
              <span className="w-7 h-7 rounded-full bg-[#00A86B] text-white flex items-center justify-center font-black text-xs">1</span>
              <h3 className="text-sm font-black text-slate-900">Select Grade & Curriculum</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Choose Grade 1-12 under CBC (Competency-Based) or OBC (Outcome-Based) curriculum in the dashboard or sidebar menu.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-500 transition-all">
              <span className="w-7 h-7 rounded-full bg-[#00A86B] text-white flex items-center justify-center font-black text-xs">2</span>
              <h3 className="text-sm font-black text-slate-900">Select Document Generator</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Pick <strong>Schemes of Work</strong>, <strong>Weekly Forecast</strong>, <strong>Lesson Plans</strong>, <strong>Lesson Notes</strong>, or <strong>Assessments</strong>.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-500 transition-all">
              <span className="w-7 h-7 rounded-full bg-[#00A86B] text-white flex items-center justify-center font-black text-xs">3</span>
              <h3 className="text-sm font-black text-slate-900">Instant AI Document Generation</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Click <strong>"Generate Document"</strong> to produce standard teaching documents pre-filled with official outcomes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-500 transition-all">
              <span className="w-7 h-7 rounded-full bg-[#00A86B] text-white flex items-center justify-center font-black text-xs">4</span>
              <h3 className="text-sm font-black text-slate-900">Direct PDF Export & Sharing</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Download clean A4 portrait PDFs directly to phone storage or share immediately via WhatsApp / Email.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            {onNavigateToSection && (
              <button
                onClick={() => onNavigateToSection('schemes_of_work')}
                className="bg-[#00A86B] hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Launch App Generator Now</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog for Iframe Screen Capture Permission */}
      <AnimatePresence>
        {showIframeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Monitor size={28} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Open App in New Tab to Share Screen
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Web browsers restrict display and screen capture inside embedded preview frames for security.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  To record and demonstrate your Fortunes Edutech app components, open the app in a dedicated browser tab where full screen, window, and app tab sharing is enabled!
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    window.open(window.location.href, '_blank');
                    setShowIframeModal(false);
                  }}
                  className="flex-1 bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 size={16} />
                  <span>Open in New Tab & Share Screen ↗</span>
                </button>

                <button
                  onClick={() => setShowIframeModal(false)}
                  className="px-5 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

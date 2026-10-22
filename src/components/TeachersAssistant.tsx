import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  HelpCircle, 
  GraduationCap, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Globe, 
  RefreshCw, 
  PhoneCall, 
  Volume1, 
  Ear,
  Smile,
  AudioLines
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askGeminiAssistant } from '../services/geminiService';
import { toast } from 'react-hot-toast';
import { useAuth } from './FirebaseProvider';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const PRESETS = [
  { label: "App Curriculum Frameworks", prompt: "How many curriculum frameworks does this App integrate (OBC 2013 and CBC 2023/2024 shift)?" },
  { label: "OBC vs CBC Differences", prompt: "Explain the structural differences between OBC (Grades 3, 5-12) and CBC (ECE, Grade 1, 2, 4) in the Fortunes Edutech App." },
  { label: "PLP Literacy Guidance", prompt: "Explain the Primary Literacy Programme (PLP) framework in Zambia and how to construct a phonics lesson." },
  { label: "Latest World & Zambia News", prompt: "What are the latest educational and economic news updates in Zambia and globally?" }
];

export function TeachersAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Mwapoleni! I am your **Teacher's Assistant**. Ask me any questions about **Zambian Curriculum Frameworks (OBC 2013 & CBC 2023/2024 Shift)**, lesson planning tips, or global current affairs. You can also chat using **Voice Mode** or enter hands-free **Live Conversation Mode**!"
    }
  ]);

  // Helper to extract the user's first name elegantly (prioritizing English given names over surnames)
  const getUserFirstName = () => {
    // Check localStorage first for user override
    const savedName = localStorage.getItem('teacher_preferred_name');
    if (savedName) return savedName;

    if (!user) return 'Teacher';
    
    // Comprehensive list of common English names, virtue names, and spiritual names
    const englishNames = [
      'fortune', 'grace', 'blessing', 'hope', 'gift', 'joy', 'faith', 'mercy', 'peace', 
      'love', 'patience', 'comfort', 'precious', 'glorious', 'miracle', 'light', 'wisdom',
      'given', 'memory', 'charity', 'happy', 'bright', 'glory', 'divine', 'innocent',
      'john', 'david', 'sarah', 'mary', 'james', 'peter', 'paul', 'joseph', 'michael', 
      'elizabeth', 'ruth', 'esther', 'samuel', 'emmanuel', 'daniel', 'gabriel', 'isaac', 
      'jacob', 'moses', 'aaron', 'joshua', 'caleb', 'gideon', 'samson', 'solomon', 
      'elijah', 'elisha', 'job', 'jonah', 'matthew', 'mark', 'luke', 'andrew', 'philip', 
      'thomas', 'simon', 'jude', 'timothy', 'titus', 'silas', 'barnabas', 'stephen', 
      'charles', 'george', 'william', 'henry', 'richard', 'edward', 'albert', 'arthur', 
      'harold', 'walter', 'robert', 'frank', 'fred', 'harry', 'jack', 'tom', 'bill', 
      'jim', 'joe', 'bob', 'sam', 'ben', 'dan', 'ray', 'roy', 'guy', 'max', 'leo', 
      'ted', 'ned', 'ken', 'don', 'ron', 'jon', 'ian', 'brian', 'victor', 'victoria', 
      'patricia', 'alice', 'beatrice', 'catherine', 'dorothy', 'evelyn', 'florence', 
      'helen', 'irene', 'jane', 'margaret', 'martha', 'nancy', 'rebecca', 'susan', 
      'theresa', 'winifred', 'brent', 'bruce', 'clive', 'colin', 'dennis', 'derek', 
      'donald', 'douglas', 'duncan', 'eric', 'gordon', 'graham', 'keith', 'kenneth', 
      'malcolm', 'neil', 'norman', 'ronald', 'stewart', 'terence', 'trevor', 'wallace', 
      'christopher', 'gerald', 'lawrence', 'patrick', 'terry', 'glenn', 'gregory', 
      'jeffrey', 'randall', 'roger', 'steven'
    ];

    let fullName = '';
    if (user.displayName && !user.displayName.toLowerCase().includes('guest') && !user.displayName.toLowerCase().includes('teacher')) {
      fullName = user.displayName.trim();
    } else if (user.email) {
      // Clean numbers and common delimiters to get names
      fullName = user.email.split('@')[0].replace(/\d+/g, ' ').replace(/[._-]/g, ' ').trim();
    }

    if (fullName) {
      // Split by whitespace to find individual word components
      const words = fullName.toLowerCase().split(/\s+/);
      
      // 1. First scan for an exact word match in our list of common English names/virtues
      for (const word of words) {
        if (englishNames.includes(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
      }

      // 2. Scan if any English name is present as a substring within any composite word (e.g., "kombefortune")
      for (const word of words) {
        for (const eng of englishNames) {
          if (word.includes(eng) && eng.length >= 4) {
            return eng.charAt(0).toUpperCase() + eng.slice(1);
          }
        }
      }

      // 3. Fallback: If multiple words exist, and we have a custom display name, try the second part as English given name
      const rawParts = fullName.split(/\s+/);
      if (rawParts.length > 1) {
        const secondPart = rawParts[1];
        if (secondPart && secondPart.length >= 2) {
          return secondPart.charAt(0).toUpperCase() + secondPart.slice(1).toLowerCase();
        }
      }

      // 4. Ultimate fallback to the first word
      const firstPart = rawParts[0];
      if (firstPart && firstPart.length >= 2) {
        return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
      }
    }
    
    return 'Teacher';
  };

  // Personalize welcome message once user info is loaded
  useEffect(() => {
    const name = getUserFirstName();
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'model' && (prev[0].text.startsWith("Mwapoleni!") || prev[0].text.startsWith("Mwapoleni,"))) {
        return [{
          role: 'model',
          text: `Mwapoleni, **${name}**! I am your **Teacher's Assistant**. Ask me any questions about **Zambian Curriculum Frameworks (OBC 2013 & CBC 2023/2024 Shift)**, lesson planning tips, or global current affairs. You can also chat using **Voice Mode** or enter hands-free **Live Conversation Mode**!`
        }];
      }
      return prev;
    });
  }, [user]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load and refresh speech synthesis voices asynchronously
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);
  
  // Voice Gender selection and transcript reference
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>(() => {
    return (localStorage.getItem('assistant_voice_gender') as 'female' | 'male') || 'female';
  });
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    return localStorage.getItem('assistant_selected_voice_uri') || '';
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const lastTranscriptRef = useRef<string>('');
  
  // Standard Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    const saved = localStorage.getItem('assistant_auto_speak');
    return saved !== null ? saved === 'true' : true;
  });
  
  // Live Conversation Mode State (Hands-free phone call experience)
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  // Scroll visibility state for rectangular toggle
  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeoutRef = useRef<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const liveRecognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // Auto-scroll chat box
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isListening]);

  // Monitor Scroll Event on main-scroll-container to slide toggle in & out
  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    let isCurrentlyVisible = true;
    
    const handleScroll = () => {
      if (isCurrentlyVisible) {
        isCurrentlyVisible = false;
        setIsVisible(false);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        isCurrentlyVisible = true;
        setIsVisible(true);
      }, 350);
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Clean markdown for text-to-speech
  const cleanMarkdownForSpeech = (rawText: string): string => {
    return rawText
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*{1,2}/g, '')
      .replace(/`{1,3}.*?`{1,3}/gs, '')
      .replace(/\|/g, ' ')
      .replace(/[-*]\s+/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  // Helper to choose natural, high-fidelity male or female voices with full browser coverage
  const getSelectedVoice = (gender: 'male' | 'female', customURI?: string): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Direct custom URI match if user explicitly picked a voice in dropdown
    if (customURI) {
      const match = voices.find(v => v.voiceURI === customURI || v.name === customURI);
      if (match) return match;
    }

    const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    const premiumKeywords = ['natural', 'neural', 'wavenet', 'google', 'microsoft', 'apple', 'edge'];

    if (gender === 'female') {
      const femaleKeywords = [
        'kore', 'aoede', 'jenny', 'aria', 'samantha', 'zira', 'susan', 'hazel', 
        'female', 'woman', 'girl', 'female_1', 'female_2', 'wavenet-a', 'wavenet-c', 
        'standard-a', 'standard-c', 'uk english female', 'us english female'
      ];
      
      for (const prem of premiumKeywords) {
        for (const fem of femaleKeywords) {
          const found = pool.find(v => 
            v.name.toLowerCase().includes(prem) && v.name.toLowerCase().includes(fem)
          );
          if (found) return found;
        }
      }

      for (const keyword of femaleKeywords) {
        const found = pool.find(v => v.name.toLowerCase().includes(keyword));
        if (found) return found;
      }
      return pool.find(v => v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha')) || pool[0];
    } else {
      const maleKeywords = [
        'fenrir', 'orpheus', 'charon', 'guy', 'david', 'daniel', 'gordon', 'arthur', 'alex', 
        'mark', 'george', 'james', 'richard', 'sam', 'stefan', 'peter', 'paul', 'john', 
        'brian', 'chris', 'eric', 'steve', 'male', 'man', 'boy', 'uk english male', 
        'us english male', 'en-us-x-sfg#male', 'en-us-x-iom', 'male_1', 'male_2', 
        'wavenet-b', 'wavenet-d', 'standard-b', 'standard-d'
      ];

      for (const prem of premiumKeywords) {
        for (const male of maleKeywords) {
          const found = pool.find(v => 
            v.name.toLowerCase().includes(prem) && v.name.toLowerCase().includes(male)
          );
          if (found) return found;
        }
      }

      for (const keyword of maleKeywords) {
        const found = pool.find(v => v.name.toLowerCase().includes(keyword));
        if (found) return found;
      }

      // STRICT MALE PROTECTION: Filter out any known female named voice to prevent mixed voice bleeding
      const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'samantha', 'susan', 'hazel', 'jenny', 'aria', 'kore', 'aoede', 'victoria', 'karen', 'moira', 'fiona', 'veena'];
      const nonFemaleVoices = pool.filter(v => !femaleKeywords.some(fem => v.name.toLowerCase().includes(fem)));
      
      if (nonFemaleVoices.length > 0) {
        return nonFemaleVoices[0];
      }

      return pool[0];
    }
  };

  const changeVoiceGender = (gender: 'male' | 'female', customURI?: string) => {
    setVoiceGender(gender);
    localStorage.setItem('assistant_voice_gender', gender);
    if (customURI !== undefined) {
      setSelectedVoiceURI(customURI);
      localStorage.setItem('assistant_selected_voice_uri', customURI);
    }
    
    toast.success(`Voice set to ${gender === 'female' ? '👩‍🏫 Lady Mentor' : '👨‍🏫 Gentleman Mentor'} (Saved)`, { duration: 2000, id: 'swap-v' });
    
    // Quick speak test
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const testText = gender === 'female' 
        ? "Lady Mentor voice active and locked." 
        : "Gentleman Mentor voice active and locked.";
      const testU = new SpeechSynthesisUtterance(testText);
      
      if (gender === 'male') {
        testU.pitch = 0.65; // Deep masculine resonance
        testU.rate = 0.98;
      } else {
        testU.pitch = 1.12; // Feminine resonance shift
        testU.rate = 1.0;
      }
      
      const v = getSelectedVoice(gender, customURI || selectedVoiceURI);
      if (v) testU.voice = v;
      window.speechSynthesis.speak(testU);
    }
  };

  // Speak text using Gemini HD Voice API with fast 2s timeout or instant SpeechSynthesis Fallback
  const speakText = async (text: string, index?: number) => {
    stopSpeaking();

    if (speakingIndex === index && isSpeaking) {
      return;
    }

    const clean = cleanMarkdownForSpeech(text);
    if (!clean) return;

    // Generous timeout to ensure the real, high-fidelity Gemini voice has time to generate
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: clean.slice(0, 1000),
          voiceMode: voiceGender,
          narrationType: 'standard'
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          audioRef.current.src = data.audioUrl;
          audioRef.current.onplay = () => {
            setIsSpeaking(true);
            if (index !== undefined) setSpeakingIndex(index);
          };
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            setSpeakingIndex(null);
          };
          audioRef.current.onerror = () => {
            speakBrowserFallback(clean, index);
          };
          await audioRef.current.play();
          return;
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("Gemini TTS slow or unavailable, using instant speech engine:", e);
    }

    speakBrowserFallback(clean, index);
  };

  const speakBrowserFallback = (clean: string, index?: number) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    
    // Distinct pitch & rate shifts for unequivocal male vs female character
    if (voiceGender === 'male') {
      utterance.pitch = 0.65; // Deep male pitch
      utterance.rate = 0.98;
    } else {
      utterance.pitch = 1.12; // Warm female pitch
      utterance.rate = 1.0;
    }

    const chosenVoice = getSelectedVoice(voiceGender, selectedVoiceURI);
    if (chosenVoice) utterance.voice = chosenVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (index !== undefined) setSpeakingIndex(index);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingIndex(null);
  };

  // Speech-to-Text Recognition (Single queries with dynamic silence/pause detection)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported on this browser. Try Chrome or Edge!");
      return;
    }

    if (isListening) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Reset transcript trackers
      lastTranscriptRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("🎙️ Listening... speak clearly", { id: 'voice-rec' });
        
        // Initial fallback timer: if no speech is detected at all in 8 seconds, turn off safely
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (!lastTranscriptRef.current.trim()) {
            console.log("No speech heard in 8 seconds. Stopping recognition.");
            try {
              recognition.stop();
            } catch (e) {}
          }
        }, 8000);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        
        if (transcript.trim()) {
          setInput(transcript);
          lastTranscriptRef.current = transcript;

          // Clear any active silence timers as the user is actively speaking
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Trigger silence timer: wait 2.2 seconds of silence before finishing the question
          silenceTimerRef.current = setTimeout(() => {
            console.log("Silence detected. Automatically finalizing speech...");
            try {
              recognition.stop();
            } catch (e) {}
          }, 2200);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error("🎙️ Microphone access blocked. Please allow mic permissions in your browser or click the Share icon to open the app in a new tab!", { duration: 6000, id: 'voice-err-not-allowed' });
        } else if (event.error !== 'no-speech') {
          toast.error(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        const textToSubmit = lastTranscriptRef.current.trim();
        if (textToSubmit) {
          toast.success("📝 Processing spoken query...", { id: 'voice-got', duration: 1500 });
          handleSend(textToSubmit);
          lastTranscriptRef.current = '';
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // LIVE CONVERSATION MODE LOOP (Alexa-like Hands-Free spoken dialogue)
  const startLiveConversation = () => {
    stopSpeaking();
    setIsLiveMode(true);
    setLiveStatus('listening');
    toast.success("🎙️ Live Hands-Free Conversation Started!", { icon: '🤖' });
    
    // Give a brief welcoming voice prompt
    setTimeout(() => {
      speakLiveResponse("Live conversation activated. I am listening, go ahead and ask me anything!");
    }, 300);
  };

  const stopLiveConversation = () => {
    setIsLiveMode(false);
    setLiveStatus('idle');
    if (liveRecognitionRef.current) {
      try {
        liveRecognitionRef.current.stop();
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    toast.success("Live conversation closed.");
  };

  const submitLiveQuestion = async (spoken: string) => {
    if (!spoken.trim() || !isLiveMode) return;
    
    setLiveStatus('thinking');
    setMessages(prev => [...prev, { role: 'user', text: spoken }]);
    
    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      const response = await askGeminiAssistant(spoken, chatHistory, getUserFirstName());
      setMessages(prev => [...prev, { role: 'model', text: response }]);
      speakLiveResponse(response);
    } catch (err) {
      console.error(err);
      speakLiveResponse("I encountered an issue connecting. Please try again.");
    }
  };

  const runLiveListeningLoop = () => {
    if (!isLiveMode) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported.");
      setIsLiveMode(false);
      return;
    }

    // Clear any active silence timers before opening microphone
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      let accumulatedSpeech = '';

      rec.onstart = () => {
        setLiveStatus('listening');
        // Fallback: If no speech at all is detected in 8 seconds, restart or cycle listening safely
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (isLiveMode && !accumulatedSpeech.trim()) {
            console.log("No speech heard in Live Mode fallback. Recycling...");
            try {
              rec.stop();
            } catch (e) {}
            setTimeout(() => runLiveListeningLoop(), 800);
          }
        }, 8000);
      };

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        
        if (transcript.trim()) {
          accumulatedSpeech = transcript;
          
          // Reset silence timers as user continues speaking
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Auto-submit after 2.2 seconds of complete silence
          silenceTimerRef.current = setTimeout(() => {
            if (isLiveMode && accumulatedSpeech.trim()) {
              console.log("Live Mode silence detected. Submitting spoken question...");
              try {
                rec.stop();
              } catch (e) {}
              submitLiveQuestion(accumulatedSpeech);
            }
          }, 2200);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Live Recognition Error:", event.error);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (event.error === 'not-allowed') {
          toast.error("🎙️ Microphone access blocked. Please allow mic permissions in your browser or click the Share icon to open the app in a new tab!", { duration: 6000, id: 'live-err-not-allowed' });
          setIsLiveMode(false);
          setLiveStatus('idle');
        } else if (event.error === 'no-speech') {
          if (isLiveMode) {
            setTimeout(() => runLiveListeningLoop(), 600);
          }
        } else {
          if (isLiveMode) {
            setTimeout(() => runLiveListeningLoop(), 1000);
          }
        }
      };

      rec.onend = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      };

      liveRecognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error(e);
      if (isLiveMode) {
        setTimeout(() => runLiveListeningLoop(), 1000);
      }
    }
  };

  const speakLiveResponse = (text: string) => {
    if (!isLiveMode) return;

    setLiveStatus('speaking');
    const clean = cleanMarkdownForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05; // Slightly faster for conversational flow
    
    if (voiceGender === 'male') {
      utterance.pitch = 0.74; // Masculine pitch
    } else {
      utterance.pitch = 1.12; // Feminine pitch
    }

    const chosenVoice = getSelectedVoice(voiceGender, selectedVoiceURI);
    if (chosenVoice) utterance.voice = chosenVoice;

    utterance.onend = () => {
      // Automatically resume listening!
      if (isLiveMode) {
        setTimeout(() => {
          runLiveListeningLoop();
        }, 350);
      }
    };

    utterance.onerror = () => {
      if (isLiveMode) {
        setTimeout(() => {
          runLiveListeningLoop();
        }, 350);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userPrompt = textToSend.trim();
    setInput('');
    setIsLoading(true);
    stopSpeaking();

    // Append user message
    setMessages(prev => [...prev, { role: 'user', text: userPrompt }]);

    try {
      // Format chat history for Gemini, excluding any error messages
      const chatHistory = messages
        .filter(msg => !msg.text.startsWith("⚠️"))
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      const response = await askGeminiAssistant(userPrompt, chatHistory, getUserFirstName());
      setMessages(prev => [...prev, { role: 'model', text: response }]);

      // Auto-read response if voice mode enabled
      if (autoSpeak) {
        speakText(response, messages.length + 1);
      }
    } catch (err: any) {
      console.error(err);
      const userErrText = err?.message && typeof err.message === 'string' && err.message.length < 300
        ? `⚠️ ${err.message}`
        : "⚠️ Sorry, I encountered a temporary issue connecting to the Gemini server. Please try sending your prompt again.";

      toast.error("Assistant busy. Please try again.");
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: userErrText
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Window Container */}
      <div className="fixed top-20 sm:top-24 right-2 sm:right-6 z-50 flex flex-col items-end pointer-events-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-[calc(100vw-16px)] sm:w-[420px] max-w-[420px] h-[min(550px,80vh)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-2 sm:mb-4 relative pointer-events-auto"
            >
              {/* Live Voice Conversation Overlay (Active when isLiveMode is true) */}
              <AnimatePresence>
                {isLiveMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="absolute inset-0 bg-slate-950/98 text-white z-50 flex flex-col justify-between p-6"
                  >
                    {/* Live Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          Live Voice Call
                        </span>
                      </div>
                      <button
                        onClick={stopLiveConversation}
                        className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all cursor-pointer text-xs font-bold px-2.5 py-1"
                      >
                        Exit Live
                      </button>
                    </div>

                    {/* Live Waveform & Pulse State */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-6">
                      <div className="relative flex items-center justify-center">
                        {/* Immersive pulsing soundwave halo rings */}
                        <motion.div
                          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute w-36 h-36 rounded-full border-2 border-emerald-500/40"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                          className="absolute w-36 h-36 rounded-full border border-emerald-400/20"
                        />

                        {/* Interactive Avatar */}
                        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center relative z-10 shadow-lg shadow-emerald-500/10">
                          <AudioLines size={40} className="text-emerald-400 animate-pulse" />
                        </div>
                      </div>

                      <div className="text-center space-y-2">
                        <h5 className="text-lg font-extrabold capitalize text-slate-100 flex items-center justify-center gap-1.5">
                          {liveStatus === 'listening' && (
                            <>
                              <Ear size={18} className="text-emerald-400 animate-bounce" />
                              <span className="text-emerald-400">Listening to you...</span>
                            </>
                          )}
                          {liveStatus === 'thinking' && (
                            <>
                              <RefreshCw size={18} className="text-amber-400 animate-spin" />
                              <span className="text-amber-400">Thinking...</span>
                            </>
                          )}
                          {liveStatus === 'speaking' && (
                            <>
                              <Volume2 size={18} className="text-blue-400 animate-pulse" />
                              <span className="text-blue-400">AI Speaking...</span>
                            </>
                          )}
                        </h5>
                        <p className="text-slate-400 text-xs font-semibold px-6 leading-relaxed">
                          {liveStatus === 'listening' && "Speak clearly into your microphone. Tap 'Exit' to return to standard text mode."}
                          {liveStatus === 'thinking' && "Analyzing Zambian curriculum files & web data details..."}
                          {liveStatus === 'speaking' && "Hands-free audio dialogue mode. Listening resumes instantly after I finish."}
                        </p>
                      </div>
                    </div>

                    {/* Live Footer Indicator */}
                    <div className="text-center text-[10px] text-slate-500 font-bold border-t border-slate-900 pt-4">
                      Zambian Syllabus Mentor • Fully Hands-Free Loop
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Standard Chat Window Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between relative">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#00A86B]/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                    <Bot size={20} className="text-[#00A86B]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      Teacher's Assistant
                      <Sparkles size={11} className="text-amber-400 animate-pulse" />
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      OBC (2013) & CBC (2024) Mentor
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Live Conversation Mode Trigger Button */}
                  <button
                    onClick={startLiveConversation}
                    className="p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border border-emerald-400/30 hover:scale-102 shadow-xs"
                    title="Enter hands-free continuous live voice call"
                  >
                    <PhoneCall size={12} className="animate-bounce" />
                    <span className="text-[8px] font-extrabold uppercase tracking-tight">Live Voice</span>
                  </button>

                  {/* Standard Voice Toggle */}
                  <button
                    onClick={() => {
                      const next = !autoSpeak;
                      setAutoSpeak(next);
                      localStorage.setItem('assistant_auto_speak', String(next));
                      if (!next) stopSpeaking();
                      toast.success(next ? "🔊 Auto Voice Read Activated" : "🔇 Voice Mode Muted", { duration: 1500 });
                    }}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 border ${
                      autoSpeak
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title={autoSpeak ? "Voice Auto-Read ON" : "Voice Auto-Read OFF"}
                  >
                    {autoSpeak ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    <span className="text-[8px] font-extrabold uppercase">{autoSpeak ? 'Voice' : 'Mute'}</span>
                  </button>

                  {/* Reset Chat Button */}
                  <button
                    onClick={() => {
                      setMessages([
                        {
                          role: 'model',
                          text: "Mwapoleni! I am your **Teacher's Assistant**. Ask me any questions about **Zambian Curriculum Frameworks (OBC 2013 & CBC 2023/2024 Shift)**, lesson planning tips, or global current affairs. You can also chat using **Voice Mode** or enter hands-free **Live Conversation Mode**!"
                        }
                      ]);
                      setIsLoading(false);
                      stopSpeaking();
                      toast.success("Chat reset successfully", { duration: 1500 });
                    }}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                    title="Reset and clear chat"
                  >
                    <RefreshCw size={15} />
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Voice Gender Selection Sub-header Bar */}
              <div className="bg-slate-800 text-slate-300 px-4 py-2 border-b border-slate-700/80 flex flex-col gap-1.5 text-[10px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold uppercase tracking-wider text-slate-400">Mentor Voice:</span>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      {voiceGender === 'male' ? '👨‍🏫 Gentleman' : '👩‍🏫 Lady'} (Locked)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => changeVoiceGender('female')}
                      className={`px-2 py-0.5 rounded-lg font-black uppercase tracking-wider text-[9px] transition-all cursor-pointer flex items-center gap-1 ${
                        voiceGender === 'female'
                          ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      <span>👩‍🏫 Lady</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => changeVoiceGender('male')}
                      className={`px-2 py-0.5 rounded-lg font-black uppercase tracking-wider text-[9px] transition-all cursor-pointer flex items-center gap-1 ${
                        voiceGender === 'male'
                          ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      <span>👨‍🏫 Gentleman</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                      className={`p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer ${
                        showVoiceSettings ? 'bg-slate-700 text-white' : ''
                      }`}
                      title="Custom device voice settings"
                    >
                      <Sparkles size={11} className={showVoiceSettings ? 'text-amber-400' : ''} />
                    </button>
                  </div>
                </div>

                {/* Expandable Voice Customization Drawer */}
                {showVoiceSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 pt-2 border-t border-slate-700/60 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-300">Device Synthesizer Override:</span>
                      <button
                        onClick={() => changeVoiceGender(voiceGender, '')}
                        className="text-[8.5px] text-amber-400 underline hover:text-amber-300 cursor-pointer"
                      >
                        Reset Auto-Select
                      </button>
                    </div>

                    <select
                      value={selectedVoiceURI}
                      onChange={(e) => changeVoiceGender(voiceGender, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg text-[9.5px] text-slate-200 px-2 py-1 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Auto-Detect Neural {voiceGender === 'female' ? 'Lady' : 'Gentleman'} Voice</option>
                      {availableVoices
                        .filter(v => v.lang.toLowerCase().startsWith('en'))
                        .map((v, idx) => (
                          <option key={idx} value={v.voiceURI || v.name}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                    </select>

                    <div className="flex items-center justify-between text-[8.5px] text-slate-400">
                      <span>✓ Voice stays active until manually changed.</span>
                      <button
                        onClick={() => changeVoiceGender(voiceGender)}
                        className="text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Volume1 size={10} /> Test Voice
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Messages body */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60"
              >
                {messages.map((msg, index) => {
                  const isModel = msg.role === 'model';
                  const isThisSpeaking = speakingIndex === index && isSpeaking;

                  return (
                    <div
                      key={index}
                      className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-3xs relative group ${
                          isModel
                            ? 'bg-white border border-slate-200/60 text-slate-700 rounded-tl-none'
                            : 'bg-[#00A86B] text-white rounded-tr-none'
                        }`}
                      >
                        {isModel ? (
                          <>
                            <div className="prose prose-sm max-w-none text-slate-700 prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-white prose-pre:p-2 prose-pre:rounded-lg">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>

                            {/* Speak control button on assistant response */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <button
                                onClick={() => speakText(msg.text, index)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-black transition-all cursor-pointer ${
                                  isThisSpeaking
                                    ? 'bg-emerald-500 text-white animate-pulse'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                <Volume2 size={12} />
                                <span>{isThisSpeaking ? 'Stop Voice' : 'Listen Voice'}</span>
                              </button>

                              {isThisSpeaking && (
                                <div className="flex items-center gap-0.5 text-emerald-600">
                                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex justify-start items-center gap-2">
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-3 flex items-center gap-2 rounded-tl-none shadow-3xs">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#00A86B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#00A86B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#00A86B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs font-black text-[#00A86B] uppercase tracking-wider animate-pulse">Processing...</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoading(false);
                        toast('Cancelled processing', { icon: '⏹️' });
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-white border border-slate-200 rounded-lg hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
                      title="Cancel waiting"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Presets suggestions panel */}
              {messages.length === 1 && (
                <div className="bg-slate-50/80 border-t border-slate-100 p-3 space-y-1.5">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    Quick Curriculum & World Knowledge Queries
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200">
                    {PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(preset.prompt)}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-[10px] text-slate-600 font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 shadow-2xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message input & Voice mic */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 relative"
              >
                {/* Mic Speech-to-Text Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-rose-300 ring-2 ring-rose-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                  title={isListening ? "Listening... click to stop" : "Speak question (Voice Chat)"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening... speak now..." : "Ask guidelines, OBC/CBC, global news..."}
                  disabled={isLoading}
                  className={`flex-1 border rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-all disabled:opacity-50 ${
                    isListening 
                      ? 'bg-rose-50 border-rose-300 text-rose-900 placeholder:text-rose-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-[#00A86B]'
                  }`}
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-[#00A86B] hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button - Positioned in the Top-Right Corner */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, x: 100 }}
            animate={{ 
              scale: isVisible ? 1 : 0, 
              opacity: isVisible ? 1 : 0,
              x: isVisible ? 0 : 100
            }}
            exit={{ scale: 0, opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 220, damping: 25 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed top-24 right-2 z-40 bg-gradient-to-r from-slate-950 to-[#02131b] text-white border border-emerald-500/80 p-1.5 sm:p-2 rounded-full shadow-2xl flex items-center gap-1 active:scale-95 group cursor-pointer"
            title="Open CBC & OBC AI Mentor Assistant"
          >
            <div className="relative">
              <Bot size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-[8.5px] font-extrabold uppercase tracking-tight text-emerald-300 pr-1">AI Assistant</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

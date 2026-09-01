import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Bot, HelpCircle, GraduationCap, ChevronDown, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askGeminiAssistant } from '../services/geminiService';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const PRESETS = [
  { label: "CDC Syllabus Tips", prompt: "What are some best practices and tips for aligning my lesson plans with the Zambian CDC (Curriculum Development Centre) syllabus guidelines?" },
  { label: "Teaching OBE/OBC", prompt: "How do I structure my classroom activities to implement Outcome-Based Education (OBE/OBC) in Zambia effectively?" },
  { label: "PLP Literacy Guidance", prompt: "Explain the Primary Literacy Programme (PLP) framework in Zambia and how I can construct a lesson targeting phonics and syllable reading." },
  { label: "Lesson Introduction Draft", prompt: "Draft a creative, 5-minute warm-up introduction activity for a Grade 5 Mathematics lesson on fractions under the Zambian curriculum." }
];

export function TeachersAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Mwapoleni! I am your **Teacher's Assistant**. Ask me any questions about **Zambian Curriculum Guidelines (CDC, OBC/OBE, PLP)**, lesson plan tips, or teaching methods. How can I support your classroom today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userPrompt = textToSend.trim();
    setInput('');
    setIsLoading(true);

    // Append user message
    setMessages(prev => [...prev, { role: 'user', text: userPrompt }]);

    try {
      // Format chat history for Gemini
      const chatHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await askGeminiAssistant(userPrompt, chatHistory);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to connect to the assistant. Please try again.");
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "⚠️ Sorry, I encountered an issue connecting to the Gemini server. Please check your internet connection or try again shortly." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-100/90 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
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
                    Zambian Curriculum Mentor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar"
            >
              {messages.map((msg, index) => {
                const isModel = msg.role === 'model';
                return (
                  <div
                    key={index}
                    className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-3xs ${
                        isModel
                          ? 'bg-white border border-slate-200/60 text-slate-700 rounded-tl-none'
                          : 'bg-[#00A86B] text-white rounded-tr-none'
                      }`}
                    >
                      {isModel ? (
                        <div className="prose prose-sm max-w-none text-slate-700 prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-white prose-pre:p-2 prose-pre:rounded-lg">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-3 flex items-center gap-1.5 rounded-tl-none">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Presets suggestions panel (Scrollable horizontally) */}
            {messages.length === 1 && (
              <div className="bg-slate-50/80 border-t border-slate-100 p-3 space-y-1.5">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <HelpCircle size={10} className="text-slate-400" />
                  Quick Curriculum Suggestions
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200">
                  {PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(preset.prompt)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200/70 hover:border-emerald-500 hover:bg-emerald-50/20 text-[9.5px] font-bold text-slate-600 hover:text-emerald-800 rounded-xl transition-all shadow-3xs cursor-pointer shrink-0"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask guidelines, lesson tips..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-[#00A86B] transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-[#00A86B] hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button Bubble */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-[#00A86B] text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all cursor-pointer relative group border-2 border-white"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={20} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Bot size={20} />
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* Tooltip badge */}
        {!isOpen && (
          <span className="absolute right-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
            Teacher's Assistant
          </span>
        )}
      </motion.button>
    </div>
  );
}

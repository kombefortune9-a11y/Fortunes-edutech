import { safeLocalStorage } from "../lib/storage";
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GraduationCap, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    try {
      try { localStorage.clear(); } catch(e) {};
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage during reset:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap size={36} />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                <AlertTriangle size={12} /> Recovery Mode
              </span>
              <h1 className="text-xl font-black tracking-tight text-white uppercase">
                Fortunes Edutech
              </h1>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                An unexpected display state occurred while loading the application interface.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-900/80 border border-slate-700/50 p-3 rounded-xl text-left">
                <p className="text-[10px] font-mono text-emerald-400 break-words leading-tight">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-[#00A86B] hover:bg-emerald-600 text-white py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 active:scale-95"
              >
                <RotateCcw size={16} />
                <span>Reload Platform & Reset Session</span>
              </button>
              
              <p className="text-[10px] text-slate-400 font-medium">
                Clicking above will clear temporary session cache and reload the workspace.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

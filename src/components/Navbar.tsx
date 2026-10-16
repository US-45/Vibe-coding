import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Cpu, 
  ShieldCheck, 
  FileText, 
  Sparkles,
  GitCompare
} from 'lucide-react';
import { SignalMode } from '../types/simulation';

interface NavbarProps {
  isRunning: boolean;
  isPaused: boolean;
  signalMode: SignalMode;
  elapsedTime: number;
  onOpenDemoTour: () => void;
  onOpenPrivacy: () => void;
  viewMode: 'single' | 'arena';
  onToggleViewMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isRunning,
  isPaused,
  signalMode,
  elapsedTime,
  onOpenDemoTour,
  onOpenPrivacy,
  viewMode,
  onToggleViewMode,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-[#1C1919] border-b border-[#413939] px-4 lg:px-8 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Wordmark */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#242020] border border-[#532121] flex items-center justify-center shadow-inner">
            <svg 
              className="w-5 h-5 text-[#A41717]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 3v18" />
              <path d="M3 12h18" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-wider text-[#F2EEEE] font-sans">SMARTJUNCTION</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#A41717]/20 text-[#FFA4A4] border border-[#A41717]/40">
                PRO 2.0
              </span>
            </div>
            <p className="text-[11px] text-[#A4A4A4] hidden sm:block">Intelligent 4-Way Traffic Operations</p>
          </div>
        </div>

        {/* Live Simulation Status Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#242020] border border-[#413939] text-xs">
            <span className={`w-2 h-2 rounded-full ${
              isRunning && !isPaused 
                ? 'bg-[#39B86B] animate-pulse' 
                : isPaused 
                  ? 'bg-[#F2B544]' 
                  : 'bg-[#777171]'
            }`} />
            <span className="text-[#F2EEEE] font-medium hidden md:inline">Status:</span>
            <span className="font-bold text-[11px] uppercase tracking-wide text-[#F2EEEE]">
              {isRunning && !isPaused ? 'SIMULATING' : isPaused ? 'PAUSED' : 'STANDBY'}
            </span>
          </div>

          {/* Mode Badge */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${
            signalMode === 'adaptive'
              ? 'bg-[#B59447]/15 border-[#B59447] text-[#E2C785]'
              : 'bg-[#242020] border-[#413939] text-[#A4A4A4]'
          }`}>
            <Cpu className="w-3.5 h-3.5 text-[#B59447]" />
            <span>{signalMode === 'adaptive' ? 'ADAPTIVE AI' : 'FIXED CYCLE'}</span>
          </div>

          {/* Elapsed Timer */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#242020] border border-[#413939] text-xs font-mono text-[#F2EEEE]">
            <Clock className="w-3.5 h-3.5 text-[#A4A4A4]" />
            <span className="tabular-nums font-bold">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* Quick Modal Triggers */}
        <div className="flex items-center space-x-2">
          {/* Side-by-Side Dual Arena Toggle */}
          <button
            onClick={onToggleViewMode}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              viewMode === 'arena'
                ? 'bg-[#B59447] text-black font-bold border-[#B59447]'
                : 'bg-[#242020] text-[#E2C785] border-[#B59447]/40 hover:bg-[#302A2A]'
            }`}
            title="Side-by-side comparison arena"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{viewMode === 'arena' ? 'Single View' : 'Live Arena'}</span>
          </button>

          {/* 3-Min Demo Script */}
          <button
            onClick={onOpenDemoTour}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium bg-[#A41717] hover:bg-[#c21e1e] text-white transition-colors shadow-sm"
            title="3-minute judge demo script and walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3-Min Demo</span>
          </button>

          {/* Privacy & DPDP Notice */}
          <button
            onClick={onOpenPrivacy}
            className="flex items-center space-x-1 px-2 py-1.5 rounded text-xs font-medium bg-[#242020] hover:bg-[#302A2A] text-[#A4A4A4] hover:text-[#F2EEEE] border border-[#413939] transition-colors"
            title="DPDP Act 2023 Compliance & Zero Telemetry"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#39B86B]" />
          </button>
        </div>
      </div>
    </header>
  );
};

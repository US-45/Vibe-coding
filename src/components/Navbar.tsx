import React from 'react';
import { 
  Clock, 
  ShieldCheck, 
  Sun, 
  Moon,
  Box,
  Layers
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number;
  onOpenPrivacy: () => void;
  onNavigate: (section: 'simulation' | 'analytics' | 'about') => void;
  viewDimension?: '2D' | '3D';
  onToggleDimension?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isRunning,
  isPaused,
  elapsedTime,
  onOpenPrivacy,
  onNavigate,
  viewDimension = '2D',
  onToggleDimension,
}) => {
  const { mode, toggleMode, currentTheme } = useTheme();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 sticky top-0 z-40 transition-colors duration-250">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Identity & Descriptor */}
        <div 
          className="flex items-center space-x-3 shrink-0 cursor-pointer group"
          onClick={() => onNavigate('simulation')}
          title="SmartJunction Overview"
        >
          {/* Custom Geometric 4-way intersection symbol */}
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#0284C7] transition-all">
            <svg 
              className="w-full h-full transition-transform group-hover:rotate-90 duration-500" 
              style={{ color: currentTheme.color }}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeOpacity="0.4" fill="none" />
              <path d="M12 3v18" stroke="currentColor" strokeWidth="2.5" />
              <path d="M3 12h18" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[var(--text-primary)] font-sans">
                SmartJunction
              </span>
              <span 
                className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] font-semibold text-[#0284C7]"
              >
                v2.4
              </span>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-[var(--text-secondary)] uppercase hidden sm:block">
              Traffic Intelligence Simulator
            </div>
          </div>
        </div>

        {/* Top Right: ONE COMBINED NAVBAR DOCK */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
          {/* 1. Integrated Navigation Links */}
          <div className="flex items-center space-x-0.5 bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
            <button
              onClick={() => onNavigate('simulation')}
              className="px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            >
              Simulation
            </button>
            <button
              onClick={() => onNavigate('analytics')}
              className="px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            >
              Analytics
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            >
              About
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-[var(--border-color)] mx-0.5 hidden xs:block" />

          {/* 2. Live Status Badge */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-xs font-mono border border-[var(--border-subtle)]">
            <span className={`w-2 h-2 rounded-full ${
              isRunning && !isPaused 
                ? 'bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse' 
                : isPaused 
                  ? 'bg-[#F59E0B]' 
                  : 'bg-[var(--text-secondary)]'
            }`} />
            <span className="text-[11px] font-bold text-[var(--text-primary)]">
              {isRunning && !isPaused ? 'LIVE' : isPaused ? 'PAUSED' : 'IDLE'}
            </span>
          </div>

          {/* 3. Session Timer */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-xs font-mono font-bold text-[var(--text-primary)] border border-[var(--border-subtle)]">
            <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="tabular-nums text-[11px]">{formatTime(elapsedTime)}</span>
          </div>

          {/* 4. 2D / 3D Model Quick Switcher */}
          {onToggleDimension && (
            <button
              onClick={onToggleDimension}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center space-x-1.5 transition-all touch-target-min"
              title="Toggle between 2D Top-Down Plan and 3D WebGL Model"
              aria-label="Toggle 2D/3D view"
            >
              {viewDimension === '3D' ? (
                <>
                  <Layers className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[11px] font-bold text-[#10B981]">3D</span>
                </>
              ) : (
                <>
                  <Box className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">2D</span>
                </>
              )}
            </button>
          )}

          {/* 5. Light / Dark Theme Switcher */}
          <button
            onClick={toggleMode}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center space-x-1.5 transition-all touch-target-min"
            title={mode === 'dark' ? 'Switch to Cool Grey Theme' : 'Switch to Dark Theme (Asphalt Noir)'}
            aria-label="Toggle light or dark theme"
          >
            {mode === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="hidden xl:inline text-[11px] font-medium text-[var(--text-secondary)]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#6366F1]" />
                <span className="hidden xl:inline text-[11px] font-medium text-[var(--text-secondary)]">Dark</span>
              </>
            )}
          </button>

          {/* 6. DPDP Privacy Shield */}
          <button
            onClick={onOpenPrivacy}
            className="p-1.5 sm:p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-secondary)] hover:text-[#10B981] border border-[var(--border-subtle)] transition-colors touch-target-min"
            title="DPDP Act, 2023 Compliant (Zero Telemetry)"
            aria-label="DPDP Act Compliance"
          >
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          </button>
        </div>
      </div>
    </header>
  );
};

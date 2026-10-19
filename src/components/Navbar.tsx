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
    <header className="bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 sticky top-0 z-40 transition-colors duration-250">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Brand Identity & Sub-descriptor */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Custom Geometric 4-way intersection symbol */}
          <div 
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center p-1.5 shadow-sm group transition-all cursor-pointer"
            onClick={() => onNavigate('simulation')}
            title="SmartJunction Home"
          >
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
              <span 
                className="font-extrabold text-sm sm:text-base tracking-tight text-[var(--text-primary)] font-sans cursor-pointer hover:opacity-90"
                onClick={() => onNavigate('simulation')}
              >
                SmartJunction
              </span>
              <span 
                className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] font-semibold"
                style={{ color: currentTheme.color }}
              >
                v2.4
              </span>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-[var(--text-secondary)] uppercase hidden sm:block">
              Traffic Intelligence Simulator
            </div>
          </div>
        </div>

        {/* Center: Clean Segmented Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-color)] text-xs font-medium">
          <button
            onClick={() => onNavigate('simulation')}
            className="px-3.5 py-1.5 rounded-md text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            Simulation
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className="px-3.5 py-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            Analytics
          </button>
          <button
            onClick={() => onNavigate('about')}
            className="px-3.5 py-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            About
          </button>
        </nav>

        {/* Right: Operational Telemetry & System Utilities */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Live / Paused / Standby System Status Badge */}
          <div className="hidden xs:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs">
            <span className={`w-2 h-2 rounded-full ${
              isRunning && !isPaused 
                ? 'bg-[#36D98A] shadow-[0_0_8px_#36D98A] animate-pulse' 
                : isPaused 
                  ? 'bg-[#FFBD59]' 
                  : 'bg-[var(--text-secondary)]'
            }`} />
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wide">
              {isRunning && !isPaused ? 'LIVE' : isPaused ? 'PAUSED' : 'STANDBY'}
            </span>
          </div>

          {/* Tabular Session Clock */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)]">
            <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="tabular-nums font-bold text-[11px] sm:text-xs">{formatTime(elapsedTime)}</span>
          </div>

          {/* 2D Plan / 3D Model View Quick Toggle (if available) */}
          {onToggleDimension && (
            <button
              onClick={onToggleDimension}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-primary)] transition-all touch-target-min"
              title="Toggle between 2D Top-Down Canvas and 3D WebGL Model"
              aria-label="Toggle between 2D and 3D view"
            >
              {viewDimension === '3D' ? (
                <>
                  <Layers className="w-3.5 h-3.5 text-[#36D98A]" />
                  <span className="hidden sm:inline font-semibold">3D Model</span>
                </>
              ) : (
                <>
                  <Box className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="hidden sm:inline font-medium text-[var(--text-secondary)]">2D Plan</span>
                </>
              )}
            </button>
          )}

          {/* Light / Dark Theme Switcher Toggle */}
          <button
            onClick={toggleMode}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] transition-all flex items-center space-x-1.5 shadow-sm touch-target-min"
            title={mode === 'dark' ? 'Switch to Cool Light Theme' : 'Switch to Dark Theme (Asphalt Noir)'}
            aria-label={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {mode === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-[#FFBD59] sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline text-[11px] font-semibold text-[var(--text-secondary)]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#0284C7] sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline text-[11px] font-semibold text-[var(--text-secondary)]">Dark</span>
              </>
            )}
          </button>

          {/* Privacy & Zero-Telemetry Badge */}
          <button
            onClick={onOpenPrivacy}
            className="p-1.5 sm:p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-elevated)] text-[var(--text-secondary)] hover:text-[#36D98A] border border-[var(--border-color)] transition-colors touch-target-min"
            title="DPDP Act, 2023 Compliance & Zero Telemetry"
            aria-label="Privacy & DPDP Act Compliance"
          >
            <ShieldCheck className="w-4 h-4 text-[#36D98A]" />
          </button>
        </div>
      </div>
    </header>
  );
};
